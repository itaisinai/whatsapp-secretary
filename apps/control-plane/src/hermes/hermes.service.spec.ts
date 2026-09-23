import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ConfigService } from '@nestjs/config';
import { HermesService } from './hermes.service';
import type { WhatsAppMessageContext } from '@whatsapp-secretary/shared';

function createService(config: Record<string, unknown> = {}): HermesService {
  const defaultConfig = {
    MCP_SERVER_PATH: '/path/to/mcp-server.js',
    EMAIL_PROVIDER: 'mock',
    HERMES_SESSION_ID: 'test-session',
    ...config,
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
    const service = createService({ HERMES_SESSION_ID: 'poc-session' });
    const context = createMockContext();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sessionId = (service as any).getSessionId(context);
    assert.equal(sessionId, 'whatsapp-972541234567');
  });

  it('uses configured session ID when not default', () => {
    const service = createService({ HERMES_SESSION_ID: 'custom-session' });
    const context = createMockContext();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sessionId = (service as any).getSessionId(context);
    assert.equal(sessionId, 'custom-session');
  });

  it('returns error response when MCP_SERVER_PATH is missing', async () => {
    const service = createService({ MCP_SERVER_PATH: undefined });
    const context = createMockContext();

    const result = await service.processMessage('Test message', context);

    assert.equal(result.error?.includes('MCP_SERVER_PATH'), true);
    assert.match(result.response, /מצטער/);
  });

  it('handles empty Hermes response', async () => {
    const service = createService();
    const context = createMockContext();

    const result = await service.processMessage('', context);

    assert.ok(result.response);
    assert.match(result.response, /מצטער|שגיאה/);
  });
});
