// ==================== organization.streams-subscribe.ts ====================
import { Injectable, Logger } from "@nestjs/common";
import { OrganizationService } from "./organization.service";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { RegisterUserDto } from "./dtos/registerUserDto";
import { StreamsPublisherService } from "src/redis/streams-publisher.service";
import { mockCouncilApprovedRequest, mockRequestRegister, mockStudentRejectedRequest } from "./mock-data/request-status.mock";
import { mockPendingStudentRequests } from "./mock-data/pending-requests.mock";
import { MembershipRequest, MembershipStatus } from "src/types";
import { timestamp } from "rxjs";

@Injectable()
export class OrganizationStreamsSubscriber {
    private readonly logger = new Logger(OrganizationStreamsSubscriber.name);
    private isListenersRegistered = false; // 🔥 중복 등록 방지 플래그

    constructor(
        private organizationService: OrganizationService,
        private publisherService: StreamsPublisherService,
        private eventEmitter: EventEmitter2  
    ) {
        console.log('🔥🔥🔥 OrganizationStreamsSubscriber 생성자 호출됨!!!');
        this.logger.log('🔥🔥🔥 OrganizationStreamsSubscriber 생성자 실행!!!');
        
        // 🔥 생성자에서 한 번만 등록
        this._registerListenersOnce();
    }

    private _registerListenersOnce() {
        if (this.isListenersRegistered) {
            console.log('⚠️ 리스너가 이미 등록되었습니다. 중복 등록 방지.');
            return;
        }

        if (!this.eventEmitter) {
            console.log('❌ EventEmitter가 없습니다!');
            setTimeout(() => this._registerListenersOnce(), 100);
            return;
        }

        console.log('🔧 리스너 최초 등록 중...');
        
        try {
            // 🔥 확실한 기존 리스너 제거
            this._cleanupExistingListeners();
            
            // 🔥 회원가입 이벤트 - 단 한 번만 등록
            this.eventEmitter.on('spring:request:register-user', async (data) => {
                console.log('🎯🔥🔥🔥 회원가입 리스너 호출됨!!! 🔥🔥🔥', data);
                await this._handleUserRegisterInternal(data);
            });
            
            // 🔥 테스트 이벤트
            this.eventEmitter.on('spring:request:test', (data) => {
                console.log('🧪🔥 테스트 리스너 호출됨!', data);
                this.logger.log(`🧪 테스트 이벤트 수신: ${JSON.stringify(data)}`);
            });
            
            // 🔥 승인 이벤트
            this.eventEmitter.on('spring:request:approve', async (data) => {
                console.log('🎯🔥 승인 리스너 호출됨:', data);
                await this._handleUserApproveInternal(data)
            });
            
            // 🔥 거절 이벤트
            this.eventEmitter.on('spring:request:reject', async (data) => {
                console.log('🎯🔥 거절 리스너 호출됨:', data);
                await this._handleUserRejectInternal(data)
            });
            
            // 🔥 학생 수 조회
            this.eventEmitter.on('spring:request:student-count', async (data) => {
                console.log('🎯🔥 학생수 리스너 호출됨:', data);
                await this._handleStudentCountInternal(data)
            });
            
            // 🔥 학생회 수 조회
            this.eventEmitter.on('spring:request:student-council-count', async (data) => {
                console.log('🎯🔥 학생회수 리스너 호출됨:', data);
                await this._handleStudentCouncilCountInternal(data)
            });
            
            // 🔥 대기 요청 조회
            this.eventEmitter.on('spring:request:pending-register', async (data) => {
                console.log('🎯🔥 대기요청 리스너 호출됨:', data);
                await this._handleGetPendingRequestInternal(data)
            });
            
            // 🔥 요청 상태 조회
            this.eventEmitter.on('spring:request:register-user-status', async (data) => {
                console.log('🎯🔥 상태조회 리스너 호출됨:', data);
                await this._handleGetRequestStatusInternal(data)
            });
            
            this.isListenersRegistered = true; // 🔥 등록 완료 표시
            console.log('✅ 리스너 최초 등록 완료 (중복 방지됨)');
            
            // 🔥 상태 확인 (한 번만)
            setTimeout(() => this._checkStatus(), 2000);
            
        } catch (error) {
            console.log('❌ 리스너 등록 실패:', error.message);
            this.isListenersRegistered = false;
        }
    }

