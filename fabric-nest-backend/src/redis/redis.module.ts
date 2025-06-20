// ==================== redis.module.ts - OrganizationService 포함 ====================
import { Module } from '@nestjs/common';
import { RedisStreamsClient } from './redis-streams-client';
import { StreamsPublisherService } from './streams-publisher.service';
import { StreamsSubscriberService } from './streams-subscriber.service';
import { HealthCheckStreamsService } from './healthcheck-streams.service';
import { HealthCheckStreamsSubscriber } from './healthcheck-streams-subscriber';
import { OrganizationModule } from 'src/organization/organization.module'; // 🔥 추가

@Module({
  providers: [
    RedisStreamsClient,
    StreamsPublisherService,
    HealthCheckStreamsSubscriber,
    HealthCheckStreamsService,
    StreamsSubscriberService,
  ],
  exports: [
    RedisStreamsClient,
    StreamsPublisherService,
    StreamsSubscriberService,
    HealthCheckStreamsService,
    HealthCheckStreamsSubscriber,
  ],
})
export class RedisModule {}