import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  Inject,
  Logger,
  Post,
  Query,
  RawBodyRequest,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { verifyMetaSignature } from './meta-signature';
import { parseWhatsAppWebhook } from '@whatsapp-secretary/shared';
import { WhatsAppService } from './whatsapp.service';
import { HermesService } from '../hermes/hermes.service';

@Controller('webhooks/whatsapp')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    @Inject(ConfigService) private readonly config: ConfigService,
    @Inject(WhatsAppService) private readonly whatsappService: WhatsAppService,
    @Inject(HermesService) private readonly hermesService: HermesService,
  ) {
    this.logger.log(`WebhookController initialized - HermesService: ${!!hermesService}, WhatsAppService: ${!!whatsappService}`);
    if (!hermesService) {
      this.logger.error('⚠️  HermesService is UNDEFINED in constructor!');
    }
    if (!whatsappService) {
      this.logger.error('⚠️  WhatsAppService is UNDEFINED in constructor!');
    }
  }

  @Get()
  verify(
    @Query('hub.mode') mode: string | undefined,
    @Query('hub.verify_token') token: string | undefined,
    @Query('hub.challenge') challenge: string | undefined,
  ): string {
    const verifyToken = this.config.getOrThrow<string>('WHATSAPP_WEBHOOK_VERIFY_TOKEN');
    if (mode !== 'subscribe' || token !== verifyToken || !challenge) {
      throw new ForbiddenException('Webhook verification failed');
    }
    this.logger.log('WhatsApp webhook verified');
    return challenge;
  }

  @Post()
  @HttpCode(200)
  receive(
    @Req() request: RawBodyRequest<Request>,
    @Headers('x-hub-signature-256') signature: string | undefined,
    @Body() payload: unknown,
  ): { status: 'ok' } {
    const appSecret = this.config.getOrThrow<string>('WHATSAPP_APP_SECRET');
    if (!verifyMetaSignature(request.rawBody, signature, appSecret)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    this.logger.log(`WhatsApp webhook received: ${JSON.stringify(summarizePayload(payload))}`);

    setImmediate(() => {
      this.processMessageAsync(payload).catch((error) => {
        this.logger.error(`Async processing failed: ${error instanceof Error ? error.message : error}`);
      });
    });

    return { status: 'ok' };
  }

  private async processMessageAsync(payload: unknown): Promise<void> {
    const parsed = parseWhatsAppWebhook(payload);

    if (!parsed.isValid) {
      this.logger.error(`Invalid webhook payload: ${parsed.error}`);
      return;
    }

    if (!parsed.shouldProcess) {
      this.logger.debug(`Skipping webhook: ${parsed.error}`);
      return;
    }

    const context = parsed.context!;
    this.logger.log(
      `Processing message from ${context.sender.profileName || context.sender.phoneNumber}: "${context.message.text}"`,
    );

    try {
      this.logger.debug(`HermesService available: ${!!this.hermesService}`);
      this.logger.debug(`WhatsAppService available: ${!!this.whatsappService}`);

      if (!this.hermesService) {
        throw new Error('HermesService not initialized - dependency injection failed');
      }

      if (!this.whatsappService) {
        throw new Error('WhatsAppService not initialized - dependency injection failed');
      }

      const hermesResponse = await this.hermesService.processMessage(context.message.text, context);

      this.logger.log(`Hermes response received: "${hermesResponse.response}"`);

      if (!hermesResponse.response || hermesResponse.response.trim() === '') {
        this.logger.error('Hermes returned empty response');
        return;
      }

      const testRecipient = this.config.get<string>('whatsapp.testRecipient');
      const recipient = testRecipient || context.sender.phoneNumber;

      if (testRecipient) {
        this.logger.log(
          `Using test recipient ${this.sanitizePhone(testRecipient)} instead of sender ${this.sanitizePhone(context.sender.phoneNumber)}`,
        );
      }

      const sendResult = await this.whatsappService.sendTextMessage(recipient, hermesResponse.response);

      if (sendResult.success) {
        this.logger.log(`Successfully sent reply to ${this.sanitizePhone(recipient)}`);
      } else {
        this.logger.error(`Failed to send reply: ${sendResult.error}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : '';
      this.logger.error(`Processing failed: ${errorMessage}`);
      if (errorStack) {
        this.logger.error(`Stack trace: ${errorStack}`);
      }
    }
  }

  private sanitizePhone(phone: string): string {
    if (phone.length <= 4) return phone;
    return `***${phone.slice(-4)}`;
  }
}

function summarizePayload(payload: unknown): { object: string; entries: number } {
  if (!payload || typeof payload !== 'object') return { object: 'unknown', entries: 0 };
  const record = payload as Record<string, unknown>;
  return {
    object: typeof record.object === 'string' ? record.object : 'unknown',
    entries: Array.isArray(record.entry) ? record.entry.length : 0,
  };
}