    private _cleanupExistingListeners() {
        console.log('🧹 기존 리스너 정리 중...');
        
        const channels = [
            'spring:request:test',
            'spring:request:register-user',
            'spring:request:approve',
            'spring:request:reject',
            'spring:request:student-count',
            'spring:request:student-council-count',
            'spring:request:pending-register',
            'spring:request:register-user-status'
        ];
        
        channels.forEach(channel => {
            const beforeCount = this.eventEmitter.listenerCount(channel);
            this.eventEmitter.removeAllListeners(channel);
            const afterCount = this.eventEmitter.listenerCount(channel);
            
            if (beforeCount > 0) {
                console.log(`🧹 ${channel}: ${beforeCount}개 → ${afterCount}개 리스너`);
            }
        });
        
        console.log('✅ 기존 리스너 정리 완료');
    }

    private _checkStatus() {
        console.log('\n🔍 === 최종 리스너 상태 확인 ===');
        
        const channels = [
            'spring:request:test',
            'spring:request:register-user',
            'spring:request:approve',
            'spring:request:reject',
            'spring:request:student-count',
            'spring:request:student-council-count',
            'spring:request:pending-register',
            'spring:request:register-user-status'
        ];
        
        console.log('🎭 현재 등록된 모든 이벤트:', this.eventEmitter.eventNames());
        
        let totalListeners = 0;
        channels.forEach(channel => {
            const count = this.eventEmitter.listenerCount(channel);
            totalListeners += count;
            if (count > 0) {
                console.log(`📡 ${channel}: ${count}개 리스너`);
            }
        });
        
        console.log(`📊 총 리스너 수: ${totalListeners}`);
        
        if (totalListeners === 8) { // 정확히 8개여야 함
            console.log('✅✅✅ 모든 리스너가 정확히 1개씩 등록되었습니다!');
        } else {
            console.log('❌❌❌ 리스너 수가 비정상입니다!');
        }
        
        console.log('===========================================\n');
    }

    // 🔥 내부 처리 메서드 (단순화)
    private async _handleUserRegisterInternal(payload: any) {
        const startTime = Date.now();
        const recordId = payload._recordId || 'unknown';
        const environment = process.env.NODE_ENV || 'development';
        
        try {
            this.logger.log(`🎯🔥 회원가입 요청 처리 시작: ${JSON.stringify(payload)}`);
            
            let result: any;

           if (environment === 'production' || environment === 'prod') {
                // 🚀 Production 모드: 실제 서비스 로직 실행
                this.logger.log('🚀 Production 모드: 실제 서비스 호출');
                result = await this.organizationService.registerUser(
                    payload.userId, 
                    payload.name, 
                    payload.orgType
                );
                
                this.logger.log(`✅ Production 서비스 처리 완료: ${JSON.stringify(result)}`);
                
            } else {
                // 🧪 Development 모드: 모의 데이터 반환
                let requestId = `REQ_${payload.orgType.split('_')[1]}_${Date.now()}_${payload.userId}`

                this.logger.log('🧪 Development 모드: 모의 데이터 생성');
                result = {
                    success: true,
                    requestId,
                    message: `사용자 ${payload.userId} 등록 및 회원가입 요청이 생성되었습니다`,
                };
                
                this.logger.log(`✅ Development 모의 데이터 생성 완료: ${JSON.stringify(result)}`);

                const Req = {
                    id: requestId,
                    userId: payload.userId,
                    name: payload.name,
                    orgType: payload.orgType,
                    status: MembershipStatus.PENDING,
                    timestamp: Date.now(),
                }
                // 빠른 액세스를 위해 Redis에 요청 캐싱
                await this.publisherService.cacheSet(
                `membership:request:${requestId}`,
                Req,
                60 * 60 * 24, // 24시간 동안 캐싱
                );
            }
            
            const processingTime = Date.now() - startTime;
            
            // 성공 응답 발행
            await this.publisherService.publishSuccessResponse(
                'REGISTER_USER',
                result,
                recordId,
                processingTime
            );
            
            this.logger.log(`🎯 회원가입 요청 ${payload.userId} 처리 완료 (${processingTime}ms)`);
            
        } catch (error) {
            const processingTime = Date.now() - startTime;
            this.logger.error(`회원가입 요청 처리 실패: ${error.message}`);
            
            await this.publisherService.publishErrorResponse(
                'REGISTER_USER',
                error.message,
                recordId,
                processingTime
            );
        }
    }

