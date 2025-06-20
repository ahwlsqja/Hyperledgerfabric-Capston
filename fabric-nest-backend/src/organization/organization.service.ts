// src/modules/organization/organization.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FabricService } from '../fabric/fabric.service';
import { FirebaseService } from 'src/firebase/firebase.service';
import { StreamsPublisherService } from 'src/redis/streams-publisher.service';

@Injectable()
export class OrganizationService {
  private readonly logger = new Logger(OrganizationService.name);
  private readonly channelName: string;
  private readonly chaincodeName: string;

  constructor(
    private configService: ConfigService,
    private fabricService: FabricService,
    private publisherService: StreamsPublisherService,
    private firebaseService: FirebaseService,
  ) {
    this.channelName = this.configService.get<string>('CHANNEL_NAME', 'mychannel');
    this.chaincodeName = this.configService.get<string>('CHAINCODE_NAME', 'basic');
  }

  /**
   * Fabric CA로 신규 사용자 등록 및 회원가입 요청 생성
   */
  async registerUser(userId: string, name: string, orgType: 'STUDENT' | 'STUDENT_COUNCIL'): Promise<any> {
    try {
      // 조직 유형에 따른 MSP 결정
      const orgMSP = orgType === 'STUDENT' ? 'StudentMSP' : 'Student-councilMSP';
      const orgName = orgType === 'STUDENT' ? 'student' : 'student-council';

      // Fabric CA를 통해 사용자 등록 및 인증서 발급
      await this.fabricService.registerAndEnrollUser(userId, orgName);

      // 파이어베이스에 추가 사용자 정보 저장
      await this.firebaseService.storeUserInfo(userId, {
        name,
        orgType,
        orgMSP,
        registeredAt: new Date().toISOString(),
      });

      // 블록체인에 회원가입 요청 생성
      const requestId = await this.requestMembership(userId, name, orgType);

      return {
        success: true,
        requestId,
        message: `사용자 ${userId} 등록 및 회원가입 요청이 생성되었습니다`,
      };
    } catch (error) {
      this.logger.error(`사용자 등록 실패: ${error}`);
      
      throw error;
    }
  }
 
  /**
   * 블록체인에 회원가입 요청 생성
   */
  private async requestMembership(userId: string, name: string, orgType: 'STUDENT' | 'STUDENT_COUNCIL'): Promise<string> {
    try {
      // 파이어베이스에서 사용자 정보 가져오기
      const userInfo = await this.firebaseService.getUserInfo(userId);
      const orgName = orgType === 'STUDENT' ? 'student' : 'student-council';

      // 회원가입 요청 트랜잭션 실행
      let requestId: string;
      if (orgType === 'STUDENT') {
        const result = await this.fabricService.executeTransaction(
          userId,
          orgName,
          this.channelName,
          this.chaincodeName,
          'RequestStudentMembership',
          userId,
          name,
        );
        requestId = result;
      } else {
        const result = await this.fabricService.executeTransaction(
          userId,
          orgName,
          this.channelName,
          this.chaincodeName,
          'RequestCouncilMembership',
          userId,
          name,
        );
        requestId = result;
      }

      // 빠른 액세스를 위해 Redis에 요청 캐싱
      await this.publisherService.cacheSet(
        `membership:request:${requestId}`,
        {
          id: requestId,
          userId,
          name,
          orgType,
          status: 'PENDING',
          timestamp: new Date().toISOString(),
        },
        60 * 60 * 24, // 24시간 동안 캐싱
      );

      return requestId;
    } catch (error) {
      this.logger.error("회원가입요청실패패")
      throw error;
    }
  }

  /**
   * 회원가입 요청 승인
   */
  async approveRequest(requestId: string, approverId: string): Promise<any> {
    try {
      // 파이어베이스에서 승인자 정보 가져오기
      const approverInfo = await this.firebaseService.getUserInfo(approverId);
      
      // 승인자가 학생회 구성원인지 확인
      if (approverInfo.orgType !== 'STUDENT_COUNCIL') {
        throw new Error('학생회 구성원만 회원가입 요청을 승인할 수 있습니다');
      }

      const orgName = 'student-council';

      // 요청 승인 트랜잭션 실행
      await this.fabricService.executeTransaction(
        approverId,
        orgName,
        this.channelName,
        this.chaincodeName,
        'ApproveRequest',
        requestId,
      );

      // 블록체인에서 업데이트된 요청 상태 조회
      const requestStatus = await this.fabricService.queryTransaction(
        approverId,
        orgName,
        this.channelName,
        this.chaincodeName,
        'GetRequestStatus',
        requestId,
      );

      // Redis 캐시 업데이트
      await this.publisherService.cacheSet(
        `membership:request:${requestId}`,
        requestStatus,
        60 * 60 * 24, // 24시간 동안 캐싱
      );


      return {
        success: true,
        message: `회원가입 요청 ${requestId} 승인 완료`,
        request: requestStatus,
      };
    } catch (error) {
      this.logger.error(`요청 승인 실패: ${error}`);
      throw error;
    }
  }

