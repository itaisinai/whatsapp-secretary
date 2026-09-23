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

@Controller('webhooks/whatsapp')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}

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
    return { status: 'ok' };
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
