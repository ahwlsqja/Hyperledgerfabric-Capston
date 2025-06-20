import { Injectable, Logger } from "@nestjs/common";
import { LedgerService } from "./ledger.service";
import { ConfigService } from "@nestjs/config";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import { AddEntryDto } from "./dtos/addEntryDto";
import { ApproveDepositEntryDto } from "./dtos/approveDepositEntryDto";
import { RejectDepositEntryDto } from "./dtos/rejectDepositEntryDto";
import { VoteWithdrawEntryDto } from "./dtos/voteWithdrawEntryDto";
import { GetVoteStatusDto } from "./dtos/getVoteStatusDto";
import { GetThemeBalanceDto } from "./dtos/getThemeBalanceDto";
import { StreamsPublisherService } from "src/redis/streams-publisher.service";
import { mockVoteStatusAfterFirstApproval, mockVoteStatusMoreApprovals } from "./mock-datas/withdrawvote-mock";
import { mockPendingDepositEntries } from "./mock-datas/pending-deposit-mock";
import { mockAllThemeBalances, mockThemeBalanceClubActivity } from "./mock-datas/theme-balance.mock";
import { LedgerEntryType } from "src/types";

@Injectable()
export class LedgerStreamsSubcriber {
    private readonly logger = new Logger(LedgerStreamsSubcriber.name);
    private isListenersRegistered = false; // 🔥 중복 등록 방지 플래그