    private async _handleUserApproveInternal(payload: any) {
        const startTime = Date.now();
        const recordId = payload._recordId || 'unknown';
        const environment = process.env.NODE_ENV || 'development';

        try {
            this.logger.log(`승인 가입 요청 처리 시작: ${JSON.stringify(payload)}`);

            let result: any;

            if(environment === 'production' || environment === 'prod') {
                this.logger.log("Production 모드: 실제 블록체인 체인코드 호출");
                result = await this.organizationService.approveRequest(
                    payload.requestId,
                    payload.approverId
                );

                this.logger.log(`✅ Production 서비스 처리 완료: ${JSON.stringify(result)}`);   
            }else{
                this.logger.log('🧪 Development 모드: 모의 데이터 생성')
                const requestList = payload.requestId.split("_")
                const applicantId = requestList[3] 
                const organizationType = requestList[1]
                const requestDatas: MembershipRequest = {
                    id: payload.requestId,
                    applicantId: applicantId,
                    applicantName: payload.name,
                    organizationType: organizationType,
                    status: MembershipStatus.APPROVED,
                    approvals: [payload.approverId],
                    rejections: [],
                    timestamp: Math.floor(Date.now() / 1000)
                }
                result = {
                    success: true,
                    message: `회원가입 요청 ${payload.requestId} 승인 완료`,
                    request: requestDatas
                };

                // Redis 캐시 업데이트
                await this.publisherService.cacheSet(
                `membership:request:${payload.requestId}`,
                requestDatas,
                60 * 60 * 24, // 24시간 동안 캐싱
                );

                this.logger.log("모의 데이터 생성 완료")
            }

            const processingTime = Date.now() - startTime;
            
            // 성공 응답 발행
            await this.publisherService.publishSuccessResponse(
                'APPROVE_MEMBERSHIP',
                result,
                recordId,
                processingTime
            );
            
            this.logger.log(`🎯 회원가입 요청 ${payload.userId} 처리 완료 (${processingTime}ms)`);
        } catch (error) {
            const processingTime = Date.now() - startTime;
            this.logger.error(`회원가입 요청 처리 실패: ${error.message}`);
            
            await this.publisherService.publishErrorResponse(
                'APPROVE_MEMBERSHIP',
                error.message,
                recordId,
                processingTime
            );
        }
    }


