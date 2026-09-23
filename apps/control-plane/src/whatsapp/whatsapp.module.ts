import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WhatsAppService } from './whatsapp.service';
import { HermesModule } from '../hermes/hermes.module';

@Module({
  imports: [HermesModule],
  controllers: [WebhookController],
  providers: [WhatsAppService],
})
export class WhatsAppModule {}
