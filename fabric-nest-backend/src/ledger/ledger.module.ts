import { Module } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { LedgerController } from './ledger.controller';
import { FabricModule } from 'src/fabric/fabric.module';
import { RedisModule } from 'src/redis/redis.module';
import { FirebaseModule } from 'src/firebase/firebase.module';
import { LedgerStreamsSubcriber } from './ledger.subcribe';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ledger } from './entity/ledger.entity';


@Module({
  imports: [
    FabricModule, 
    RedisModule, 
    FirebaseModule,
    TypeOrmModule.forFeature([
      Ledger
    ]),
  ],
  controllers: [LedgerController],
  providers: [
    LedgerService,
    LedgerStreamsSubcriber,
  ],
  exports: [
    LedgerService,
    LedgerStreamsSubcriber,
  ],
})
export class LedgerModule {}
