export interface WhatsAppWebhookPayload {
  object: string;
  entry: WhatsAppWebhookEntry[];
}

export interface WhatsAppWebhookEntry {
  id: string;
  changes: WhatsAppWebhookChange[];
}

export interface WhatsAppWebhookChange {
  value: WhatsAppWebhookValue;
  field: string;
}

export interface WhatsAppWebhookValue {
  messaging_product: string;
  metadata: WhatsAppMetadata;
  contacts?: WhatsAppContact[];
  messages?: WhatsAppMessage[];
  statuses?: WhatsAppStatus[];
}

export interface WhatsAppMetadata {
  display_phone_number: string;
  phone_number_id: string;
}

export interface WhatsAppContact {
  profile: {
    name: string;
  };
  wa_id: string;
}

export interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contacts' | 'interactive';
  text?: {
    body: string;
  };
  image?: {
    id: string;
    mime_type: string;
    sha256: string;
  };
  context?: {
    from: string;
    id: string;
  };
}

export interface WhatsAppStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
}

export interface WhatsAppMessageContext {
  channel: 'whatsapp';
  webhook: {
    object: string;
    wabaId: string;
    field: string;
  };
  recipient: {
    displayPhoneNumber?: string;
    payloadPhoneNumberId?: string;
  };
  sender: {
    waId?: string;
    phoneNumber: string;
    profileName?: string;
  };
  message: {
    id: string;
    timestamp: string;
    type: string;
    text: string;
  };
}

export interface ParsedWhatsAppMessage {
  isValid: boolean;
  shouldProcess: boolean;
  context?: WhatsAppMessageContext;
  contexts?: WhatsAppMessageContext[]; // All message contexts in the webhook batch
  error?: string;
}

export function parseWhatsAppWebhook(payload: unknown): ParsedWhatsAppMessage {
  try {
    if (!payload || typeof payload !== 'object') {
      return {
        isValid: false,
        shouldProcess: false,
        error: 'Invalid payload: not an object',
      };
    }

    const webhook = payload as WhatsAppWebhookPayload;

    if (webhook.object !== 'whatsapp_business_account') {
      return {
        isValid: true,
        shouldProcess: false,
        error: `Unexpected webhook object: ${webhook.object}`,
      };
    }

    if (!Array.isArray(webhook.entry) || webhook.entry.length === 0) {
      return {
        isValid: true,
        shouldProcess: false,
        error: 'No entries in webhook',
      };
    }

    // Process all entries, changes, and messages (not just the first)
    const allContexts: WhatsAppMessageContext[] = [];

    for (const entry of webhook.entry) {
      if (!Array.isArray(entry.changes) || entry.changes.length === 0) {
        continue;
      }

      for (const change of entry.changes) {
        const value = change.value;

        if (!value.messages || value.messages.length === 0) {
          continue; // Skip status updates
        }

        // Process all messages in this change
        for (const message of value.messages) {
          if (message.type !== 'text' || !message.text?.body) {
            continue; // Skip non-text messages
          }

          const contact = value.contacts?.[0];

          allContexts.push({
            channel: 'whatsapp',
            webhook: {
              object: webhook.object,
              wabaId: entry.id,
              field: change.field,
            },
            recipient: {
              displayPhoneNumber: value.metadata.display_phone_number,
              payloadPhoneNumberId: value.metadata.phone_number_id,
            },
            sender: {
              waId: contact?.wa_id,
              phoneNumber: message.from,
              profileName: contact?.profile?.name,
            },
            message: {
              id: message.id,
              timestamp: message.timestamp,
              type: message.type,
              text: message.text.body,
            },
          });
        }
      }
    }

    if (allContexts.length === 0) {
      return {
        isValid: true,
        shouldProcess: false,
        error: 'No processable text messages in webhook',
      };
    }

    return {
      isValid: true,
      shouldProcess: true,
      context: allContexts[0], // For backward compatibility
      contexts: allContexts,
    };
  } catch (error) {
    return {
      isValid: false,
      shouldProcess: false,
      error: error instanceof Error ? error.message : 'Unknown parsing error',
    };
  }
}
