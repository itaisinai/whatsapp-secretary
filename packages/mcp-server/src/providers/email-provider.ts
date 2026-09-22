import type { SearchEmailsParams, SearchEmailsResult } from '@whatsapp-secretary/shared';

export interface EmailProviderConfig {
  email: string;
  password: string;
}

export abstract class EmailProvider {
  protected config: EmailProviderConfig;

  constructor(config: EmailProviderConfig) {
    this.config = config;
  }

  abstract initialize(): Promise<void>;
  abstract searchEmails(params: SearchEmailsParams): Promise<SearchEmailsResult>;
  abstract disconnect(): Promise<void>;

  protected validateConfig(): void {
    if (!this.config.email || !this.config.password) {
      throw new Error('Email and password are required');
    }
  }
}
