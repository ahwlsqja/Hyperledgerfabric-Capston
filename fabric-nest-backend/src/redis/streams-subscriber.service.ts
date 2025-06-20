// ==================== EventEmitter 디버깅 및 통일 ====================
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RedisStreamsClient } from './redis-streams-client';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RegisterUserDto } from 'src/organization/dtos/registerUserDto';
import { MembershipApprovalDto } from 'src/organization/dtos/membershipApprovalDto';
import { MembershipRejectionDto } from 'src/organization/dtos/membershipRejectionDto';
import { GetOneRegisterStatus } from 'src/organization/dtos/getRegisterStatusDto';
import { TestSubscribeDto } from './dtos/testSubcribeDto';
import { HealthCheckStreamsSubscriber } from './healthcheck-streams-subscriber';
import { AddEntryDto } from 'src/ledger/dtos/addEntryDto';
import { ApproveDepositEntryDto } from 'src/ledger/dtos/approveDepositEntryDto';
import { RejectDepositEntryDto } from 'src/ledger/dtos/rejectDepositEntryDto';
import { VoteWithdrawEntryDto } from 'src/ledger/dtos/voteWithdrawEntryDto';
import { GetVoteStatusDto } from 'src/ledger/dtos/getVoteStatusDto';
import { GetThemeBalanceDto } from 'src/ledger/dtos/getThemeBalanceDto';

@Injectable()
export class StreamsSubscriberService implements OnModuleInit {
  private readonly logger = new Logger(StreamsSubscriberService.name);
  private readonly consumerName = 'nest-consumer';
  private isListening = false;

  readonly channelDtoMap = {
    'spring:request:test': TestSubscribeDto,
    'spring:request:register-user': RegisterUserDto,
    'spring:request:approve': MembershipApprovalDto,
    'spring:request:reject': MembershipRejectionDto,
    'spring:request:student-count': null,
    'spring:request:student-council-count': null,
    'spring:request:pending-register': null,
    'spring:request:register-user-status': GetOneRegisterStatus,
    'spring:request:ledger': AddEntryDto,
    'spring:request:approve-deposit': ApproveDepositEntryDto,
    'spring:request:reject-deposit': RejectDepositEntryDto,
    'spring:request:ledger-withdraw': AddEntryDto,
    'spring:request:vote-withdraw':VoteWithdrawEntryDto,
    'spring:request:pending-deposits': null,
    'spring:request:pending-withdraws': null,
    'spring:request:vote-status': GetVoteStatusDto,
    'spring:request:theme-balance': GetThemeBalanceDto,
    'spring:request:alltheme-balance': null,
  };

  readonly requestTypeToChannelMap = {
    'TEST_REQUEST': 'spring:request:test',
    'REGISTER_USER': 'spring:request:register-user',
    'APPROVE_MEMBERSHIP': 'spring:request:approve',
    'REJECT_MEMBERSHIP': 'spring:request:reject',
    'GET_STUDENT_COUNT': 'spring:request:student-count',
    'GET_COUNCIL_COUNT': 'spring:request:student-council-count',
    'GET_PENDING_REQUESTS': 'spring:request:pending-register',
    'GET_REQUEST_STATUS': 'spring:request:register-user-status',
    'ADD_DEPOSIT': 'spring:request:ledger',
    'APPROVE_DEPOSIT': 'spring:request:approve-deposit',
    'REJECT_DEPOSIT': 'spring:request:reject-deposit',
    'ADD_WITHDRAW': 'spring:request:ledger-withdraw',
    'VOTE_WITHDRAW': 'spring:request:vote-withdraw',
    'GET_PENDING_DEPOSITS': 'spring:request:pending-deposits',
    'GET_PENDING_WITHDRAW': 'spring:request:pending-withdraws',
    'GET_VOTE_STATUS': 'spring:request:vote-status',
    'GET_THEME_BALANCE': 'spring:request:theme-balance',
    'GET_ALL_THEME_BALANCE': 'spring:request:alltheme-balance'
  };

