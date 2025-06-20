// ==================== healthcheck-streams.service.ts ====================
import { Injectable, Logger } from "@nestjs/common";
import { StreamsPublisherService } from "./streams-publisher.service";

@Injectable()
export class HealthCheckStreamsService {
    private readonly logger = new Logger(HealthCheckStreamsService.name);

    constructor(
        private publisherService: StreamsPublisherService
    ) {
        console.log('🎪 HealthCheckStreamsSubscriber 생성됨!!!');
    }

    async healthCheckStreams(
        recordId: string,
        userId: string,
        theme: string,
        amount: string,
        description: string,
        documentURL: string,
    ) {
        const startTime = Date.now();
        
        try {
            this.logger.log(`헬스체크 요청 처리 시작: ${recordId}`);
            
            // 처리 로직 (실제 비즈니스 로직 대신 간단한 응답)
            const result = {
                recordId,
                userId,
                theme,
                amount,
                description,
                documentURL,
                status: 'processed',
                processedAt: new Date().toISOString()
            };

            const processingTime = Date.now() - startTime;

            // 성공 응답 발행
            await this.publisherService.publishSuccessResponse(
                'TEST_REQUEST',
                result,
                recordId,
                processingTime
            );

            this.logger.log(`헬스체크 요청 처리 완료: ${recordId}`);
            
            return {
                success: true,
                message: '성공적으로 Test Streams 처리되었습니다!',
                result
            };
        } catch (error) {
            const processingTime = Date.now() - startTime;
            this.logger.error(`헬스체크 요청 처리 실패: ${recordId}, 오류: ${error.message}`);
            
            // 오류 응답 발행
            await this.publisherService.publishErrorResponse(
                'TEST_REQUEST',
                error.message,
                recordId,
                processingTime
            );
            
            throw error;
        }
    }
}