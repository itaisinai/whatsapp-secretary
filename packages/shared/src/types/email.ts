export interface EmailMessage {
  id: string;
  threadId: string;
  sender: {
    name?: string;
    email: string;
  };
  subject: string;
  snippet: string;
  receivedAt: Date;
  isUnread: boolean;
  sourceUrl?: string;
}

export interface SearchEmailsParams {
  sender?: string;
  text?: string;
  receivedAfter?: Date;
  receivedBefore?: Date;
  unreadOnly?: boolean;
  limit?: number;
}

export interface SearchEmailsResult {
  emails: EmailMessage[];
  total: number;
  hasMore: boolean;
}

export const DEFAULT_EMAIL_LIMIT = 10;
export const MAX_EMAIL_LIMIT = 50;