  constructor(
    private readonly streamsClient: RedisStreamsClient,
    private readonly eventEmitter: EventEmitter2,
    private readonly healthCheckSubscriber: HealthCheckStreamsSubscriber,
  ) {
    console.log('🔧 StreamsSubscriberService 생성됨');
    
    // 🔥 EventEmitter 인스턴스 디버깅
    console.log('🔍 StreamsSubscriberService EventEmitter 정보:');
    console.log('  - 인스턴스 존재:', !!this.eventEmitter);
    console.log('  - 타입:', typeof this.eventEmitter);
    console.log('  - 생성자:', this.eventEmitter.constructor.name);
    console.log('  - 해시코드:', this.eventEmitter.toString());
    
    // 🔥 HealthCheckSubscriber와 같은 인스턴스인지 확인
    if (this.healthCheckSubscriber) {
      console.log('🔍 HealthCheckSubscriber의 EventEmitter와 비교 준비됨');
    }
    
    // 🔥 즉시 확인
    setTimeout(() => {
      const count = this.eventEmitter.listenerCount('spring:request:test');
      console.log(`🎯 StreamsSubscriberService에서 확인한 리스너 수: ${count}`);
    }, 100);
  }

  async onModuleInit() {
    this.logger.log('Redis Streams 구독 서비스 초기화 중...');

    // 🔥 HealthCheckSubscriber에 EventEmitter 직접 전달
    if (this.healthCheckSubscriber && typeof this.healthCheckSubscriber['setEventEmitter'] === 'function') {
      console.log('🔄 HealthCheckSubscriber에 EventEmitter 직접 전달...');
      this.healthCheckSubscriber['setEventEmitter'](this.eventEmitter);
    }

    // 🔥 여러 시점에서 리스너 상태 확인
    setTimeout(() => this._checkEventListeners('3초 후'), 3000);
    
    // 🔥 강제 테스트 이벤트 발행
    setTimeout(() => {
      console.log('🧪 강제 테스트 이벤트 발행...');
      this.eventEmitter.emit('spring:request:test', {
        userId: 'test-user',
        theme: 'test-theme', 
        amount: '100',
        description: 'test-description',
        documentURL: 'test-url',
        _recordId: 'test-record-id'
      });
    }, 10000);

    await this.startListening();
    this.logger.log('Redis Streams 구독 서비스 초기화 완료');
  }

  private _checkEventListeners(timeLabel: string) {
    console.log(`\n🕐 === ${timeLabel} 리스너 상태 확인 ===`);
    
    // 🔥 EventEmitter 인스턴스 정보 재확인
    console.log('🔍 현재 EventEmitter 정보:');
    console.log('  - 해시코드:', this.eventEmitter.toString());
    console.log('  - 메모리 주소 (대략):', JSON.stringify(this.eventEmitter).substring(0, 50));
    
    const eventNames = this.eventEmitter.eventNames();
    console.log('🎭 등록된 모든 이벤트:', eventNames);
    
    Object.keys(this.channelDtoMap).forEach(channel => {
      const count = this.eventEmitter.listenerCount(channel);
      console.log(`🎯 ${channel} 리스너 수: ${count}`);
      
      const listeners = this.eventEmitter.listeners(channel);
      console.log(`   └─ 리스너 함수 개수: ${listeners.length}`);
    });

    const testListeners = this.eventEmitter.listenerCount('spring:request:test');
    if (testListeners <= 1) {
      console.log('❌ @OnEvent 리스너가 등록되지 않았습니다!');
    } else {
      console.log('✅ @OnEvent 리스너가 정상 등록되었습니다!');
    }
    console.log(`=================================\n`);
  }

