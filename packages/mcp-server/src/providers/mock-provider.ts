import {
  SearchEmailsParams,
  SearchEmailsResult,
  EmailMessage,
  DEFAULT_EMAIL_LIMIT,
  MAX_EMAIL_LIMIT,
  validateLimit,
} from '@whatsapp-secretary/shared';
import { EmailProvider, EmailProviderConfig } from './email-provider';

/**
 * Mock email provider for testing without real email credentials.
 * Returns fake emails that match the search criteria.
 */
export class MockProvider extends EmailProvider {
  private mockEmails: EmailMessage[];

  constructor(config: EmailProviderConfig) {
    super(config);
    this.mockEmails = this.generateMockEmails();
  }

  private generateMockEmails(): EmailMessage[] {
    const now = new Date();
    const dayInMs = 24 * 60 * 60 * 1000;

    return [
      {
        id: 'mock-1',
        threadId: 'thread-1',
        sender: { name: 'יוסי כהן', email: 'yossi@example.com' },
        subject: 'עדכון פרויקט - דחוף',
        snippet: 'שלום, רציתי לעדכן אותך על הפרויקט החדש. יש לנו כמה נושאים שצריך לטפל בהם...',
        receivedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        isUnread: true,
        sourceUrl: 'https://mail.example.com/inbox/mock-1',
      },
      {
        id: 'mock-2',
        threadId: 'thread-2',
        sender: { name: 'דני לוי', email: 'danny@example.com' },
        subject: 'תקציב לרבעון הבא',
        snippet: 'היי, מצורף התקציב המוצע לרבעון הבא. נשמח לקבל הערות עד סוף השבוע...',
        receivedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000), // 5 hours ago
        isUnread: true,
        sourceUrl: 'https://mail.example.com/inbox/mock-2',
      },
      {
        id: 'mock-3',
        threadId: 'thread-3',
        sender: { name: 'Sarah Johnson', email: 'sarah@company.com' },
        subject: 'Meeting notes from yesterday',
        snippet: 'Here are the notes from yesterday\'s meeting. Action items are highlighted...',
        receivedAt: new Date(now.getTime() - dayInMs), // 1 day ago
        isUnread: false,
        sourceUrl: 'https://mail.example.com/inbox/mock-3',
      },
      {
        id: 'mock-4',
        threadId: 'thread-4',
        sender: { name: 'מיכל שמש', email: 'michal@example.co.il' },
        subject: 'הצעת מחיר חדשה',
        snippet: 'שלום רב, מצורפת הצעת המחיר שביקשת. תוקף ההצעה הוא 30 יום...',
        receivedAt: new Date(now.getTime() - 2 * dayInMs), // 2 days ago
        isUnread: false,
        sourceUrl: 'https://mail.example.com/inbox/mock-4',
      },
      {
        id: 'mock-5',
        threadId: 'thread-5',
        sender: { name: 'יוסי כהן', email: 'yossi@example.com' },
        subject: 'Re: עדכון פרויקט',
        snippet: 'תודה על העדכון. אני חושב שאנחנו בדרך הנכונה...',
        receivedAt: new Date(now.getTime() - 3 * dayInMs), // 3 days ago
        isUnread: false,
        sourceUrl: 'https://mail.example.com/inbox/mock-5',
      },
      {
        id: 'mock-6',
        threadId: 'thread-6',
        sender: { name: 'Newsletter', email: 'news@tech.com' },
        subject: 'Weekly Tech Updates',
        snippet: 'This week in tech: AI advances, new frameworks, and industry trends...',
        receivedAt: new Date(now.getTime() - 4 * dayInMs), // 4 days ago
        isUnread: true,
        sourceUrl: 'https://mail.example.com/inbox/mock-6',
      },
      {
        id: 'mock-7',
        threadId: 'thread-7',
        sender: { name: 'רועי אברהם', email: 'roey@startup.il' },
        subject: 'הזמנה למיטאפ',
        snippet: 'שלום! אנחנו מארגנים מיטאפ בנושא AI בשבוע הבא. נשמח אם תוכל להגיע...',
        receivedAt: new Date(now.getTime() - 5 * dayInMs), // 5 days ago
        isUnread: false,
        sourceUrl: 'https://mail.example.com/inbox/mock-7',
      },
      {
        id: 'mock-8',
        threadId: 'thread-8',
        sender: { name: 'דני לוי', email: 'danny@example.com' },
        subject: 'דוח סטטוס שבועי',
        snippet: 'הדוח השבועי מצורף. עיקרי הנקודות: השלמנו 80% מהמטרות...',
        receivedAt: new Date(now.getTime() - 7 * dayInMs), // 1 week ago
        isUnread: false,
        sourceUrl: 'https://mail.example.com/inbox/mock-8',
      },
    ];
  }

  async initialize(): Promise<void> {
    console.error(`[Mock Provider] Initialized with ${this.mockEmails.length} mock emails`);
    console.error('[Mock Provider] ⚠️  Using MOCK data - no real email connection');
  }

  async searchEmails(params: SearchEmailsParams): Promise<SearchEmailsResult> {
    const limit = validateLimit(params.limit, DEFAULT_EMAIL_LIMIT, MAX_EMAIL_LIMIT);

    let filteredEmails = [...this.mockEmails];

    // Filter by sender
    if (params.sender) {
      const searchTerm = params.sender.toLowerCase();
      filteredEmails = filteredEmails.filter(
        (email) =>
          email.sender.name?.toLowerCase().includes(searchTerm) ||
          email.sender.email.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by text (in subject or snippet)
    if (params.text) {
      const searchTerm = params.text.toLowerCase();
      filteredEmails = filteredEmails.filter(
        (email) =>
          email.subject.toLowerCase().includes(searchTerm) ||
          email.snippet.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by unread status
    if (params.unreadOnly) {
      filteredEmails = filteredEmails.filter((email) => email.isUnread);
    }

    // Filter by date range
    if (params.receivedAfter) {
      filteredEmails = filteredEmails.filter(
        (email) => email.receivedAt >= params.receivedAfter!
      );
    }

    if (params.receivedBefore) {
      filteredEmails = filteredEmails.filter(
        (email) => email.receivedAt <= params.receivedBefore!
      );
    }

    // Sort by date, most recent first
    filteredEmails.sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime());

    const total = filteredEmails.length;
    const emails = filteredEmails.slice(0, limit);
    const hasMore = total > limit;

    return {
      emails,
      total,
      hasMore,
    };
  }

  async disconnect(): Promise<void> {
    console.error('[Mock Provider] Disconnected');
  }
}
