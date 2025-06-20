import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { FabricModule } from './fabric/fabric.module';
import { FirebaseModule } from './firebase/firebase.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule } from './redis/redis.module';
import { LedgerModule } from './ledger/ledger.module';
import { OrganizationModule } from './organization/organization.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Joi from 'joi'
import { Ledger } from './ledger/entity/ledger.entity';

@Module({
  imports: [
    // 1. 기본 설정 모듈들을 가장 먼저
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid("development", "prod", "dev"),
        DB_TYPE: Joi.string().required(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_DATABASE: Joi.string().required(),
        CHANNEL_NAME: Joi.string().required(),
        CHAINCODE_NAME: Joi.string().required(),
        FIREBASE_PROJECT_ID: Joi.string().required(),
        FIREBASE_PRIVATE_KEY: Joi.string().required(),
        FIREBASE_CLIENT_EMAIL: Joi.string().required(),
        REDIS_HOST: Joi.string().required(),
        REDIS_PORT: Joi.number().required(),
        REDIS_PASSWORD: Joi.number().required(),
      })
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: configService.get<string>('DB_TYPE') as 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [
          Ledger
        ],
        synchronize: true,
        // ...(configService.get<string>(envVariableKeys.env) === 'prod' && {
        //   ssl: {
        //     rejectUnauthorized: false
        //   }
        // })
      }),
      inject: [ConfigService],
    }),
    EventEmitterModule.forRoot({
      // 옵션 설정 (선택사항)
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),
    RedisModule,
    AuthModule, 
    FabricModule, 
    FirebaseModule,
    LedgerModule,
    
    // 6. OrganizationModule을 가장 마지막에 (Redis와 EventEmitter에 의존)
    OrganizationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}