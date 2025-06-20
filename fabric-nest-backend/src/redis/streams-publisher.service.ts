import { Injectable, Logger } from '@nestjs/common';
import { RedisStreamsClient } from './redis-streams-client';

@Injectable()
export class StreamsPublisherService {
  private readonly logger = new Logger(StreamsPublisherService.name);

  constructor(private readonly streamsClient: RedisStreamsClient) {}

  /**
   * 성공 응답 발행 - recordId 기반
   */
  async publishSuccessResponse(
    requestType: string,
    result: any,
    originalRecordId: string,  // 🔥 Spring에서 온 원본 recordId
    processingTime?: number
  ) {
    try {
      const messageId = await this.streamsClient.client.xadd(
        this.streamsClient.STREAMS.NESTJS_TO_SPRING,
        '*',
        'originalRecordId', originalRecordId,  // 🔥 핵심: 원본 요청의 recordId
        'requestType', requestType,
        'success', 'true',
        'result', JSON.stringify(result),
        'processingTime', (processingTime || 0).toString(),
        'timestamp', new Date().toISOString()
      );

      this.logger.debug(`성공 응답 발행: ${messageId} (원본: ${originalRecordId})`);
      return messageId;
    } catch (error) {
      this.logger.error(`성공 응답 발행 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 오류 응답 발행 - recordId 기반
   */
  async publishErrorResponse(
    requestType: string,
    error: string,
    originalRecordId: string,  // 🔥 Spring에서 온 원본 recordId
    processingTime?: number
  ) {
    try {
      const messageId = await this.streamsClient.client.xadd(
        this.streamsClient.STREAMS.NESTJS_TO_SPRING,
        '*',
        'originalRecordId', originalRecordId,  // 🔥 핵심: 원본 요청의 recordId
        'requestType', requestType,
        'success', 'false',
        'error', error,
        'processingTime', (processingTime || 0).toString(),
        'timestamp', new Date().toISOString()
      );

      this.logger.debug(`오류 응답 발행: ${messageId} (원본: ${originalRecordId})`);
      return messageId;
    } catch (error) {
      this.logger.error(`오류 응답 발행 실패: ${error.message}`);
      throw error;
    }
  }

  // 캐시 메서드들 (기존 유지)
  async cacheSet(key: string, value: any, ttlSeconds?: number): Promise<string> {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      if (ttlSeconds) {
        return await this.streamsClient.client.setex(key, ttlSeconds, stringValue);
      } else {
        return await this.streamsClient.client.set(key, stringValue);
      }
    } catch (error) {
      this.logger.error(`${key} 키 캐시 저장 실패: ${error.message}`);
      throw error;
    }
  }

  async cacheGet<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.streamsClient.client.get(key);
      if (!value) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    } catch (error) {
      this.logger.error(`${key} 키 캐시 조회 실패: ${error.message}`);
      throw error;
    }
  }

  async cacheDelete(key: string): Promise<number> {
    try {
      return await this.streamsClient.client.del(key);
    } catch (error) {
      this.logger.error(`${key} 키 캐시 삭제 실패: ${error.message}`);
      throw error;
    }
  }
}