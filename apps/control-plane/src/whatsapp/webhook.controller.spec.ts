import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ForbiddenException, RawBodyRequest, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { createMetaSignature } from './meta-signature';
import { WebhookController } from './webhook.controller';

function createController(): WebhookController {
  const config = new ConfigService({
    WHATSAPP_WEBHOOK_VERIFY_TOKEN: 'verify-token',
    WHATSAPP_APP_SECRET: 'app-secret',
    WHATSAPP_PHONE_NUMBER_ID: '123456789',
    WHATSAPP_ACCESS_TOKEN: 'test-token',
    WHATSAPP_TEST_RECIPIENT: '972541234567',
    MCP_SERVER_PATH: '/path/to/mcp.js',
  });
  const whatsappService = {} as never;
  const hermesService = {} as never;
  return new WebhookController(config, whatsappService, hermesService);
}

describe('WebhookController', () => {
  it('returns the challenge for a valid verification request', () => {
    assert.equal(createController().verify('subscribe', 'verify-token', '12345'), '12345');
  });

  it('rejects an invalid verification token', () => {
    assert.throws(
      () => createController().verify('subscribe', 'wrong-token', '12345'),
      ForbiddenException,
    );
  });

  it('accepts a signed POST payload', () => {
    const rawBody = Buffer.from('{"object":"whatsapp_business_account","entry":[]}');
    const request = { rawBody } as RawBodyRequest<Request>;
    const signature = createMetaSignature(rawBody, 'app-secret');
    assert.deepEqual(createController().receive(request, signature, JSON.parse(rawBody.toString())), {
      status: 'ok',
    });
  });

  it('rejects an unsigned POST payload', () => {
    const request = { rawBody: Buffer.from('{}') } as RawBodyRequest<Request>;
    assert.throws(() => createController().receive(request, undefined, {}), UnauthorizedException);
  });
});