  // ... 나머지 메서드들은 동일
  async startListening() {
    if (this.isListening) {
      this.logger.warn('이미 리스닝 중입니다');
      return;
    }

    this.isListening = true;
    this.logger.log('스트림 메시지 리스닝 시작');

    while (this.isListening) {
      try {
        await this._processMessages();
      } catch (error) {
        this.logger.error(`메시지 처리 중 오류: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  stopListening() {
    this.isListening = false;
    this.logger.log('스트림 메시지 리스닝 중지');
  }

  private async _processMessages() {
    try {
      const result = await this.streamsClient.client.xreadgroup(
        'GROUP',
        this.streamsClient.CONSUMER_GROUPS.NESTJS_CONSUMER,
        this.consumerName,
        'COUNT', 10,
        'BLOCK', 1000,
        'STREAMS',
        this.streamsClient.STREAMS.SPRING_TO_NESTJS,
        '>'
      );

      if (!result) return;
      if (!Array.isArray(result)) {
        this.logger.warn('예상하지 못한 xreadgroup 응답 형태:', typeof result);
        return;
      }

      for (const streamData of result) {
        if (!Array.isArray(streamData) || streamData.length < 2) continue;

        const [streamName, streamMessages] = streamData;
        if (!Array.isArray(streamMessages)) continue;
        
        for (const message of streamMessages) {
          if (!Array.isArray(message) || message.length < 2) continue;

          const [recordId, fields] = message;
          await this._processMessage(recordId as string, fields as string[]);
        }
      }
    } catch (error) {
      if (error.message && error.message.includes('NOGROUP')) {
        this.logger.warn('컨슈머 그룹이 존재하지 않습니다. 재생성 시도...');
        await this.streamsClient['_initializeStreamsAndGroups']();
      } else {
        throw error;
      }
    }
  }

  private async _processMessage(recordId: string, fields: string[]) {
    try {
      if (!recordId || !Array.isArray(fields)) {
        this.logger.error(`잘못된 메시지 데이터: recordId=${recordId}, fields=${fields}`);
        return;
      }

      const messageData = this._fieldsToObject(fields);
      
      this.logger.log(`메시지 처리 시작: recordId=${recordId}, 타입=${messageData.requestType}`);

      if (!messageData.requestType) {
        this.logger.error(`requestType이 없는 메시지: ${recordId}`);
        return;
      }

      await this._handleMessage(messageData.requestType, messageData.data, recordId);

      // ACK
      await this.streamsClient.client.xack(
        this.streamsClient.STREAMS.SPRING_TO_NESTJS,
        this.streamsClient.CONSUMER_GROUPS.NESTJS_CONSUMER,
        recordId
      );

      this.logger.log(`메시지 처리 완료: ${recordId}`);
    } catch (error) {
      this.logger.error(`메시지 처리 실패 (${recordId}): ${error.message}`);
    }
  }

  private async _handleMessage(requestType: string, data: any, recordId: string): Promise<void> {
    try {
      const channel = this.requestTypeToChannelMap[requestType];
      
      if (!channel) {
        this.logger.warn(`알 수 없는 requestType: ${requestType}`);
        return;
      }

      this.logger.log(`채널 "${channel}"로 메시지 처리 중 (recordId: ${recordId})`);
      
      const enrichedData = { ...data, _recordId: recordId };
      const DtoClass = this.channelDtoMap[channel];

      if (DtoClass) {
        const { _recordId, ...dataForValidation } = enrichedData;
        const dtoInstance = plainToInstance(DtoClass, dataForValidation);
        const errors = await validate(dtoInstance);
        
        if (errors.length > 0) {
          console.log('❌ DTO 유효성 검사 실패!');
          console.log('검사 대상 데이터:', JSON.stringify(dataForValidation, null, 2));
          console.log('에러 내용:', JSON.stringify(errors, null, 2));
          this.logger.warn(`메시지 유효성 검사 실패: ${JSON.stringify(errors)}`);
          return;
        } else {
          console.log('✅ DTO 유효성 검사 통과!');
        }
        
        const validatedData = { ...dtoInstance, _recordId };
        
        const listenerCount = this.eventEmitter.listenerCount(channel);
        this.logger.log(`📡 채널 "${channel}" 리스너 수: ${listenerCount}`);
        
        // 🔥 이벤트 발행 전후 로그 추가
        console.log(`🚀 이벤트 발행 시도: "${channel}"`);
        this.eventEmitter.emit(channel, validatedData);
        console.log(`✅ 이벤트 발행 완료: "${channel}"`);
        this.logger.log(`✅ 이벤트 '${channel}' 발행 완료 (유효성 검사 통과)`);
        
      } else {
        const listenerCount = this.eventEmitter.listenerCount(channel);
        this.logger.log(`📡 채널 "${channel}" 리스너 수: ${listenerCount}`);
        
        console.log(`🚀 이벤트 발행 시도: "${channel}" (DTO 없음)`);
        this.eventEmitter.emit(channel, enrichedData);
        console.log(`✅ 이벤트 발행 완료: "${channel}" (DTO 없음)`);
        this.logger.log(`✅ 이벤트 '${channel}' 발행 완료 (DTO 매핑 없음)`);
      }
      
    } catch (error) {
      this.logger.error(`메시지 처리 중 오류 발생 (requestType: ${requestType}): ${error.message}`);
    }
  }

  private _fieldsToObject(fields: string[]): any {
    const obj: any = {};
    
    if (!Array.isArray(fields) || fields.length % 2 !== 0) {
      this.logger.warn('잘못된 필드 형태:', fields);
      return obj;
    }
    
    for (let i = 0; i < fields.length; i += 2) {
      const key = fields[i];
      const value = fields[i + 1];
      
      if (typeof key !== 'string' || typeof value !== 'string') continue;
      
      if (key === 'data') {
        try {
          obj[key] = JSON.parse(value);
        } catch (parseError) {
          this.logger.warn(`JSON 파싱 실패 for ${key}: ${value}`);
          obj[key] = value;
        }
      } else {
        obj[key] = value;
      }
    }
    return obj;
  }
}