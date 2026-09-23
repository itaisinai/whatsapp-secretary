import { Module } from '@nestjs/common';
import { HermesController } from './hermes.controller';
import { HermesService } from './hermes.service';

@Module({
  controllers: [HermesController],
  providers: [HermesService],
  exports: [HermesService],
})
export class HermesModule {}
