// src/modules/ledger/ledger.service.ts
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FabricService } from '../fabric/fabric.service';
import { FirebaseService } from '../firebase/firebase.service';
import { Cron } from '@nestjs/schedule';
import { StreamsPublisherService } from 'src/redis/streams-publisher.service';
import { Repository } from 'typeorm';
import { LedgerEntryStatus, LedgerEntryType } from 'src/types';
import { Ledger } from './entity/ledger.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class LedgerService {
  private readonly logger = new Logger(LedgerService.name);
  private readonly channelName: string;
  private readonly chaincodeName: string;

  constructor(
    private configService: ConfigService,
    private fabricService: FabricService,
    private publisherService: StreamsPublisherService, // PublisherService로 변경
    private firebaseService: FirebaseService,
    @InjectRepository(Ledger)
    private readonly ledgerRepository: Repository<Ledger>,
  ) {
    this.channelName = this.configService.get<string>('CHANNEL_NAME', 'mychannel');
    this.chaincodeName = this.configService.get<string>('CHAINCODE_NAME', 'organization');
  }

  /**
   * 입금 항목 추가
   */
  async addDepositEntry(
    userId: string,
    theme: string,
    amount: string,
    description: string,
    documentURL: string,
  ): Promise<any> {
    try {
      // 파이어베이스에서 사용자 정보 가져오기
      const userInfo = await this.firebaseService.getUserInfo(userId);
      
      // 사용자가 학생인지 확인 (학생회 구성원은 불가)
      if (userInfo.orgType !== 'STUDENT') {
        throw new Error('학생만 입금 항목을 추가할 수 있습니다');
      }

      const orgName = 'student';

      // 입금 항목 추가 트랜잭션 실행
      const result = await this.fabricService.executeTransaction(
        userId,
        orgName,
        this.channelName,
        this.chaincodeName,
        'AddDepositEntry',
        theme,
        amount,
        description,
        documentURL,
      );

      const ledgerEntryId = result;

      return {
        success: true,
        ledgerEntryId,
        message: '입금 항목이 성공적으로 추가되었습니다',
      };
    } catch (error) {
      this.logger.error(`입금 항목 추가 실패: ${error}`);
      // await this.publisherService.publishBlockchainEvent(
      //   'ERROR_CHANNEL',
      //   {
      //     requestType: `ADD_DEPOSIT`,
      //     userId: userId,
      //     theme: theme,
      //     success: false,
      //     error: error.message,
      //   },
      // )
      throw error;
    }
  }


  // 장부 생성
  async createLedger(userId: string, amount: number, theme: string, type: LedgerEntryType, documentURL: string) {

    const createObj = this.ledgerRepository.create({
      userId,
      amount,
      theme,
      type,
      documentURL,
    });

    return await this.ledgerRepository.save(createObj);
  }

  // 입금 거절
  async rejectDeposit(ledgerEntryId: string, approverId: string) {
    const deposit = await this.ledgerRepository.findOne({
      where: {
        id: ledgerEntryId,
      }
    })

    if(deposit?.status !== LedgerEntryStatus.PENDING){
      throw new InternalServerErrorException("이미 거절 상태거나 승인 상태 입니다!!!")
    }

    const updatedRejects = deposit.rejections || [];
    updatedRejects.push(approverId);
    
    // 레저 리턴할지 고민중
    const updateObj = this.ledgerRepository.update(ledgerEntryId, {
      rejections: updatedRejects,
      status: LedgerEntryStatus.APPROVED
    });

    return updateObj;
  }
  
  // 입금 수락
  async approveDeposit(ledgerEntryId: string, approverId: string) {
    const deposit = await this.ledgerRepository.findOne({
      where: {
        id: ledgerEntryId,
      }
    })

    if(deposit?.status !== LedgerEntryStatus.PENDING){
      throw new InternalServerErrorException("이미 거절 상태거나 승인 상태 입니다!!!")
    }

    const updatedApprovals = deposit.approvals || [];
    
    updatedApprovals.push(approverId);
    
    // 레저 리턴할지 고민중
    const updateObj = this.ledgerRepository.update(ledgerEntryId, {
      approvals: updatedApprovals,
      status: LedgerEntryStatus.APPROVED
    });

    return updateObj;
  }

  // 대기 중인 입금 항목 조회
  async getPendingDeposit() {
    const deposits = await this.ledgerRepository.find({
      where: {
        status: LedgerEntryStatus.PENDING,
        type: LedgerEntryType.DEPOSIT
      }
    })

    if(deposits.length === 0){
      throw new InternalServerErrorException("팬딩 중인 것이 없음.")
    }

    return deposits;
  }
  // 출금 중인 항목 조회
  async getPendingWithdraw() {
    const withdraws = await this.ledgerRepository.find({
      where: {
        status: LedgerEntryStatus.PENDING,
        type: LedgerEntryType.WITHDRAW
      }
    })

    if(withdraws.length === 0){
      throw new InternalServerErrorException("팬딩 중인 것이 없음.")
    }

    return withdraws;
  }


  

  /**
   * 출금 항목 추가
   */
  async addWithdrawEntry(
    userId: string,
    theme: string,
    amount: string,
    description: string,
    documentURL: string,
  ): Promise<any> {
    try {
      // 파이어베이스에서 사용자 정보 가져오기
      const userInfo = await this.firebaseService.getUserInfo(userId);
      
      // 사용자가 학생회 구성원인지 확인
      if (userInfo.orgType !== 'STUDENT_COUNCIL') {
        throw new Error('학생회 구성원만 출금 항목을 추가할 수 있습니다');
      }

      const orgName = 'student-council';

      // 출금 항목 추가 트랜잭션 실행
      const result = await this.fabricService.executeTransaction(
        userId,
        orgName,
        this.channelName,
        this.chaincodeName,
        'AddWithdrawEntry',
        theme,
        amount,
        description,
        documentURL,
      );

      const ledgerEntryId = result;

      return {
        success: true,
        ledgerEntryId,
        message: '출금 항목이 성공적으로 추가되었습니다',
      };
    } catch (error) {
      this.logger.error(`출금 항목 추가 실패: ${error}`);
      // await this.publisherService.publishBlockchainEvent(
      //   'ERROR_CHANNEL',
      //   {
      //     requestType: `ADD_WITHDRAW`,
      //     userId: userId,
      //     theme: theme,
      //     success: false,
      //     error: error.message,
      //   },
      // )
      throw error;
    }
  }

  /**
   * 입금 항목 승인
   */
  async approveDepositEntry(ledgerEntryId: string, approverId: string): Promise<any> {
    try {
      // 파이어베이스에서 승인자 정보 가져오기
      const approverInfo = await this.firebaseService.getUserInfo(approverId);
      
      // 승인자가 학생회 구성원인지 확인
      if (approverInfo.orgType !== 'STUDENT_COUNCIL') {
        throw new Error('학생회 구성원만 입금 항목을 승인할 수 있습니다');
      }

      const orgName = 'student-council';

      // 입금 항목 승인 트랜잭션 실행
      await this.fabricService.executeTransaction(
        approverId,
        orgName,
        this.channelName,
        this.chaincodeName,
        'ApproveDepositEntry',
        ledgerEntryId,
      );

      // 대기 중인 입금 항목 캐시 무효화
      // await this.publisherService.cacheDelete('ledger:pending-deposits');
      
      // // 테마 잔액 캐시 무효화
      // await this.publisherService.cacheDelete('ledger:theme-balances');

      return {
        success: true,
        message: `입금 항목 ${ledgerEntryId} 승인 완료`,
      };
    } catch (error) {
      this.logger.error(`입금 항목 승인 실패: ${error}`);
      
      throw error;
    }
  }

  /**
   * 입금 항목 거부
   */
  async rejectDepositEntry(ledgerEntryId: string, rejectorId: string): Promise<any> {
    try {
      // 파이어베이스에서 거부자 정보 가져오기
      const rejectorInfo = await this.firebaseService.getUserInfo(rejectorId);
      
      // 거부자가 학생회 구성원인지 확인
      if (rejectorInfo.orgType !== 'STUDENT_COUNCIL') {
        throw new Error('학생회 구성원만 입금 항목을 거부할 수 있습니다');
      }

      const orgName = 'student-council';

      // 입금 항목 거부 트랜잭션 실행
      await this.fabricService.executeTransaction(
        rejectorId,
        orgName,
        this.channelName,
        this.chaincodeName,
        'RejectDepositEntry',
        ledgerEntryId,
      );

      // 대기 중인 입금 항목 캐시 무효화
      // await this.publisherService.cacheDelete('ledger:pending-deposits');

      return {
        success: true,
        message: `입금 항목 ${ledgerEntryId} 거부 완료`,
      };
    } catch (error) {
      this.logger.error(`입금 항목 거부 실패: ${error}`);
    
      
      throw error;
    }
  }

  /**
   * 출금 항목 투표
   */
  async voteWithdrawEntry(
    ledgerEntryId: string,
    voterId: string,
    vote: 'approve' | 'reject',
  ): Promise<any> {
    try {
      // 파이어베이스에서 투표자 정보 가져오기
      const voterInfo = await this.firebaseService.getUserInfo(voterId);
      
      // 투표자가 학생이고 학생회 구성원이 아닌지 확인
      if (voterInfo.orgType !== 'STUDENT') {
        throw new Error('학생만 출금 항목에 투표할 수 있습니다');
      }

      const orgName = 'student';

      // 출금 항목 투표 트랜잭션 실행
      await this.fabricService.executeTransaction(
        voterId,
        orgName,
        this.channelName,
        this.chaincodeName,
        'VoteWithdrawEntry',
        ledgerEntryId,
        vote.toUpperCase(),
      );

      // 출금 투표 상태 조회
      const voteStatus = await this.fabricService.queryTransaction(
        voterId,
        orgName,
        this.channelName,
        this.chaincodeName,
        'GetWithdrawVoteStatus',
        ledgerEntryId,
      );


      return {
        success: true,
        message: `출금 항목 ${ledgerEntryId}에 대한 투표가 성공적으로 기록되었습니다`,
        status: voteStatus,
      };
    } catch (error) {
      this.logger.error(`출금 항목 투표 실패: ${error}`);
      
      throw error;
    }
  }

  /**
   * 출금 투표 최종 확정
   */
  async finalizeWithdrawVote(ledgerEntryId: string, finalizerId: string): Promise<any> {
    try {
      // 파이어베이스에서 최종 확정자 정보 가져오기
      const finalizerInfo = await this.firebaseService.getUserInfo(finalizerId);
      
      // 최종 확정자가 학생회 구성원인지 확인
      if (finalizerInfo.orgType !== 'STUDENT_COUNCIL') {
        throw new Error('학생회 구성원만 출금 투표를 최종 확정할 수 있습니다');
      }

      const orgName = 'student-council';

      // 출금 투표 최종 확정 트랜잭션 실행
      await this.fabricService.executeTransaction(
        finalizerId,
        orgName,
        this.channelName,
        this.chaincodeName,
        'FinalizeWithdrawVote',
        ledgerEntryId,
      );

      // 출금 투표 결과 조회
      const voteResult = await this.fabricService.queryTransaction(
        finalizerId,
        orgName,
        this.channelName,
        this.chaincodeName,
        'GetWithdrawVoteStatus',
        ledgerEntryId,
      );

      return {
        success: true,
        message: `출금 항목 ${ledgerEntryId} 투표 최종 확정 완료`,
        result: voteResult,
      };
    } catch (error) {
      this.logger.error(`출금 투표 최종 확정 실패: ${error}`);
      
      
      throw error;
    }
  }

  /**
   * 대기 중인 입금 항목 조회
   */
  async getPendingDepositEntries(): Promise<any[]> {
    try {
      // 캐시 먼저 확인
      const cachedEntries = await this.publisherService.cacheGet('ledger:pending-deposits');
      if (cachedEntries) {
        return cachedEntries;
      }

      // 쿼리를 위한 관리자 계정 사용
      const adminId = 'admin';
      const orgName = 'student-council';

      // 블록체인에서 대기 중인 입금 항목 조회
      const pendingEntries = await this.fabricService.queryTransaction(
        adminId,
        orgName,
        this.channelName,
        this.chaincodeName,
        'GetPendingDepositEntries',
      );

      // 결과 캐싱
      await this.publisherService.cacheSet(
        'ledger:pending-deposits',
        pendingEntries,
        60 * 5, // 5분 동안 캐싱
      );

      return pendingEntries;
    } catch (error) {
      this.logger.error(`대기 중인 입금 항목 조회 실패: ${error}`)
      throw error;
    }
  }

  /**
   * 대기 중인 출금 항목 조회
   */
  async getPendingWithdrawEntries(): Promise<any[]> {
    try {
      // 캐시 먼저 확인
      const cachedEntries = await this.publisherService.cacheGet('ledger:pending-withdraws');
      if (cachedEntries) {
        return cachedEntries;
      }

      // 쿼리를 위한 관리자 계정 사용
      const adminId = 'admin';
      const orgName = 'student-council';

      // 블록체인에서 대기 중인 출금 항목 조회
      const pendingEntries = await this.fabricService.queryTransaction(
        adminId,
        orgName,
        this.channelName,
        this.chaincodeName,
        'GetPendingWithdrawEntries',
      );

      // 결과 캐싱
      await this.publisherService.cacheSet(
        'ledger:pending-withdraws',
        pendingEntries,
        60 * 5, // 5분 동안 캐싱
      );

      return pendingEntries;
    } catch (error) {
      this.logger.error(`대기 중인 출금 항목 조회 실패: ${error}`);
      throw error;
    }
  }

  /**
   * 출금 투표 상태 조회
   */
  async getWithdrawVoteStatus(ledgerEntryId: string): Promise<any> {
    try {
      // 캐시 먼저 확인
      const cacheKey = `ledger:withdraw-vote:${ledgerEntryId}`;
      const cachedStatus = await this.publisherService.cacheGet(cacheKey);
      if (cachedStatus) {
        return cachedStatus;
      }

      // 쿼리를 위한 관리자 계정 사용
      const adminId = 'admin';
      const orgName = 'student-council';

      // 블록체인에서 출금 투표 상태 조회
      const voteStatus = await this.fabricService.queryTransaction(
        adminId,
        orgName,
        this.channelName,
        this.chaincodeName,
        'GetWithdrawVoteStatus',
        ledgerEntryId,
      );

      // 결과 캐싱
      await this.publisherService.cacheSet(
        cacheKey,
        voteStatus,
        60 * 5, // 5분 동안 캐싱
      );

      return voteStatus;
    } catch (error) {
      this.logger.error(`출금 투표 상태 조회 실패: ${error}`);
      throw error;
    }
  }

  /**
   * 테마 잔액 조회
   */
  async getThemeBalance(theme: string): Promise<any> {
    try {
      // 캐시 먼저 확인
      const cacheKey = `ledger:theme-balance:${theme}`;
      const cachedBalance = await this.publisherService.cacheGet(cacheKey);
      if (cachedBalance) {
        return cachedBalance;
      }

      // 쿼리를 위한 관리자 계정 사용
      const adminId = 'admin';
      const orgName = 'student-council';

      // 블록체인에서 테마 잔액 조회
      const balance = await this.fabricService.queryTransaction(
        adminId,
        orgName,
        this.channelName,
        this.chaincodeName,
        'GetThemeBalance',
        theme,
      );

      // 결과 캐싱
      await this.publisherService.cacheSet(
        cacheKey,
        balance,
        60 * 10, // 10분 동안 캐싱
      );

      return balance;
    } catch (error) {
      this.logger.error(`테마 잔액 조회 실패: ${error}`);
      throw error;
    }
  }

  /**
   * 모든 테마 잔액 조회
   */
  async getAllThemeBalances(): Promise<any[]> {
    try {
      // 캐시 먼저 확인
      const cachedBalances = await this.publisherService.cacheGet('ledger:theme-balances');
      if (cachedBalances) {
        return cachedBalances;
      }

      // 쿼리를 위한 관리자 계정 사용
      const adminId = 'admin';
      const orgName = 'student-council';

      // 블록체인에서 모든 테마 잔액 조회
      const balances = await this.fabricService.queryTransaction(
        adminId,
        orgName,
        this.channelName,
        this.chaincodeName,
        'GetAllThemeBalances',
      );

      // 결과 캐싱
      await this.publisherService.cacheSet(
        'ledger:theme-balances',
        balances,
        60 * 10, // 10분 동안 캐싱
      );

      return balances;
    } catch (error) {
      this.logger.error(`모든 테마 잔액 조회 실패: ${error}`);
      throw error;
    }
  }

  /**
   * 테마별 장부 항목 조회
   */
  async getLedgerEntriesByTheme(theme: string): Promise<any[]> {
    try {
      // 캐시 먼저 확인
      const cacheKey = `ledger:entries:theme:${theme}`;
      const cachedEntries = await this.publisherService.cacheGet(cacheKey);
      if (cachedEntries) {
        return cachedEntries;
      }

      // 쿼리를 위한 관리자 계정 사용
      const adminId = 'admin';
      const orgName = 'student-council';

      // 블록체인에서 테마별 장부 항목 조회
      const entries = await this.fabricService.queryTransaction(
        adminId,
        orgName,
        this.channelName,
        this.chaincodeName,
        'GetLedgerEntriesByTheme',
        theme,
      );

      // 결과 캐싱
      await this.publisherService.cacheSet(
        cacheKey,
        entries,
        60 * 10, // 10분 동안 캐싱
      );

      return entries;
    } catch (error) {
      this.logger.error(`테마별 장부 항목 조회 실패: ${error}`);
      throw error;
    }
  }

  /**
   * 모든 장부 항목 조회
   */
  async getAllLedgerEntries(): Promise<any[]> {
    try {
      // 캐시 먼저 확인
      const cachedEntries = await this.publisherService.cacheGet('ledger:all-entries');
      if (cachedEntries) {
        return cachedEntries;
      }

      // 쿼리를 위한 관리자 계정 사용
      const adminId = 'admin';
      const orgName = 'student-council';

      // 블록체인에서 모든 장부 항목 조회
      const entries = await this.fabricService.queryTransaction(
        adminId,
        orgName,
        this.channelName,
        this.chaincodeName,
        'GetAllLedgerEntries',
      );

      // 결과 캐싱
      await this.publisherService.cacheSet(
        'ledger:all-entries',
        entries,
        60 * 10, // 10분 동안 캐싱
      );

      return entries;
    } catch (error) {
      this.logger.error(`모든 장부 항목 조회 실패: ${error}`);
      throw error;
    }
  }

  /**
   * 블록체인에서 장부 이벤트 등록
   */
  async registerLedgerEvents(): Promise<void> {
    try {
      // 리스닝을 위한 관리자 계정 사용
      const adminId = 'admin';
      const orgName = 'student-council';

      // 입금 항목 이벤트 리스너 등록
      await this.fabricService.registerEventListener(
        adminId,
        orgName,
        this.channelName,
        this.chaincodeName,
        'deposit_entry_pending',
        (event) => {
          try {
            const payload = JSON.parse(event.payload.toString());
            
            // 대기 중인 입금 항목 캐시 무효화
            this.publisherService.cacheDelete('ledger:pending-deposits');
            
          } catch (error) {
            this.logger.error(`deposit_entry_pending 이벤트 처리 중 오류 발생: ${error}`);
          }
        },
      );

      await this.fabricService.registerEventListener(
        adminId,
        orgName,
        this.channelName,
        this.chaincodeName,
        'deposit_entry_approved',
        (event) => {
          try {
            const payload = JSON.parse(event.payload.toString());
            
            // 캐시 무효화
            this.publisherService.cacheDelete('ledger:pending-deposits');
            this.publisherService.cacheDelete('ledger:theme-balances');
            this.publisherService.cacheDelete(`ledger:theme-balance:${payload.theme}`);
            this.publisherService.cacheDelete(`ledger:entries:theme:${payload.theme}`);
            this.publisherService.cacheDelete('ledger:all-entries');
            
            // 스프링에 이벤트 발행
          } catch (error) {
            this.logger.error(`deposit_entry_approved 이벤트 처리 중 오류 발생: ${error}`);
          }
        },
      );

      await this.fabricService.registerEventListener(
        adminId,
        orgName,
        this.channelName,
        this.chaincodeName,
        'deposit_entry_rejected',
        (event) => {
          try {
            const payload = JSON.parse(event.payload.toString());
            
            // 캐시 무효화
            this.publisherService.cacheDelete('ledger:pending-deposits');
            this.publisherService.cacheDelete(`ledger:entries:theme:${payload.theme}`);
            this.publisherService.cacheDelete('ledger:all-entries');
            
            // 스프링에 이벤트 발행
          } catch (error) {
            this.logger.error(`deposit_entry_rejected 이벤트 처리 중 오류 발생: ${error}`);
          }
        },
      );

      // 출금 항목 이벤트 리스너 등록
      await this.fabricService.registerEventListener(
        adminId,
        orgName,
        this.channelName,
        this.chaincodeName,
        'withdraw_entry_pending',
        (event) => {
          try {
            const payload = JSON.parse(event.payload.toString());
            
            // 대기 중인 출금 항목 캐시 무효화
            this.publisherService.cacheDelete('ledger:pending-withdraws');
            
            // 스프링에 이벤트 발행
          } catch (error) {
            this.logger.error(`withdraw_entry_pending 이벤트 처리 중 오류 발생: ${error}`);
          }
        },
      );

      await this.fabricService.registerEventListener(
        adminId,
        orgName,
        this.channelName,
        this.chaincodeName,
        'withdraw_vote_update',
        (event) => {
          try {
            const payload = JSON.parse(event.payload.toString());
            
            // 출금 투표 상태 캐시 무효화
            this.publisherService.cacheDelete(`ledger:withdraw-vote:${payload.entryId}`);
            
          } catch (error) {
            this.logger.error(`withdraw_vote_update 이벤트 처리 중 오류 발생: ${error}`);
          }
        },
      );

      await this.fabricService.registerEventListener(
        adminId,
        orgName,
        this.channelName,
        this.chaincodeName,
        'withdraw_vote_result',
        (event) => {
          try {
            const payload = JSON.parse(event.payload.toString());
            
            // 캐시 무효화
            this.publisherService.cacheDelete(`ledger:withdraw-vote:${payload.entryId}`);
            this.publisherService.cacheDelete('ledger:pending-withdraws');
            this.publisherService.cacheDelete('ledger:theme-balances');
            this.publisherService.cacheDelete(`ledger:theme-balance:${payload.theme}`);
            this.publisherService.cacheDelete(`ledger:entries:theme:${payload.theme}`);
            this.publisherService.cacheDelete('ledger:all-entries');
            
          } catch (error) {
            this.logger.error(`withdraw_vote_result 이벤트 처리 중 오류 발생: ${error}`);
          }
        },
      );

      await this.fabricService.registerEventListener(
        adminId,
        orgName,
        this.channelName,
        this.chaincodeName,
        'withdraw_entry_approved',
        (event) => {
          try {
            const payload = JSON.parse(event.payload.toString());
            
            // 캐시 무효화
            this.publisherService.cacheDelete('ledger:pending-withdraws');
            this.publisherService.cacheDelete('ledger:theme-balances');
            this.publisherService.cacheDelete(`ledger:theme-balance:${payload.theme}`);
            this.publisherService.cacheDelete(`ledger:entries:theme:${payload.theme}`);
            this.publisherService.cacheDelete('ledger:all-entries');
            
          } catch (error) {
            this.logger.error(`withdraw_entry_approved 이벤트 처리 중 오류 발생: ${error}`);
          }
        },
      );

      await this.fabricService.registerEventListener(
        adminId,
        orgName,
        this.channelName,
        this.chaincodeName,
        'withdraw_entry_rejected',
        (event) => {
          try {
            const payload = JSON.parse(event.payload.toString());
            
            // 캐시 무효화
            this.publisherService.cacheDelete('ledger:pending-withdraws');
            this.publisherService.cacheDelete(`ledger:entries:theme:${payload.theme}`);
            this.publisherService.cacheDelete('ledger:all-entries');
            
          } catch (error) {
            this.logger.error(`withdraw_entry_rejected 이벤트 처리 중 오류 발생: ${error}`);
          }
        },
      );

      await this.fabricService.registerEventListener(
        adminId,
        orgName,
        this.channelName,
        this.chaincodeName,
        'withdraw_entry_expired',
        (event) => {
          try {
            const payload = JSON.parse(event.payload.toString());
            
            // 캐시 무효화
            this.publisherService.cacheDelete('ledger:pending-withdraws');
            this.publisherService.cacheDelete(`ledger:entries:theme:${payload.theme}`);
            this.publisherService.cacheDelete('ledger:all-entries');
            
            // 스프링에 이벤트 발행
          } catch (error) {
            this.logger.error(`withdraw_entry_expired 이벤트 처리 중 오류 발생: ${error}`);
          }
        },
      );

      await this.fabricService.registerEventListener(
        adminId,
        orgName,
        this.channelName,
        this.chaincodeName,
        'theme_balance_updated',
        (event) => {
          try {
            const payload = JSON.parse(event.payload.toString());
            
            // 캐시 무효화
            this.publisherService.cacheDelete('ledger:theme-balances');
            this.publisherService.cacheDelete(`ledger:theme-balance:${payload.theme}`);
            
            // 새로운 잔액으로 캐시 업데이트
            this.publisherService.cacheSet(
              `ledger:theme-balance:${payload.theme}`,
              payload,
              60 * 60 * 24, // 10분 동안 캐싱
            );
          } catch (error) {
            this.logger.error(`theme_balance_updated 이벤트 처리 중 오류 발생: ${error}`);
          }
        },
      );

      this.logger.log('장부 이벤트 리스너 등록 완료');
    } catch (error) {
      this.logger.error(`장부 이벤트 등록 실패: ${error}`);
      throw error;
    }
  }

  /**
   * 만료된 출금 항목 확인 스케줄 작업
   * 10분마다 실행
   */
  @Cron('0 */10 * * * *')
  async checkExpiredWithdrawEntries(): Promise<void> {
    try {
      this.logger.log('만료된 출금 항목 확인 스케줄 작업 실행');
      
      // 관리자 계정 사용
      const adminId = 'admin';
      const orgName = 'student-council';

      // 만료된 출금 항목 확인 트랜잭션 실행
      await this.fabricService.executeTransaction(
        adminId,
        orgName,
        this.channelName,
        this.chaincodeName,
        'CheckExpiredWithdrawEntries',
      );

      // 대기 중인 출금 항목 캐시 무효화
      await this.publisherService.cacheDelete('ledger:pending-withdraws');
      
      this.logger.log('만료된 출금 항목 확인 완료');
    } catch (error) {
      this.logger.error(`만료된 출금 항목 확인 중 오류 발생: ${error}`);
    }
  }
}