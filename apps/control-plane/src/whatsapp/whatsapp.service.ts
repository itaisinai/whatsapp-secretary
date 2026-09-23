import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

const WHATSAPP_MAX_TEXT_LENGTH = 4096;

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(@Inject(ConfigService) private readonly config: ConfigService) {
    this.logger.log(`WhatsAppService initialized - config available: ${!!config}`);
  }

  async sendTextMessage(to: string, text: string): Promise<SendMessageResult> {
    const phoneNumberId = this.config.getOrThrow<string>('WHATSAPP_PHONE_NUMBER_ID');
    const accessToken = this.config.getOrThrow<string>('WHATSAPP_ACCESS_TOKEN');
    const apiVersion = this.config.get<string>('WHATSAPP_GRAPH_API_VERSION') || 'v26.0';

    const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

    const chunks = this.splitTextIntoChunks(text, WHATSAPP_MAX_TEXT_LENGTH);

    try {
      let lastMessageId: string | undefined;

      for (const chunk of chunks) {
        const payload = {
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: {
            body: chunk,
          },
        };

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          this.logger.error(
            `WhatsApp API error: ${response.status} ${response.statusText}. Body: ${this.sanitizeError(errorBody)}`,
          );
          throw new Error(`WhatsApp API returned ${response.status}: ${response.statusText}`);
        }

        const result = (await response.json()) as { messages?: Array<{ id: string }> };
        lastMessageId = result.messages?.[0]?.id;

        this.logger.log(`Sent WhatsApp message to ${this.sanitizePhoneNumber(to)}`);
      }

      return {
        success: true,
        messageId: lastMessageId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send WhatsApp message: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  private splitTextIntoChunks(text: string, maxLength: number): string[] {
    if (text.length <= maxLength) {
      return [text];
    }

    const chunks: string[] = [];
    let currentChunk = '';

    const lines = text.split('\n');

    for (const line of lines) {
      if ((currentChunk + line + '\n').length > maxLength) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }

        if (line.length > maxLength) {
          let remainingLine = line;
          while (remainingLine.length > maxLength) {
            chunks.push(remainingLine.slice(0, maxLength));
            remainingLine = remainingLine.slice(maxLength);
          }
          currentChunk = remainingLine + '\n';
        } else {
          currentChunk = line + '\n';
        }
      } else {
        currentChunk += line + '\n';
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  private sanitizePhoneNumber(phoneNumber: string): string {
    if (phoneNumber.length <= 4) return phoneNumber;
    return `***${phoneNumber.slice(-4)}`;
  }

  private sanitizeError(errorBody: string): string {
    try {
      const json = JSON.parse(errorBody);
      if (json.error) {
        return JSON.stringify({
          message: json.error.message,
          type: json.error.type,
          code: json.error.code,
        });
      }
      return errorBody.slice(0, 200);
    } catch {
      return errorBody.slice(0, 200);
    }
  }
}
