import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseWhatsAppWebhook } from './whatsapp';

describe('parseWhatsAppWebhook', () => {
  const validTextMessage = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: '123456789',
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '+15551234567',
                phone_number_id: '987654321',
              },
              contacts: [
                {
                  profile: {
                    name: 'Test User',
                  },
                  wa_id: '972541234567',
                },
              ],
              messages: [
                {
                  from: '972541234567',
                  id: 'wamid.abc123',
                  timestamp: '1234567890',
                  type: 'text',
                  text: {
                    body: 'Hello world',
                  },
                },
              ],
            },
            field: 'messages',
          },
        ],
      },
    ],
  };

  it('parses a valid text message', () => {
    const result = parseWhatsAppWebhook(validTextMessage);
    assert.equal(result.isValid, true);
    assert.equal(result.shouldProcess, true);
    assert.equal(result.context?.message.text, 'Hello world');
    assert.equal(result.context?.sender.phoneNumber, '972541234567');
    assert.equal(result.context?.sender.profileName, 'Test User');
    assert.equal(result.context?.message.id, 'wamid.abc123');
  });

  it('handles Meta test webhook with fake sender', () => {
    const testPayload = {
      ...validTextMessage,
      entry: [
        {
          ...validTextMessage.entry[0],
          changes: [
            {
              ...validTextMessage.entry[0].changes[0],
              value: {
                ...validTextMessage.entry[0].changes[0].value,
                contacts: [
                  {
                    profile: { name: 'Test Sender' },
                    wa_id: '16315551234',
                  },
                ],
                messages: [
                  {
                    from: '16315551234',
                    id: 'wamid.fake123',
                    timestamp: '1234567890',
                    type: 'text',
                    text: { body: 'Test message' },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const result = parseWhatsAppWebhook(testPayload);
    assert.equal(result.isValid, true);
    assert.equal(result.shouldProcess, true);
    assert.equal(result.context?.sender.phoneNumber, '16315551234');
  });

  it('rejects non-object payload', () => {
    const result = parseWhatsAppWebhook(null);
    assert.equal(result.isValid, false);
    assert.equal(result.shouldProcess, false);
  });

  it('skips status-only webhook', () => {
    const statusWebhook = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: '123',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '+15551234567',
                  phone_number_id: '987654321',
                },
                statuses: [
                  {
                    id: 'wamid.status123',
                    status: 'delivered',
                    timestamp: '1234567890',
                    recipient_id: '972541234567',
                  },
                ],
              },
              field: 'messages',
            },
          ],
        },
      ],
    };

    const result = parseWhatsAppWebhook(statusWebhook);
    assert.equal(result.isValid, true);
    assert.equal(result.shouldProcess, false);
    assert.match(result.error || '', /no messages/i);
  });

  it('skips unsupported message type', () => {
    const imageMessage = {
      ...validTextMessage,
      entry: [
        {
          ...validTextMessage.entry[0],
          changes: [
            {
              ...validTextMessage.entry[0].changes[0],
              value: {
                ...validTextMessage.entry[0].changes[0].value,
                messages: [
                  {
                    from: '972541234567',
                    id: 'wamid.img123',
                    timestamp: '1234567890',
                    type: 'image',
                    image: {
                      id: 'img123',
                      mime_type: 'image/jpeg',
                      sha256: 'abc',
                    },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const result = parseWhatsAppWebhook(imageMessage);
    assert.equal(result.isValid, true);
    assert.equal(result.shouldProcess, false);
    assert.match(result.error || '', /unsupported message type/i);
  });

  it('handles missing contacts gracefully', () => {
    const noContactsPayload = {
      ...validTextMessage,
      entry: [
        {
          ...validTextMessage.entry[0],
          changes: [
            {
              ...validTextMessage.entry[0].changes[0],
              value: {
                ...validTextMessage.entry[0].changes[0].value,
                contacts: undefined,
              },
            },
          ],
        },
      ],
    };

    const result = parseWhatsAppWebhook(noContactsPayload);
    assert.equal(result.isValid, true);
    assert.equal(result.shouldProcess, true);
    assert.equal(result.context?.sender.profileName, undefined);
    assert.equal(result.context?.sender.waId, undefined);
  });

  it('extracts all context fields correctly', () => {
    const result = parseWhatsAppWebhook(validTextMessage);
    assert.equal(result.context?.channel, 'whatsapp');
    assert.equal(result.context?.webhook.object, 'whatsapp_business_account');
    assert.equal(result.context?.webhook.wabaId, '123456789');
    assert.equal(result.context?.webhook.field, 'messages');
    assert.equal(result.context?.recipient.displayPhoneNumber, '+15551234567');
    assert.equal(result.context?.recipient.payloadPhoneNumberId, '987654321');
    assert.equal(result.context?.message.timestamp, '1234567890');
    assert.equal(result.context?.message.type, 'text');
  });
});