    private async _handleUserRejectInternal(payload: any) {
        const startTime = Date.now();
        const recordId = payload._recordId || 'unknown';
        const environment = process.env.NODE_ENV || 'development';

        try {
            this.logger.log(`가입 거절 요청 처리 시작: ${JSON.stringify(payload)}`);

            let result: any;

            if(environment === 'production' || environment === 'prod') {
                this.logger.log("Production 모드: 실제 블록체인 체인코드 호출");
                result = await this.organizationService.rejectRequest(
                    payload.requestId,
                    payload.rejectorId
                );

                this.logger.log(`✅ Production 서비스 처리 완료: ${JSON.stringify(result)}`);   
            }else{
                this.logger.log('🧪 Development 모드: 모의 데이터 생성')
                // 학생 조직 가입 요청 - REJECTED 상태
                const requestList = payload.requestId.split("_")
                const applicantId = requestList[3] 
                const organizationType = requestList[1]
                const requestDatas: MembershipRequest = {
                    id: payload.requestId,
                    applicantId: applicantId,
                    applicantName: payload.name,
                    organizationType: organizationType,
                    status: MembershipStatus.REJECTED,
                    approvals: [],
                    rejections: [payload.rejectorId],
                    timestamp: Math.floor(Date.now() / 1000)
                }
                result = {
                    success: true,
                    message: `회원가입 요청 ${payload.requestId} 거절 완료`,
                    request: requestDatas
                };

                // Redis 캐시 업데이트
                await this.publisherService.cacheSet(
                `membership:request:${payload.requestId}`,
                requestDatas,
                60 * 60 * 24, // 24시간 동안 캐싱
                );

                this.logger.log("모의 데이터 생성 완료")
            }

            const processingTime = Date.now() - startTime;
            
            // 성공 응답 발행
            await this.publisherService.publishSuccessResponse(
                'REJECT_MEMBERSHIP',
                result,
                recordId,
                processingTime
            );
            
            this.logger.log(`🎯 회원가입 요청 ${payload.userId} 처리 완료 (${processingTime}ms)`);
        } catch (error) {
            const processingTime = Date.now() - startTime;
            this.logger.error(`회원가입 요청 처리 실패: ${error.message}`);
            
            await this.publisherService.publishErrorResponse(
                'REJECT_MEMBERSHIP',
                error.message,
                recordId,
                processingTime
            );
        }
    }

    private async _handleStudentCountInternal(payload: any) {
        const startTime = Date.now();
        const recordId = payload._recordId || 'unknown';
        const environment = process.env.NODE_ENV || 'development';

        try {
            this.logger.log(`학생 조직 수 조회 처리 시작: ${JSON.stringify(payload)}`);

            let result: any;

            if(environment === 'production' || environment === 'prod') {
                this.logger.log("Production 모드: 실제 블록체인 체인코드 호출");
                result = await this.organizationService.getStudentMemberCount();

                this.logger.log(`✅ Production 서비스 처리 완료: ${JSON.stringify(result)}`);   
            }else{
                this.logger.log('🧪 Development 모드: 모의 데이터 생성')
                result = 1;
                // 결과 캐싱
                await this.publisherService.cacheSet(
                'membership:student-count',
                result,
                60 * 60, // 1시간 동안 캐싱
                );

                this.logger.log("모의 데이터 생성 완료")
            }

            const processingTime = Date.now() - startTime;
            
            // 성공 응답 발행
            await this.publisherService.publishSuccessResponse(
                'GET_STUDENT_COUNT',
                result,
                recordId,
                processingTime
            );
            
            this.logger.log(`🎯 학생 조직원 수 ${payload.userId} 처리 완료 (${processingTime}ms)`);
        } catch (error) {
            const processingTime = Date.now() - startTime;
            this.logger.error(`회원가입 요청 처리 실패: ${error.message}`);
            
            await this.publisherService.publishErrorResponse(
                'GET_STUDENT_COUNT',
                error.message,
                recordId,
                processingTime
            );
        }
    }


    private async _handleStudentCouncilCountInternal(payload: any) {
        const startTime = Date.now();
        const recordId = payload._recordId || 'unknown';
        const environment = process.env.NODE_ENV || 'development';

        try {
            this.logger.log(`학생회 조직 수 조회 처리 시작: ${JSON.stringify(payload)}`);

            let result: any;

            if(environment === 'production' || environment === 'prod') {
                this.logger.log("Production 모드: 실제 블록체인 체인코드 호출");
                result = await this.organizationService.getCouncilMemberCount();

                this.logger.log(`✅ Production 서비스 처리 완료: ${JSON.stringify(result)}`);   
            }else{
                this.logger.log('🧪 Development 모드: 모의 데이터 생성')
                result = 1;
                // 결과 캐싱
                await this.publisherService.cacheSet(
                'membership:council-count',
                result,
                60 * 60, // 1시간 동안 캐싱
                );

                this.logger.log("모의 데이터 생성 완료")
            }

            const processingTime = Date.now() - startTime;
            
            // 성공 응답 발행
            await this.publisherService.publishSuccessResponse(
                'GET_COUNCIL_COUNT',
                result,
                recordId,
                processingTime
            );
            
            this.logger.log(`🎯 학생회 조직원 수 ${payload.userId} 처리 완료 (${processingTime}ms)`);
        } catch (error) {
            const processingTime = Date.now() - startTime;
            this.logger.error(`학생회 조직원 수 조회 요청 처리 실패: ${error.message}`);
            
            await this.publisherService.publishErrorResponse(
                'GET_COUNCIL_COUNT',
                error.message,
                recordId,
                processingTime
            );
        }
    }