  /**
   * 회원가입 요청 거부
   */
  async rejectRequest(requestId: string, rejectorId: string): Promise<any> {
    try {
      // 파이어베이스에서 거부자 정보 가져오기
      const rejectorInfo = await this.firebaseService.getUserInfo(rejectorId);
      
      // 거부자가 학생회 구성원인지 확인
      if (rejectorInfo.orgType !== 'STUDENT_COUNCIL') {
        throw new Error('학생회 구성원만 회원가입 요청을 거부할 수 있습니다');
      }

      const orgName = 'student-council';

      // 요청 거부 트랜잭션 실행
      await this.fabricService.executeTransaction(
        rejectorId,
        orgName,
        this.channelName,
        this.chaincodeName,
        'RejectRequest',
        requestId,
      );

      // 블록체인에서 업데이트된 요청 상태 조회
      const requestStatus = await this.fabricService.queryTransaction(
        rejectorId,
        orgName,
        this.channelName,
        this.chaincodeName,
        'GetRequestStatus',
        requestId,
      );

      // Redis 캐시 업데이트
      await this.publisherService.cacheSet(
        `membership:request:${requestId}`,
        requestStatus,
        60 * 60 * 24, // 24시간 동안 캐싱
      );


      return {
        success: true,
        message: `회원가입 요청 ${requestId} 거부 완료`,
        request: requestStatus,
      };
    } catch (error) {
      this.logger.error(`요청 거부 실패: ${error}`);
      throw error;
    }
  }

  /**
   * 모든 대기 중인 회원가입 요청 조회
   */
  async getPendingRequests(): Promise<any[]> {
    try {
      // 캐시된 요청이 있는지 확인
      const cachedRequests = await this.publisherService.cacheGet('membership:pending-requests');
      if (cachedRequests) {
        return cachedRequests;
      }

      // 쿼리를 위한 관리자 계정 사용
      const adminId = 'admin'; // 학생회 구성원이 없는 경우 admin 사용
      const orgName = 'student-council';

      // 블록체인에서 대기 중인 요청 조회
      const pendingRequests = await this.fabricService.queryTransaction(
        adminId,
        orgName,
        this.channelName,
        this.chaincodeName,
        'GetAllPendingRequests',
      );

      // 결과 캐싱
      await this.publisherService.cacheSet(
        'membership:pending-requests',
        pendingRequests,
        60 * 5, // 5분 동안 캐싱
      );

      return pendingRequests;
    } catch (error) {
      this.logger.error(`대기 중인 요청 조회 실패: ${error}`);
      throw error;
    }
  }

  /**
   * ID로 요청 상태 조회
   */
  async getRequestStatus(requestId: string): Promise<any> {
    try {
      // 먼저 캐시 확인
      const cachedRequest = await this.publisherService.cacheGet(`membership:request:${requestId}`);
      if (cachedRequest) {
        return cachedRequest;
      }

      // 쿼리를 위한 관리자 계정 사용
      const adminId = 'admin';
      const orgName = 'student-council';

      // 블록체인에서 요청 상태 조회
      const requestStatus = await this.fabricService.queryTransaction(
        adminId,
        orgName,
        this.channelName,
        this.chaincodeName,
        'GetRequestStatus',
        requestId,
      );

      // 결과 캐싱
      await this.publisherService.cacheSet(
        `membership:request:${requestId}`,
        requestStatus,
        60 * 60, // 1시간 동안 캐싱
      );

      return requestStatus;
    } catch (error) {
      this.logger.error(`요청 상태 조회 실패: ${error}`);
      throw error;
    }
  }

  /**
   * 학생 조직 구성원 수 조회
   */
  async getStudentMemberCount(): Promise<number> {
    try {
      // 먼저 캐시 확인
      const cachedCount = await this.publisherService.cacheGet('membership:student-count');
      if (cachedCount !== null) {
        return cachedCount;
      }

      // 쿼리를 위한 관리자 계정 사용
      const adminId = 'admin';
      const orgName = 'student-council';

      // 블록체인에서 학생 구성원 수 조회
      const count = await this.fabricService.queryTransaction(
        adminId,
        orgName,
        this.channelName,
        this.chaincodeName,
        'GetStudentMemberCount',
      );

      // 결과 캐싱
      await this.publisherService.cacheSet(
        'membership:student-count',
        count,
        60 * 60, // 1시간 동안 캐싱
      );

      return count;
    } catch (error) {
      this.logger.error(`학생 구성원 수 조회 실패: ${error}`);
      throw error;
    }
  }

