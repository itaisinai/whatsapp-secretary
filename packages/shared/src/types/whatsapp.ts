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

    const entry = webhook.entry[0];
    if (!Array.isArray(entry.changes) || entry.changes.length === 0) {
      return {
        isValid: true,
        shouldProcess: false,
        error: 'No changes in entry',
      };
    }

    const change = entry.changes[0];
    const value = change.value;

    if (!value.messages || value.messages.length === 0) {
      return {
        isValid: true,
        shouldProcess: false,
        error: 'No messages in webhook (likely a status update)',
      };
    }

    const message = value.messages[0];

    if (message.type !== 'text') {
      return {
        isValid: true,
        shouldProcess: false,
        error: `Unsupported message type: ${message.type}`,
      };
    }

    if (!message.text?.body) {
      return {
        isValid: true,
        shouldProcess: false,
        error: 'Text message has no body',
      };
    }

    const contact = value.contacts?.[0];

    const context: WhatsAppMessageContext = {
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
    };

    return {
      isValid: true,
      shouldProcess: true,
      context,
    };
  } catch (error) {
    return {
      isValid: false,
      shouldProcess: false,
      error: error instanceof Error ? error.message : 'Unknown parsing error',
    };
  }
}