    constructor(
        private ledgerService: LedgerService,
        private publisherService: StreamsPublisherService,
        private eventEmitter: EventEmitter2  
    ){
        console.log('🔥🔥🔥 LedgerStreamsSubcriber 생성자 호출됨!!!');
        this.logger.log('🔥🔥🔥 LedgerStreamsSubcriber 생성자 실행!!!');
        
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
            
            // 🔥 입금 기입 신청 이벤트
            this.eventEmitter.on('spring:request:ledger', async (data) => {
                console.log('🎯🔥 입금 기입 신청 리스너 호출됨!!! 🔥🔥🔥', data);
                await this._handleRegisterDepositInternal(data);
            });
            
            // 🔥 입금 기입 승인 신청 이벤트
            this.eventEmitter.on('spring:request:approve-deposit', async (data) => {
                console.log('🎯🔥 입금 기입 승인 리스너 호출됨!', data);
                await this._handleApproveDepositInternal(data);
            });
            
            // 🔥 입금 기입 거절 신청 이벤트
            this.eventEmitter.on('spring:request:reject-deposit', async (data) => {
                console.log('🎯🔥 입금 기입 거절 신청 리스너 호출됨:', data);
                await this._handleRejectDepositInternal(data)
            });
            
            // 🔥 출금 기입 신청 이벤트
            this.eventEmitter.on('spring:request:ledger-withdraw', async (data) => {
                console.log('🎯🔥 출금 기입 신청 리스너 호출됨:', data);
                await this._handleRegisterWithdrawInternal(data)
            });
            
            // 🔥 출금 기입 투표 이벤트
            this.eventEmitter.on('spring:request:vote-withdraw', async (data) => {
                console.log('🎯🔥 출금 기입 투표 리스너 호출됨:', data);
                await this._handleVoteWithdrawInternal(data)
            });
            
            // 🔥 대기중인 입금 기입 신청 조회 이벤트
            this.eventEmitter.on('spring:request:pending-deposits', async (data) => {
                console.log('🎯🔥 대기중인 입금 기입 신청 조회 리스너 호출됨:', data);
                await this._handleGetRequestPendingDepositInternal(data)
            });
            
            // 🔥 대기중인 출금 기입 신청 조회 이벤트
            this.eventEmitter.on('spring:request:pending-withdraws', async (data) => {
                console.log('🎯🔥 대기중인 출금 기입 신청 조회 리스너 호출됨:', data);
                await this._handleGetPendingWithDrawInternal(data)
            });
            
            // // 🔥 투표 상태 조회 이벤트
            this.eventEmitter.on('spring:request:vote-status', async (data) => {
                console.log('🎯🔥 투표 상태 조회 리스너 호출됨:', data);
                await this._handleGetVoteStatusWithDrawInternal(data)
            });
            
            // 🔥 특정 테마 잔액 조회 이벤트
            this.eventEmitter.on('spring:request:theme-balance', async (data) => {
                console.log('🎯🔥 특정 테마 잔액 조회 리스너 호출됨:', data);
                await this._handleThemeBalanceInternal(data)
            });       
            
            
            // 🔥 전 테마 잔액 조회 이벤트
            this.eventEmitter.on('spring:request:alltheme-balance', async (data) => {
                console.log('🎯🔥 전 테마 잔액 조회 리스너 호출됨:', data);
                await this._handleAllThemeBalanceInternal(data)
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
            // 'spring:request:test',
            // 'spring:request:register-user',
            // 'spring:request:approve',
            // 'spring:request:reject',
            // 'spring:request:student-count',
            // 'spring:request:student-council-count',
            // 'spring:request:pending-register',
            // 'spring:request:register-user-status'
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

    private async _handleRegisterDepositInternal(payload: any){
        const startTime = Date.now();
        const recordId = payload._recordId || 'unknown';
        const environment = process.env.NODE_ENV || 'development';

        try{
            this.logger.log(`입금 기입 요청 이벤트 수신: ${JSON.stringify(payload)}`);
            
            let result: any;

            if (environment === 'production' || environment === 'prod') {
                // 🚀 Production 모드: 실제 서비스 로직 실행
                this.logger.log('🚀 Production 모드: 실제 서비스 호출');

                result = await this.ledgerService.addDepositEntry(
                    payload.userId,
                    payload.theme, 
                    payload.amount, 
                    payload.description, 
                    payload.documentURL
                );
                
                this.logger.log(`✅ Production 서비스 처리 완료: ${JSON.stringify(result)}`);
                
            } else {
                let ledger
                // 🧪 Development 모드: 모의 데이터 반환
                ledger = await this.ledgerService.createLedger(payload.userId, payload.amount, payload.theme, LedgerEntryType.DEPOSIT, payload.documentURL)
                this.logger.log('🧪 Development 모드: 모의 데이터 생성');
                result = {
                    success: true,
                    ledgerEntryId: ledger.id,
                    message: `사용자 ${payload.userId} 등록 및 회원가입 요청이 생성되었습니다`,
                };
                
                this.logger.log(`✅ Development 모의 데이터 생성 완료: ${JSON.stringify(result)}`);
            }

            const processingTime = Date.now() - startTime;

            await this.publisherService.publishSuccessResponse(
                'ADD_DEPOSIT',
                result,
                recordId,
                processingTime,
            );

            this.logger.log(`입금 기입 요청 이벤트 수신 ${payload.userId} 처리 완료`)
        }catch(error){
            const processingTime = Date.now() - startTime;

            this.logger.error(`입금 기입 요청 실패: ${error.message}`)

            await this.publisherService.publishErrorResponse(
                'ADD_DEPOSIT',
                error.message,
                recordId,
                processingTime,
            )
        }
    }

    // 입금 승인 요청
    private async _handleApproveDepositInternal(payload: any){
        const startTime = Date.now();
        const recordId = payload._recordId || 'unknown';
        const environment = process.env.NODE_ENV || 'development';

        try{
            this.logger.log(`입금 기입 승인 이벤트 수신: ${JSON.stringify(payload)}`);

            let result: any;

            if (environment === 'production' || environment === 'prod') {
                // 🚀 Production 모드: 실제 서비스 로직 실행
                this.logger.log('🚀 Production 모드: 실제 서비스 호출');

                result = await this.ledgerService.approveDepositEntry(
                    payload.ledgerEntryId, 
                    payload.approverId
                );
                
                this.logger.log(`✅ Production 서비스 처리 완료: ${JSON.stringify(result)}`);
                
            } else {
                // 🧪 Development 모드: 모의 데이터 반환
                let ledger;
                ledger = await this.ledgerService.approveDeposit(payload.ledgerEntryId, payload.approverId)
                this.logger.log('🧪 Development 모드: 모의 데이터 생성');
                result = {
                    success: true,
                    message: `입금 항목 ${payload.ledgerEntryId} 승인 완료`,
                };
                
                this.logger.log(`✅ Development 모의 데이터 생성 완료: ${JSON.stringify(result)}`);
            }
            const processingTime = Date.now() - startTime;

            await this.publisherService.publishSuccessResponse(
                "APPROVE_DEPOSIT",
                result,
                recordId,
                processingTime
            );

            this.logger.log(`입금 기입 승인 이벤트 수신 ${payload.ledgerEntryId} 처리 완료`)
        }catch(error){
            const processingTime = Date.now() - startTime;

            this.logger.error(`입금 기입 승인 실패: ${error.message}`)

            await this.publisherService.publishErrorResponse(
                "APPROVE_DEPOSIT",
                error.message,
                recordId,
                processingTime,
            );
        }
    }

    // 입금 거절 요청
    private async _handleRejectDepositInternal(payload:any){
        const startTime = Date.now();
        const recordId = payload._recordId || 'unknown';
        const environment = process.env.NODE_ENV || 'development';

        try{
            this.logger.log(`입금 기입 거절 이벤트 수신: ${JSON.stringify(payload)}`);

            let result: any;
            
            if (environment === 'production' || environment === 'prod') {
                // 🚀 Production 모드: 실제 서비스 로직 실행
                this.logger.log('🚀 Production 모드: 실제 서비스 호출');

                result = await this.ledgerService.rejectDepositEntry(
                    payload.ledgerEntryId, 
                    payload.rejectorId
                );
                
                this.logger.log(`✅ Production 서비스 처리 완료: ${JSON.stringify(result)}`);
                
            } else {
                let ledger;
                ledger = await this.ledgerService.rejectDeposit(payload.ledgerEntryId, payload.rejectorId)
                // 🧪 Development 모드: 모의 데이터 반환
                this.logger.log('🧪 Development 모드: 모의 데이터 생성');
                result = {
                    success: true,
                    message: `입금 항목 ${payload.ledgerEntryId} 승인 완료`,
                };
                
                this.logger.log(`✅ Development 모의 데이터 생성 완료: ${JSON.stringify(result)}`);
            }

            const processingTime = Date.now() - startTime;

            await this.publisherService.publishSuccessResponse(
                "REJECT_DEPOSIT",
                result,
                recordId,
                processingTime,
            );

            this.logger.log(`입금 기입 거절 이벤트 수신 ${payload.ledgerEntryId} 처리 완료`)
        }catch(error){
            const processingTime = Date.now() - startTime;

            this.logger.error(`입금 기입 거절 요청 실패: ${error.message}`)

            await this.publisherService.publishErrorResponse(
                "REJECT_DEPOSIT",
                error.message,
                recordId,
                processingTime
            );
        }
    }

    // 출금 기입 요청
    private async _handleRegisterWithdrawInternal(payload: any){
        const startTime = Date.now();
        const recordId = payload._recordId || 'unknown';
        const environment = process.env.NODE_ENV || 'development';

        try{
            this.logger.log(`출금 기입 요청 이벤트 수신: ${JSON.stringify(payload)}`);

            let result: any;


            if (environment === 'production' || environment === 'prod') {
                // 🚀 Production 모드: 실제 서비스 로직 실행
                this.logger.log('🚀 Production 모드: 실제 서비스 호출');

                result = await this.ledgerService.addWithdrawEntry(
                    payload.userId, 
                    payload.theme, 
                    payload.amount, 
                    payload.description, 
                    payload.documentURL
                );
                
                this.logger.log(`✅ Production 서비스 처리 완료: ${JSON.stringify(result)}`);
                
            } else {
                // 🧪 Development 모드: 모의 데이터 반환
                
                let ledgerEntryId = 'LEDGER_1640995200_student999'
                
                this.logger.log('🧪 Development 모드: 모의 데이터 생성');
                result = {
                    success: true,
                    ledgerEntryId,
                    message: '출금 항목이 성공적으로 추가되었습니다',
                };
                
                this.logger.log(`✅ Development 모의 데이터 생성 완료: ${JSON.stringify(result)}`);
            }

            const processingTime = Date.now() - startTime;

            await this.publisherService.publishSuccessResponse(
                "ADD_WITHDRAW",
                result,
                recordId,
                processingTime
            );

            this.logger.log(`출금 기입 요청 이벤트 수신 ${payload.userId} 처리 완료`)
        }catch(error){
            const processingTime = Date.now() - startTime;

            this.logger.error(`출금 기입 요청 실패: ${error.message}`)

            await this.publisherService.publishErrorResponse(
                "ADD_WITHDRAW",
                error.message,
                recordId,
                processingTime,
            );
        }
    }

    // 출금 투표
    private async _handleVoteWithdrawInternal(payload: any){
        const startTime = Date.now();
        const recordId = payload._recordId || 'unknown';
        const environment = process.env.NODE_ENV || 'development';

        try{
            this.logger.log(`출금 기입 투표 요청 이벤트 수신: ${JSON.stringify(payload)}`);

            let result: any;

            if (environment === 'production' || environment === 'prod') {
                // 🚀 Production 모드: 실제 서비스 로직 실행
                this.logger.log('🚀 Production 모드: 실제 서비스 호출');

                result = await this.ledgerService.voteWithdrawEntry(
                    payload.ledgerEntryId, 
                    payload.voterId, 
                    payload.vote
                );
                
                this.logger.log(`✅ Production 서비스 처리 완료: ${JSON.stringify(result)}`);
                
            } else {
                // 🧪 Development 모드: 모의 데이터 반환
                this.logger.log('🧪 Development 모드: 모의 데이터 생성');
                result = {
                    success: true,
                    message: `출금 항목 ${payload.ledgerEntryId}에 대한 투표가 성공적으로 기록되었습니다`,
                    status: mockVoteStatusAfterFirstApproval,
                };
                
                this.logger.log(`✅ Development 모의 데이터 생성 완료: ${JSON.stringify(result)}`);
            }

            const processingTime = Date.now() - startTime;

            await this.publisherService.publishSuccessResponse(
                'VOTE_WITHDRAW',
                result,
                recordId,
                processingTime,
            );

            this.logger.log(`출금 기입 투표 요청 이벤트 수신 ${payload.ledgerEntryId}의 ${payload.voterId}의 ${payload.vote}표 처리 완료`)
        }catch(error){
            const processingTime = Date.now() - startTime;
            
            this.logger.error(`출금 기입 투표 요청 실패: ${error.message}`);

            await this.publisherService.publishErrorResponse(
                'VOTE_WITHDRAW',
                error.message,
                recordId,
                processingTime,
            )
        }
    }

    // 대기 중인 입금 항목 조회
    private async _handleGetRequestPendingDepositInternal(payload: any){
        const startTime = Date.now();
        const recordId = payload._recordId || 'unknown';
        const environment = process.env.NODE_ENV || 'development';

        try{
            this.logger.log(`대기 중인 입금 항목 조회 이벤트 수신 ${payload}`);

            let result: any;

             if (environment === 'production' || environment === 'prod') {
                // 🚀 Production 모드: 실제 서비스 로직 실행
                this.logger.log('🚀 Production 모드: 실제 서비스 호출');
                result = await this.ledgerService.getPendingDepositEntries();
                
                this.logger.log(`✅ Production 서비스 처리 완료: ${JSON.stringify(result)}`);
                
            } else {
                this.logger.log('🧪 Development 모드: 모의 데이터 생성');
                result = await this.ledgerService.getPendingDeposit()

                // 결과 캐싱
                await this.publisherService.cacheSet(
                'ledger:pending-deposits',
                result,
                60 * 5, // 5분 동안 캐싱
                );
                
                this.logger.log(`✅ Development 모의 데이터 생성 완료: ${JSON.stringify(result)}`);
            }

            const processingTime = Date.now() - startTime;
            
            await this.publisherService.publishSuccessResponse(
                'GET_PENDING_DEPOSITS',
                result,
                recordId,
                processingTime,
            );

            this.logger.log(`대기 중인 입금 항목 조회 이벤트 수신 조회 완료 ledger:pending-deposits 캐싱`)
        }catch(error){
            const processingTime = Date.now() - startTime;

            this.logger.error(`대기 중인 입금 항목 조회 실패: ${error.message}`);

            await this.publisherService.publishErrorResponse(
                'GET_PENDING_DEPOSITS',
                error.message,
                recordId,
                processingTime,
            )
        }
    }

    // 대기 중인 출금 항목 조회
    private async _handleGetPendingWithDrawInternal(payload: any){
        const startTime = Date.now();
        const recordId = payload._recordId || 'unknown';
        const environment = process.env.NODE_ENV || 'development';

        try{
            this.logger.log(`대기 중인 출금 항목 조회 이벤트 수신 ${payload}`);

            let result: any;

             if (environment === 'production' || environment === 'prod') {
                // 🚀 Production 모드: 실제 서비스 로직 실행
                this.logger.log('🚀 Production 모드: 실제 서비스 호출');
                result = await this.ledgerService.getPendingWithdrawEntries();
                
                this.logger.log(`✅ Production 서비스 처리 완료: ${JSON.stringify(result)}`);
                
            } else {
                this.logger.log('🧪 Development 모드: 모의 데이터 생성');
                result = await this.ledgerService.getPendingWithdraw()

                // 결과 캐싱
                await this.publisherService.cacheSet(
                'ledger:pending-withdraws',
                result,
                60 * 5, // 5분 동안 캐싱
                );
                
                this.logger.log(`✅ Development 모의 데이터 생성 완료: ${JSON.stringify(result)}`);
            }

            const processingTime = Date.now() - startTime;

            await this.publisherService.publishSuccessResponse(
                'GET_PENDING_WITHDRAW',
                result,
                recordId,
                processingTime,
            );

            this.logger.log(`대기 중인 출금 항목 조회 이벤트 수신 조회 완료 ledger:pending-withdraws 캐싱`)
        }catch(error){
            const processingTime = Date.now() - startTime;

            this.logger.error(`대기 중인 출금 항목 조회 실패: ${error.message}`)

            await this.publisherService.publishErrorResponse(
                'GET_PENDING_WITHDRAW',
                error.message,
                recordId,
                processingTime
            )
        }
    }

    // 출금 투표 상태 조회
    private async _handleGetVoteStatusWithDrawInternal(payload: any){
        const startTime = Date.now();
        const recordId = payload._recordId || 'unknown';
        const environment = process.env.NODE_ENV || 'development';

        try{
            this.logger.log(`출금 투표 상태 조회 이벤트 수신`);

            let result: any

            if (environment === 'production' || environment === 'prod') {
                // 🚀 Production 모드: 실제 서비스 로직 실행
                this.logger.log('🚀 Production 모드: 실제 서비스 호출');
                result = await this.ledgerService.getWithdrawVoteStatus(payload.ledgerEntryId);
                
                this.logger.log(`✅ Production 서비스 처리 완료: ${JSON.stringify(result)}`);
                
            } else {
                this.logger.log('🧪 Development 모드: 모의 데이터 생성');
                result = mockVoteStatusMoreApprovals
                // 결과 캐싱
                await this.publisherService.cacheSet(
                `ledger:withdraw-vote:${payload.ledgerEntryId}`,
                result,
                60 * 5, // 5분 동안 캐싱
                );
                
                this.logger.log(`✅ Development 모의 데이터 생성 완료: ${JSON.stringify(result)}`);
            }

            const processingTime = Date.now() - startTime;

            await this.publisherService.publishSuccessResponse(
                'GET_VOTE_STATUS',
                result,
                recordId,
                processingTime,
            );

            this.logger.log(`출금 투표 상태 조회 이벤트 수신 조회 완료 ledger:withdraw-vote:${payload.ledgerEntryId} 캐싱`)
        }catch(error){
            const processingTime = Date.now() - startTime;

            this.logger.error(`출금 투표 상태 조회 실패: ${error.message}`)

            await this.publisherService.publishErrorResponse(
                "GET_VOTE_STATUS",
                error.message,
                recordId,
                processingTime
            )
        }
    }

    // 테마 잔액 조회
    private async _handleThemeBalanceInternal(payload: any){
        const startTime = Date.now();
        const recordId = payload._recordId || 'unknown';
        const environment = process.env.NODE_ENV || 'development';

        try{
            this.logger.log(`테마 잔액 조회 요청 이벤트 수신: ${JSON.stringify(payload)}`);

            let result: any

            if (environment === 'production' || environment === 'prod') {
                // 🚀 Production 모드: 실제 서비스 로직 실행
                this.logger.log('🚀 Production 모드: 실제 서비스 호출');
                result = await this.ledgerService.getThemeBalance(payload.theme);
                
                this.logger.log(`✅ Production 서비스 처리 완료: ${JSON.stringify(result)}`);
                
            } else {
                this.logger.log('🧪 Development 모드: 모의 데이터 생성');
                result = mockThemeBalanceClubActivity

                // 결과 캐싱
                await this.publisherService.cacheSet(
                `ledger:theme-balance:${payload.theme}`,
                result,
                60 * 5, // 5분 동안 캐싱
                );
                
                this.logger.log(`✅ Development 모의 데이터 생성 완료: ${JSON.stringify(result)}`);
            }

            const processingTime = Date.now() - startTime;

            await this.publisherService.publishSuccessResponse(
                'GET_THEME_BALANCE',
                result,
                recordId,
                processingTime,
            );

            this.logger.log(`테마 잔액 조회 요청 이벤트 수신 ledger:theme-balance:${payload.theme} 캐싱`)
        }catch(error){
            const processingTime = Date.now() - startTime;

            this.logger.error(`테마 잔액 조회 요청 실패: ${error.message}`)

            await this.publisherService.publishErrorResponse(
                'GET_THEME_BALANCE',
                error.message,
                recordId,
                processingTime
            )
        }
    }

    // 모든 테마 잔액 조회
    private async _handleAllThemeBalanceInternal(payload: any){
        const startTime = Date.now();
        const recordId = payload._recordId || 'unknown';
        const environment = process.env.NODE_ENV || 'development';

        try{
            this.logger.log(`모든 테마 잔액 조회 요청 이벤트 수신 ${payload}`);

             let result: any;

            if (environment === 'production' || environment === 'prod') {
                // 🚀 Production 모드: 실제 서비스 로직 실행
                this.logger.log('🚀 Production 모드: 실제 서비스 호출');
                result = await this.ledgerService.getAllThemeBalances();
                
                this.logger.log(`✅ Production 서비스 처리 완료: ${JSON.stringify(result)}`);
                
            } else {
                this.logger.log('🧪 Development 모드: 모의 데이터 생성');
                result = mockAllThemeBalances
                // 결과 캐싱
                await this.publisherService.cacheSet(
                'ledger:theme-balances',
                result,
                60 * 5, // 5분 동안 캐싱
                );
                this.logger.log(`✅ Development 모의 데이터 생성 완료: ${JSON.stringify(result)}`);
            }

            const processingTime = Date.now() - startTime;
            
            await this.publisherService.publishSuccessResponse(
                'GET_ALL_THEME_BALANCE',
                result,
                recordId,
                processingTime,
            );

            this.logger.log(`모든 테마 잔액 조회 요청 처리 완료`)
        }catch(error){
            const processingTime = Date.now() - startTime;

            this.logger.error(`모든 테마 잔액 조회 요청 실패: ${error.message}`)

            await this.publisherService.publishErrorResponse(
                'GET_ALL_THEME_BALANCE',
                error.message,
                recordId,
                processingTime,
            )
        }
    }
    // 나의 내역 조회
    // 스프링에서 특정 userId 로 redis 쿼리하는 식으로 해야할것 같음
}