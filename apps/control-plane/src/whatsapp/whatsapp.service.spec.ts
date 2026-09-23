import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import { ConfigService } from '@nestjs/config';
import { WhatsAppService } from './whatsapp.service';

function createService(config: Record<string, unknown> = {}): WhatsAppService {
  const defaultConfig = {
    WHATSAPP_PHONE_NUMBER_ID: '123456789',
    WHATSAPP_ACCESS_TOKEN: 'test-token',
    WHATSAPP_GRAPH_API_VERSION: 'v26.0',
    ...config,
  };
  return new WhatsAppService(new ConfigService(defaultConfig));
}

describe('WhatsAppService', () => {
  it('sends a text message successfully', async () => {
    const service = createService();

    const mockFetch = mock.fn(async () => ({
      ok: true,
      json: async () => ({ messages: [{ id: 'wamid.sent123' }] }),
    }));
    global.fetch = mockFetch as never;

    const result = await service.sendTextMessage('972541234567', 'Test message');

    assert.equal(result.success, true);
    assert.equal(result.messageId, 'wamid.sent123');
    assert.equal(mockFetch.mock.callCount(), 1);
  });

  it('handles API errors gracefully', async () => {
    const service = createService();

    const mockFetch = mock.fn(async () => ({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: async () => JSON.stringify({ error: { message: 'Invalid phone number' } }),
    }));
    global.fetch = mockFetch as never;

    const result = await service.sendTextMessage('invalid', 'Test');

    assert.equal(result.success, false);
    assert.match(result.error || '', /400/);
  });

  it('splits long messages into chunks', async () => {
    const service = createService();

    const longText = 'A'.repeat(5000);

    const mockFetch = mock.fn(async () => ({
      ok: true,
      json: async () => ({ messages: [{ id: 'wamid.chunk' }] }),
    }));
    global.fetch = mockFetch as never;

    await service.sendTextMessage('972541234567', longText);

    assert.ok(mockFetch.mock.callCount() >= 2);
  });

  it('uses correct Graph API URL and headers', async () => {
    const service = createService();

    const mockFetch = mock.fn(async (_url: string, options?: RequestInit) => {
      assert.equal(_url, 'https://graph.facebook.com/v26.0/123456789/messages');
      assert.equal(options?.method, 'POST');
      const headers = options?.headers as Record<string, string>;
      assert.match(headers?.['Authorization'] || '', /Bearer test-token/);
      return {
        ok: true,
        json: async () => ({ messages: [{ id: 'wamid.ok' }] }),
      };
    });
    global.fetch = mockFetch as never;

    await service.sendTextMessage('972541234567', 'Test');
    assert.equal(mockFetch.mock.callCount(), 1);
  });

  it('does not log full access token in errors', async () => {
    const service = createService();

    const mockFetch = mock.fn(async () => ({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: async () => 'Unauthorized',
    }));
    global.fetch = mockFetch as never;

    const result = await service.sendTextMessage('972541234567', 'Test');

    assert.equal(result.success, false);
    assert.doesNotMatch(result.error || '', /test-token/);
  });
});
