// ==================== redis-streams-client.ts ====================
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisStreamsClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisStreamsClient.name);
  private readonly redisClient: Redis;
  
  // Stream 이름 정의
  readonly STREAMS = {
    // Spring -> NestJS 요청 스트림
    SPRING_TO_NESTJS: 'spring-nestjs-requests',
    // NestJS -> Spring 응답 스트림  
    NESTJS_TO_SPRING: 'nestjs-spring-responses'
  } as const;

  // Consumer Group 이름
  readonly CONSUMER_GROUPS = {
    NESTJS_CONSUMER: 'nestjs-consumer-group',
    SPRING_CONSUMER: 'spring-consumer-group'
  } as const;

  constructor(private configService: ConfigService) {
    const redisOptions = {
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD', ''),
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 500, 5000);
        this.logger.warn(`Redis 연결 재시도 ${times}회, ${delay}ms 후 시도...`);
        return delay;
      },
    };

    this.redisClient = new Redis(redisOptions);
    this._setupRedisEventHandlers();
  }

  async onModuleInit() {
    this.logger.log('Redis Streams 클라이언트 초기화 중...');
    await this._initializeStreamsAndGroups();
  }

  async onModuleDestroy() {
    try {
      await this.redisClient.quit();
      this.logger.log('Redis 연결 종료됨');
    } catch (error) {
      this.logger.error(`Redis 연결 종료 중 오류 발생: ${error.message}`);
    }
  }

  private _setupRedisEventHandlers() {
    this.redisClient.on('connect', () => {
      this.logger.log('Redis 연결 중...');
    });
    
    this.redisClient.on('ready', () => {
      this.logger.log('Redis 준비 완료');
    });
    
    this.redisClient.on('error', (err) => {
      this.logger.error(`Redis 오류: ${err.message}`);
    });
    
    this.redisClient.on('close', () => {
      this.logger.warn('Redis 연결이 닫혔습니다');
    });
    
    this.redisClient.on('reconnecting', () => {
      this.logger.warn('Redis 재연결 중...');
    });
  }

  private async _initializeStreamsAndGroups() {
    try {
      // Consumer Group 생성 (이미 존재하면 무시)
      await this._createConsumerGroupSafely(
        this.STREAMS.SPRING_TO_NESTJS,
        this.CONSUMER_GROUPS.NESTJS_CONSUMER
      );
      
      await this._createConsumerGroupSafely(
        this.STREAMS.NESTJS_TO_SPRING,
        this.CONSUMER_GROUPS.SPRING_CONSUMER
      );
      
      this.logger.log('스트림 및 컨슈머 그룹 초기화 완료');
    } catch (error) {
      this.logger.error(`스트림 초기화 실패: ${error.message}`);
      throw error;
    }
  }

  private async _createConsumerGroupSafely(streamName: string, groupName: string) {
    try {
      await this.redisClient.xgroup('CREATE', streamName, groupName, '$', 'MKSTREAM');
      this.logger.log(`컨슈머 그룹 생성: ${groupName} for ${streamName}`);
    } catch (error) {
      if (error.message.includes('BUSYGROUP')) {
        this.logger.log(`컨슈머 그룹 이미 존재: ${groupName}`);
      } else {
        throw error;
      }
    }
  }

  get client() {
    return this.redisClient;
  }
}