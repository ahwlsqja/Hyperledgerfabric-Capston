// ==================== HealthCheckStreamsSubscriber EventEmitter 공유 방식 ====================
import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TestSubscribeDto } from "./dtos/testSubcribeDto";
import { HealthCheckStreamsService } from "./healthcheck-streams.service";

@Injectable()
export class HealthCheckStreamsSubscriber implements OnApplicationBootstrap {
    private readonly logger = new Logger(HealthCheckStreamsSubscriber.name);
    private eventEmitter: EventEmitter2; // 🔥 private으로 변경

    constructor(
        private healthCheckService: HealthCheckStreamsService,
        private readonly injectedEventEmitter: EventEmitter2, // 🔥 이름 변경
    ) {
        // console.log('🎪 HealthCheckStreamsSubscriber 생성됨!!!');
        // this.logger.log('🎪 HealthCheckStreamsSubscriber 생성됨!!!');
        
        // 🔥 주입받은 EventEmitter를 초기값으로 설정
        this.eventEmitter = this.injectedEventEmitter;
        
        // 🔥 EventEmitter 정보 디버깅
        // console.log('🔍 HealthCheckSubscriber EventEmitter 정보:');
        // console.log('  - 인스턴스 존재:', !!this.eventEmitter);
        // console.log('  - 해시코드:', this.eventEmitter.toString());
    }

    // 🔥 외부에서 EventEmitter를 설정할 수 있는 메서드
    setEventEmitter(eventEmitter: EventEmitter2) {
        // console.log('🔄 EventEmitter 교체됨');
        // console.log('  - 기존 해시코드:', this.eventEmitter.toString());
        // console.log('  - 새로운 해시코드:', eventEmitter.toString());
        
        this.eventEmitter = eventEmitter;
        
        // 🔥 교체 후 즉시 리스너 등록
        this.registerEventListeners();
    }

    onApplicationBootstrap() {
        console.log('🚀 HealthCheckStreamsSubscriber 부트스트랩 시작!');
        this.logger.log('🚀 HealthCheckStreamsSubscriber 부트스트랩 시작!');
        
        // 🔥 수동으로 리스너 등록
        this.registerEventListeners();
        
        console.log('🚀 HealthCheckStreamsSubscriber 부트스트랩 완료!');
        this.logger.log('🚀 HealthCheckStreamsSubscriber 부트스트랩 완료!');
        
        // 등록 확인
        setTimeout(() => {
            console.log('🔍 HealthCheckStreamsSubscriber에서 리스너 상태 확인...');
            const testListeners = this.eventEmitter.listenerCount('spring:request:test');
            console.log(`🎯 HealthCheckSubscriber spring:request:test 리스너 수: ${testListeners}`);
            console.log(`🎯 HealthCheckSubscriber EventEmitter 해시: ${this.eventEmitter.toString()}`);
            
            if (testListeners <= 1) {
                console.log('❌ HealthCheckSubscriber 수동 등록 실패!');
            } else {
                console.log('✅ HealthCheckSubscriber 수동 등록 성공!');
            }
        }, 1000);
    }
    
    // 🔥 수동으로 이벤트 리스너 등록
    private registerEventListeners() {
        console.log('🔧 HealthCheckSubscriber 수동 리스너 등록 시작...');
        console.log('🔧 사용할 EventEmitter 해시:', this.eventEmitter.toString());
        
        this.eventEmitter.on('spring:request:test', async (payload: any) => {
            console.log('🔥🔥🔥 HealthCheckSubscriber 수동 등록 리스너 호출됨!!! 🔥🔥🔥');
            this.logger.log('🔥🔥🔥 HealthCheckSubscriber 수동 등록 리스너 호출됨!!! 🔥🔥🔥');
            
            await this.handleTestRequest(payload);
        });
        
        console.log('🔧 HealthCheckSubscriber 수동 이벤트 리스너 등록 완료');
        
        // 즉시 확인
        const count = this.eventEmitter.listenerCount('spring:request:test');
        console.log(`🎯 등록 직후 리스너 수: ${count}`);
    }

    // 🔥 @OnEvent 제거하고 일반 메서드로 변경
    async handleTestRequest(payload: TestSubscribeDto & { _recordId: string }) {
        console.log('🔥🔥🔥 HealthCheckSubscriber handleTestRequest 실행됨!!! 🔥🔥🔥');
        this.logger.log('🔥🔥🔥 HealthCheckSubscriber handleTestRequest 실행됨!!! 🔥🔥🔥');
        
        const startTime = Date.now();
        try {
            const recordId = payload._recordId || 'unknown';
            
            this.logger.log(`테스트 구독 이벤트 수신: ${JSON.stringify(payload)}`);
            
            await this.healthCheckService.healthCheckStreams(
                recordId,
                payload.userId,
                payload.theme,
                payload.amount,
                payload.description,
                payload.documentURL,
            );
        } catch (error) {
            this.logger.error(`테스트 구독 처리 실패: ${error.message}`);
        }
    }
}