    private async _handleGetPendingRequestInternal(payload: any) {
        const startTime = Date.now();
        const recordId = payload._recordId || 'unknown';
        const environment = process.env.NODE_ENV || 'development';

        try {
            this.logger.log(`대기 중인 요청 조회 처리 시작: ${JSON.stringify(payload)}`);

            let result: any;

            if(environment === 'production' || environment === 'prod') {
                this.logger.log("Production 모드: 실제 블록체인 체인코드 호출");
                result = await this.organizationService.getPendingRequests();

                this.logger.log(`✅ Production 서비스 처리 완료: ${JSON.stringify(result)}`);   
            }else{
                this.logger.log('🧪 Development 모드: 모의 데이터 생성')
                result = mockPendingStudentRequests
                // 결과 캐싱
                await this.publisherService.cacheSet(
                'membership:pending-requests',
                result,
                60 * 5, // 5분 동안 캐싱
                );
                

                this.logger.log("모의 데이터 생성 완료")
            }

            const processingTime = Date.now() - startTime;
            
            // 성공 응답 발행
            await this.publisherService.publishSuccessResponse(
                'GET_PENDING_REQUESTS',
                result,
                recordId,
                processingTime
            );
            
            this.logger.log(`🎯 대기중인 요청 조회 ${payload.userId} 처리 완료 (${processingTime}ms)`);
        } catch (error) {
            const processingTime = Date.now() - startTime;
            this.logger.error(`대기중인 요청 조회 요청 처리 실패: ${error.message}`);
            
            await this.publisherService.publishErrorResponse(
                'GET_PENDING_REQUESTS',
                error.message,
                recordId,
                processingTime
            );
        }
    }

    private async _handleGetRequestStatusInternal(payload: any) {
        const startTime = Date.now();
        const recordId = payload._recordId || 'unknown';
        const environment = process.env.NODE_ENV || 'development';

        try {
            this.logger.log(`조회 상태 처리 시작: ${JSON.stringify(payload)}`);

            let result: any;

            if(environment === 'production' || environment === 'prod') {
                this.logger.log("Production 모드: 실제 블록체인 체인코드 호출");
                result = await this.organizationService.getRequestStatus(payload.requestId);

                this.logger.log(`✅ Production 서비스 처리 완료: ${JSON.stringify(result)}`);   
            }else{
                this.logger.log('🧪 Development 모드: 모의 데이터 생성')
                result = mockCouncilApprovedRequest
                
                      // 결과 캐싱
                await this.publisherService.cacheSet(
                `membership:request:${payload.requestId}`,
                result,
                60 * 60, // 1시간 동안 캐싱
                );

                this.logger.log("모의 데이터 생성 완료")
            }

            const processingTime = Date.now() - startTime;
            
            // 성공 응답 발행
            await this.publisherService.publishSuccessResponse(
                'GET_REQUEST_STATUS',
                result,
                recordId,
                processingTime
            );
            
            this.logger.log(`🎯 대기중인 요청 조회 ${payload.userId} 처리 완료 (${processingTime}ms)`);
        } catch (error) {
            const processingTime = Date.now() - startTime;
            this.logger.error(`대기중인 요청 조회 요청 처리 실패: ${error.message}`);
            
            await this.publisherService.publishErrorResponse(
                'REGISTER_USER',
                error.message,
                recordId,
                processingTime
            );
        }
    }
}