import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { validateEnvironment } from './environment';

describe('validateEnvironment', () => {
  it('accepts the required WhatsApp secrets', () => {
    const result = validateEnvironment({
      WHATSAPP_WEBHOOK_VERIFY_TOKEN: 'verify-token',
      WHATSAPP_APP_SECRET: 'app-secret',
      WHATSAPP_PHONE_NUMBER_ID: '123456789',
      WHATSAPP_ACCESS_TOKEN: 'test-token',
    });
    assert.equal(result.PORT, 3000);
  });

  it('rejects missing secrets', () => {
    assert.throws(() => validateEnvironment({}), /WHATSAPP_WEBHOOK_VERIFY_TOKEN/);
  });
});
