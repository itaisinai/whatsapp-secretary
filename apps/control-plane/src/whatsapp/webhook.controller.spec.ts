import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ForbiddenException, RawBodyRequest, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { createMetaSignature } from './meta-signature';
import { WebhookController } from './webhook.controller';

function createController(): WebhookController {
  return new WebhookController(new ConfigService({
    WHATSAPP_WEBHOOK_VERIFY_TOKEN: 'verify-token',
    WHATSAPP_APP_SECRET: 'app-secret',
  }));
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
