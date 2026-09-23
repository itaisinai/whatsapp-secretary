import Imap from 'imap';
import { simpleParser } from 'mailparser';
import {
  SearchEmailsParams,
  SearchEmailsResult,
  EmailMessage,
  DEFAULT_EMAIL_LIMIT,
  MAX_EMAIL_LIMIT,
  validateLimit,
} from '@whatsapp-secretary/shared';
import { EmailProvider, EmailProviderConfig } from './email-provider';

export class OutlookProvider extends EmailProvider {
  private imap: Imap | null = null;

  constructor(config: EmailProviderConfig) {
    super(config);
  }

  async initialize(): Promise<void> {
    this.validateConfig();
    console.error(`Initializing Outlook provider for: ${this.config.email}`);

    this.imap = new Imap({
      user: this.config.email,
      password: this.config.password,
      host: 'outlook.office365.com',
      port: 993,
      tls: true,
    });

    return new Promise((resolve, reject) => {
      if (!this.imap) {
        reject(new Error('IMAP not initialized'));
        return;
      }

      this.imap.once('ready', () => {
        console.error('[Outlook] Connected successfully');
        resolve();
      });

      this.imap.once('error', (err: Error) => {
        console.error('[Outlook] Connection error:', err);
        reject(err);
      });

      this.imap.connect();
    });
  }

  async searchEmails(params: SearchEmailsParams): Promise<SearchEmailsResult> {
    const limit = validateLimit(params.limit, DEFAULT_EMAIL_LIMIT, MAX_EMAIL_LIMIT);

    if (!this.imap) {
      throw new Error('IMAP not initialized');
    }

    return new Promise((resolve, reject) => {
      if (!this.imap) {
        reject(new Error('IMAP not initialized'));
        return;
      }

      this.imap.openBox('INBOX', true, async (err, box) => {
        if (err) {
          reject(err);
          return;
        }

        try {
          const searchCriteria = this.buildSearchCriteria(params);

          this.imap!.search(searchCriteria, async (err, uids) => {
            if (err) {
              reject(err);
              return;
            }

            if (uids.length === 0) {
              resolve({
                emails: [],
                total: 0,
                hasMore: false,
              });
              return;
            }

            const sortedUids = uids.sort((a, b) => b - a);
            const limitedUids = sortedUids.slice(0, limit);
            const hasMore = sortedUids.length > limit;

            const emails = await this.fetchEmails(limitedUids);

            resolve({
              emails,
              total: uids.length,
              hasMore,
            });
          });
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  private buildSearchCriteria(params: SearchEmailsParams): any[] {
    const criteria: any[] = ['ALL'];

    if (params.unreadOnly) {
      criteria.push('UNSEEN');
    }

    if (params.sender) {
      criteria.push(['FROM', params.sender]);
    }

    if (params.text) {
      criteria.push(['OR', ['SUBJECT', params.text], ['BODY', params.text]]);
    }

    if (params.receivedAfter) {
      const dateStr = params.receivedAfter.toISOString().split('T')[0];
      criteria.push(['SINCE', dateStr]);
    }

    if (params.receivedBefore) {
      const dateStr = params.receivedBefore.toISOString().split('T')[0];
      criteria.push(['BEFORE', dateStr]);
    }

    return criteria;
  }

  private async fetchEmails(uids: number[]): Promise<EmailMessage[]> {
    return new Promise((resolve, reject) => {
      if (!this.imap) {
        reject(new Error('IMAP not initialized'));
        return;
      }

      const emails: EmailMessage[] = [];
      const parsingPromises: Promise<void>[] = [];

      const fetch = this.imap.fetch(uids, {
        bodies: '',
        struct: true,
      });

      fetch.on('message', (msg, seqno) => {
        let buffer = '';

        msg.on('body', (stream) => {
          stream.on('data', (chunk) => {
            buffer += chunk.toString('utf8');
          });
        });

        msg.once('end', () => {
          // Create a promise for this message's parsing
          const parsingPromise = simpleParser(buffer)
            .then((parsed) => {
              emails.push({
                id: `outlook-${seqno}`,
                threadId: parsed.messageId || `thread-${seqno}`,
                sender: {
                  name: parsed.from?.value[0]?.name,
                  email: parsed.from?.value[0]?.address || 'unknown',
                },
                subject: parsed.subject || '(No Subject)',
                snippet: parsed.text?.substring(0, 200) || '',
                receivedAt: parsed.date || new Date(),
                isUnread: true,
                sourceUrl: `https://outlook.office365.com/mail/inbox/id/${seqno}`,
              });
            })
            .catch((error) => {
              console.error(`[Outlook] Error parsing message ${seqno}:`, error);
            });

          parsingPromises.push(parsingPromise);
        });
      });

      fetch.once('error', reject);

      fetch.once('end', async () => {
        // Wait for all parsing to complete
        await Promise.all(parsingPromises);

        emails.sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime());
        resolve(emails);
      });
    });
  }

  async disconnect(): Promise<void> {
    if (this.imap) {
      this.imap.end();
      console.error('[Outlook] Disconnected');
    }
  }
}
