import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';
import { FabricModule } from 'src/fabric/fabric.module';
import { RedisModule } from 'src/redis/redis.module';
import { FirebaseModule } from 'src/firebase/firebase.module';
import { OrganizationStreamsSubscriber } from 'src/organization/organization.streams-subscribe'


@Module({
  imports: [
    FabricModule,
    RedisModule, 
    FirebaseModule
  ],
  controllers: [OrganizationController],
  providers: [
    OrganizationService, 
    OrganizationStreamsSubscriber
  ],
  exports: [
    OrganizationService,
    OrganizationStreamsSubscriber 
  ],
})
export class OrganizationModule implements OnModuleInit {
  private readonly logger = new Logger(OrganizationModule.name);

  constructor() {
    this.logger.log('🏗️🔥 OrganizationModule 생성자 호출됨');
    console.log('🏗️🔥 OrganizationModule 생성자 실행됨');
  }

  async onModuleInit() {
    this.logger.log('🏗️🔥 OrganizationModule.onModuleInit 호출됨!!!');
    console.log('🏗️🔥 OrganizationModule.onModuleInit 실행됨!!!');
    
    // OrganizationStreamsSubscriber가 제대로 생성되었는지 확인
    setTimeout(() => {
      console.log('🏗️ OrganizationModule - 5초 후 상태 확인');
    }, 5000);
  }
}