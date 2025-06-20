import { Module } from '@nestjs/common';
import { FabricService } from './fabric.service';
import { FirebaseService } from 'src/firebase/firebase.service';

@Module({
  providers: [FabricService, FirebaseService],
  exports: [FabricService],
})
export class FabricModule {}