  /**
   * 학생회 조직 구성원 수 조회
   */
  async getCouncilMemberCount(): Promise<number> {
    try {
      // 먼저 캐시 확인
      const cachedCount = await this.publisherService.cacheGet('membership:council-count');
      if (cachedCount !== null) {
        return cachedCount;
      }

      // 쿼리를 위한 관리자 계정 사용
      const adminId = 'admin';
      const orgName = 'student-council';

      // 블록체인에서 학생회 구성원 수 조회
      const count = await this.fabricService.queryTransaction(
        adminId,
        orgName,
        this.channelName,
        this.chaincodeName,
        'GetCouncilMemberCount',
      );

      // 결과 캐싱
      await this.publisherService.cacheSet(
        'membership:council-count',
        count,
        60 * 60, // 1시간 동안 캐싱
      );

      return count;
    } catch (error) {
      this.logger.error(`학생회 구성원 수 조회 실패: ${error}`);
      throw error;
    }
  }

  /**
   * 블록체인에서 회원가입 요청 이벤트 등록
   */
  async registerMembershipEvents(): Promise<void> {
    try {
      // 리스닝을 위한 관리자 계정 사용
      const adminId = 'admin';
      const orgName = 'student-council';

      // 회원가입 요청 생성 이벤트 리스너 등록
      await this.fabricService.registerEventListener(
        adminId,
        orgName,
        this.channelName,
        this.chaincodeName,
        'membership_request_created',
        async (event) => {
          try {
            const payload = JSON.parse(event.payload.toString());
            
            // Redis 캐시 업데이트
            await this.publisherService.cacheSet(
              `membership:request:${payload.id}`,
              payload,
              60 * 60 * 24, // 24시간 동안 캐싱
            );
            
            // 대기 중인 요청 캐시 무효화
            await this.publisherService.cacheDelete('membership:pending-requests');
            
            // 스프링에 이벤트 발행
            await this.publisherService.publishSuccessResponse(
              payload.id,
              'MEMBERSHIP_REQUEST_CREATED',
              payload,
              payload.id,
            );

            this.logger.log(`회원가입 요청 생성 이벤트 -> spring 응답 발행: ${payload.id}`)
          } catch (error) {
            this.logger.error(`membership_request_created 이벤트 처리 중 오류 발생: ${error}`);
          }
        },
      );

      // 회원가입 요청 승인 이벤트 리스너 등록
      await this.fabricService.registerEventListener(
        adminId,
        orgName,
        this.channelName,
        this.chaincodeName,
        'membership_request_approved',
        async (event) => {
          try {
            const payload = JSON.parse(event.payload.toString());
            
            // Redis 캐시 업데이트
            await this.publisherService.cacheSet(
              `membership:request:${payload.id}`,
              payload,
              60 * 60 * 24, // 24시간 동안 캐싱
            );
            
            // 대기 중인 요청 캐시 무효화
            await this.publisherService.cacheDelete('membership:pending-requests');
            
            // 구성원 수 캐시 무효화
            await this.publisherService.cacheDelete('membership:student-count');
            await this.publisherService.cacheDelete('membership:council-count');
            
            // 스프링에 이벤트 발행
            await this.publisherService.publishSuccessResponse(
              payload.id,
              'MEMBERSHIP_REQUEST_APPROVED',
              payload,
              payload.id,
            );

            this.logger.log(`회원가입 요청 승인 이벤트 -> Spring 응답 발행: ${payload.id}`)
          } catch (error) {
            this.logger.error(`membership_request_approved 이벤트 처리 중 오류 발생: ${error}`);
          }
        },
      );

      // 회원가입 요청 거부 이벤트 리스너 등록
      await this.fabricService.registerEventListener(
        adminId,
        orgName,
        this.channelName,
        this.chaincodeName,
        'membership_request_rejected',
        (event) => {
          try {
            const payload = JSON.parse(event.payload.toString());
            
            // Redis 캐시 업데이트
            this.publisherService.cacheSet(
              `membership:request:${payload.id}`,
              payload,
              60 * 60 * 24, // 24시간 동안 캐싱
            );
            
            // 대기 중인 요청 캐시 무효화
            this.publisherService.cacheDelete('membership:pending-requests');
            
            // 스프링에 이벤트 발행
            this.publisherService.publishSuccessResponse(
              payload.id,
              'MEMBERSHIP_REQUEST_REJECTED',
              payload,
              payload.id,
            );

            this.logger.log(`회원가입 요청 거부 이벤트 -> Spring 응답 발행: ${payload.id}`);
          } catch (error) {
            this.logger.error(`membership_request_rejected 이벤트 처리 중 오류 발생: ${error}`);
          }
        },
      );

      this.logger.log('회원가입 이벤트 리스너 등록 완료');
    } catch (error) {
      this.logger.error(`회원가입 이벤트 등록 실패: ${error}`);
      throw error;
    }
  }
}