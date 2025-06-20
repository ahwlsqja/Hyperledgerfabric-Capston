import { Injectable, Logger } from '@nestjs/common';
import * as FabricCAServices from 'fabric-ca-client';
import { Wallets, Gateway } from 'fabric-network';
import * as path from 'path';
import * as fs from 'fs';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class FabricService {
  private readonly logger = new Logger(FabricService.name);
  private readonly adminUserId = 'admin';
  private readonly adminUserPasswd = 'adminpw';

  constructor(
    private firebaseService: FirebaseService,
  ) {}


  // ca클라이언트 만들기
  buildCAClient(orgName: string): FabricCAServices {
    const ccp = this.getCCP(orgName);
    const caHostName = `ca-${orgName}`;
    const caInfo = ccp.certificateAuthorities[caHostName];
    const caTLSCACerts = caInfo.tlsCACerts.pem;
    const caClient = new FabricCAServices(
      caInfo.url,
      { trustedRoots: caTLSCACerts, verify: true },
      caInfo.caName,
    );

    this.logger.log(`${caInfo.caName} 이름의 유저가 생성되었습니다!`);
    return caClient;
  }


  // connection-profile에서 가져오기
  getCCP(orgName: string): any {
    let ccp;
    const ccpPath = path.resolve(
      __dirname,
      '../../config/connection-profiles',
      `connection-${orgName}-local.json`,
    );

    if (!fs.existsSync(ccpPath)) {
      throw new Error(`경로가 없습니다!: ${ccpPath}`);
    }

    const contents = fs.readFileSync(ccpPath, 'utf8');
    ccp = JSON.parse(contents);

    this.logger.log(`다음 경로로 부터 생성하였습니다: ${ccpPath}`);
    return ccp;
  }


  // 메모리에서 지갑 생성(영속성을 파베에 만들기 때문pod라서)
  async buildWallet(userId: string): Promise<any> {
    return await Wallets.newInMemoryWallet();
  }


  // 어드민 등록
  async enrollAdmin(orgName: string): Promise<void> {
    try {
      const caClient = this.buildCAClient(orgName);
      const wallet = await this.buildWallet('admin');
      const ccp = this.getCCP(orgName)
      const mspId = ccp.organization[orgName].mspid

      // 지갑에 어드민 있는지 확인
      const identity = await wallet.get(this.adminUserId);
      if (identity) {
        this.logger.log(
          '이미 admin이 지갑에 존재합니다!',
        );
        return;
      }

      // 어드민 등록
      const enrollment = await caClient.enroll({
        enrollmentID: this.adminUserId,
        enrollmentSecret: this.adminUserPasswd,
      });

      const x509Identity = {
        credentials: {
          certificate: enrollment.certificate,
          privateKey: enrollment.key.toBytes(),
        },
        mspId: mspId,
        type: 'X.509',
      };

      // 어드민 파이어베이스에 저장
      await this.firebaseService.storeUserCredentials(
        this.adminUserId,
        x509Identity,
      );

      // 지갑에도 저장
      await wallet.put(this.adminUserId, x509Identity);
      this.logger.log(
        '성공적으로 어드민이 지갑에 생성되었습니다!',
      );
    } catch (error) {
      this.logger.error(`어드민 생성에 실패했습니다!: ${error}`);
      throw error;
    }
  }


  // 새로운 유저 등록
  async registerAndEnrollUser(
    userId: string,
    orgName: string,
  ): Promise<void> {
    try {
      const caClient = this.buildCAClient(orgName);
      const wallet = await this.buildWallet(userId);
      const ccp = this.getCCP(orgName)
      const mspId = ccp.organization[orgName].mspid

      // 영속성 데이터 베이스인 파이어 베이스에 신원이 존재하는지 검사
      const userExists = await this.firebaseService.userExists(userId);
      if (userExists) {
        this.logger.log(
          `${userId} 신원이 이미 존재합니다!`,
        );
        return;
      }

      // 어드민 있는지 확인
      await this.enrollAdmin(orgName);

      // 파이어 베이스에서 어드민 신원 가져옴(인증서, 비밀키)
      const adminIdentity = await this.firebaseService.getUserCredentials(
        this.adminUserId,
      );
      
      // 지갑에 어드민 신원 넣음
      await wallet.put(this.adminUserId, adminIdentity);

      // 유저 빌드함
      const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
      const adminUser = await provider.getUserContext(
        adminIdentity,
        this.adminUserId,
      );

      // 유저 생성
      const affiliation = `${orgName}`
      const secret = await caClient.register(
        {
          affiliation,
          enrollmentID: userId,
          role: 'client',
        },
        adminUser,
      );

      // 유저 등록
      const enrollment = await caClient.enroll({
        enrollmentID: userId,
        enrollmentSecret: secret,
      });

      const x509Identity = {
        credentials: {
          certificate: enrollment.certificate,
          privateKey: enrollment.key.toBytes(),
        },
        mspId: mspId,
        type: 'X.509',
      };

      // 파이어 베이스에 저장
      await this.firebaseService.storeUserCredentials(userId, x509Identity);

      // 지갑에도 저장
      await wallet.put(userId, x509Identity);
      this.logger.log(
        `성공적으로 ${userId} 신원이 생성되었습니다!`,
      );
    } catch (error) {
      this.logger.error(`유저 등록이 실패했습니다!: ${error}`);
      throw error;
    }
  }


  // 트랜잭션 실행
  async executeTransaction(
    userId: string,
    orgName: string,
    channelName: string,
    chaincodeName: string,
    transactionName: string,
    ...args: string[]
  ): Promise<any> {
    try {
      // 프로필에 연결
      const ccp = this.getCCP(orgName);
      
      // 메모리에 지갑 연결
      const wallet = await this.buildWallet(userId);
      
      // 파이어베이스에서 인증서와 비밀키 가져옴
      const userIdentity = await this.firebaseService.getUserCredentials(userId);
      
      // 지갑에 저장
      await wallet.put(userId, userIdentity);
      
      // 게이트웨어 연결
      const gateway = new Gateway();
      await gateway.connect(ccp, {
        wallet,
        identity: userId,
        discovery: { enabled: true, asLocalhost: false },
      });
      
      // 네트워크와 컨트렉트 가져옴
      const network = await gateway.getNetwork(channelName);
      const contract = network.getContract(chaincodeName);
      
      // 트랜잭션 제출
      const result = await contract.submitTransaction(transactionName, ...args);
      
      // 트랜잭션 완료 후 연결끊음
      gateway.disconnect();
      
      return result.toString();
    } catch (error) {
      this.logger.error(`트랜잭션에 실패했습니다!: ${error}`);
      throw error;
    }
  }


  // 블록체인에 쿼리
  async queryTransaction(
    userId: string,
    orgName: string,
    channelName: string,
    chaincodeName: string,
    transactionName: string,
    ...args: string[]
  ): Promise<any> {
    try {
      // orgName으로 프로필 가져옴
      const ccp = this.getCCP(orgName);
      
      // 인메모리 지갑 생성
      const wallet = await this.buildWallet(userId);
      
      // 파이어베이스에서 인증서/비밀키 가져옴
      const userIdentity = await this.firebaseService.getUserCredentials(userId);
      
      // 지갑에 저장
      await wallet.put(userId, userIdentity);
      
      // 게이트웨이 생성
      const gateway = new Gateway();
      await gateway.connect(ccp, {
        wallet,
        identity: userId,
        discovery: { enabled: true, asLocalhost: false },
      });
      
      // 네트워크와 컨트렉트 생성
      const network = await gateway.getNetwork(channelName);
      const contract = network.getContract(chaincodeName);
      
      // 쿼리 날림
      const result = await contract.evaluateTransaction(transactionName, ...args);
      
      // 게이트웨이 종료
      gateway.disconnect();
      
      return JSON.parse(result.toString());
    } catch (error) {
      this.logger.error(`쿼리 트랜잭션이 실패했습니다!: ${error}`);
      throw error;
    }
  }


  // 체인코드 이벤트에 대한 이벤트 리스너 등록
  async registerEventListener(
    userId: string,
    orgName: string,
    channelName: string,
    chaincodeName: string,
    eventName: string,
    callback: (event: any) => void,
  ): Promise<any> {
    try {   
      // 프로필 가져오기
      const ccp = this.getCCP(orgName);
      
      // 지갑 필드
      const wallet = await this.buildWallet(userId);
      
      // 파이어베이스에서 가져옴(인증서/비밀키)
      const userIdentity = await this.firebaseService.getUserCredentials(userId);
      
      // 지갑에 저장
      await wallet.put(userId, userIdentity);
      
      // 연결과 게이트웨이 생성
      const gateway = new Gateway();
      await gateway.connect(ccp, {
        wallet,
        identity: userId,
        discovery: { enabled: true, asLocalhost: false },
      });
      
      // 컨트랙트와 게이트웨이 생성
      const network = await gateway.getNetwork(channelName);
      const contract = network.getContract(chaincodeName);
      
      // 이벤트 리스너 생성
      const listener = await contract.addContractListener(
        async (event) => {
          if (event.eventName === eventName) {
            callback(event);
          }
        },
      );
      
      return listener;
    } catch (error) {
      this.logger.error(`이벤트리스너 생성에 실패했습니다!: ${error}`);
      throw error;
    }
  }
}