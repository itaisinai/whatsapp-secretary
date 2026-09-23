import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ConfigService } from '@nestjs/config';
import { HermesService } from './hermes.service';
import type { WhatsAppMessageContext } from '@whatsapp-secretary/shared';

function createService(config: Record<string, unknown> = {}): HermesService {
  // Use namespaced config structure to match runtime
  const defaultConfig = {
    hermes: {
      openaiApiKey: 'sk-test-key',
      sessionId: 'test-session',
      mcpServerPath: '/path/to/mcp-server.js',
      ...config,
    },
  };
  return new HermesService(new ConfigService(defaultConfig));
}

function createMockContext(): WhatsAppMessageContext {
  return {
    channel: 'whatsapp',
    webhook: {
      object: 'whatsapp_business_account',
      wabaId: '123',
      field: 'messages',
    },
    recipient: {
      displayPhoneNumber: '+15551234567',
      payloadPhoneNumberId: '987654321',
    },
    sender: {
      waId: '972541234567',
      phoneNumber: '972541234567',
      profileName: 'Test User',
    },
    message: {
      id: 'wamid.test123',
      timestamp: '1234567890',
      type: 'text',
      text: 'Hello',
    },
  };
}

describe('HermesService', () => {
  it('derives session ID from phone number', () => {
    const service = createService({ sessionId: 'poc-session' });
    const context = createMockContext();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sessionId = (service as any).getSessionId(context);
    assert.equal(sessionId, 'whatsapp-972541234567');
  });

  it('uses configured session ID when not default', () => {
    const service = createService({ sessionId: 'custom-session' });
    const context = createMockContext();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sessionId = (service as any).getSessionId(context);
    assert.equal(sessionId, 'custom-session');
  });

  it('handles empty message input', async () => {
    const service = createService();
    const context = createMockContext();

    const result = await service.processMessage('', context);

    // Should either return error or Hermes banner/response
    assert.ok(result.response);
    assert.ok(result.response.length > 0);
  });
});
