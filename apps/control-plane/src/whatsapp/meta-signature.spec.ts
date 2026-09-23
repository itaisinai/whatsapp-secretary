import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createMetaSignature, verifyMetaSignature } from './meta-signature';

describe('verifyMetaSignature', () => {
  const secret = 'app-secret';
  const body = Buffer.from('{"object":"whatsapp_business_account"}');

  it('accepts a valid signature', () => {
    assert.equal(verifyMetaSignature(body, createMetaSignature(body, secret), secret), true);
  });

  it('rejects a modified payload', () => {
    const signature = createMetaSignature(body, secret);
    assert.equal(verifyMetaSignature(Buffer.from('{}'), signature, secret), false);
  });
});
