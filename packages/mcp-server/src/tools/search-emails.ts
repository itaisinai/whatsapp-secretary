import type { ToolDefinition } from '@whatsapp-secretary/shared';

export const searchEmailsTool: ToolDefinition = {
  name: 'search_emails',
  description:
    'Search and retrieve emails with advanced filtering. ' +
    'Supports filtering by sender, text search in subject/content, date range, unread status, and result limit. ' +
    'Returns email metadata including ID, thread ID, sender, subject, date, unread status, snippet, and source URL.',
  parameters: {
    sender: {
      type: 'string',
      description:
        'Filter by sender name or email address. Partial matches are supported. Example: "John" or "john@example.com"',
    },
    text: {
      type: 'string',
      description:
        'Search for text in email subject or content. Example: "project update" or "invoice"',
    },
    receivedAfter: {
      type: 'date',
      description:
        'Return only emails received after this date. ISO 8601 format. Example: "2024-01-01T00:00:00Z"',
    },
    receivedBefore: {
      type: 'date',
      description:
        'Return only emails received before this date. ISO 8601 format. Example: "2024-12-31T23:59:59Z"',
    },
    unreadOnly: {
      type: 'boolean',
      description: 'If true, return only unread emails. Default: false',
      default: false,
    },
    limit: {
      type: 'number',
      description: 'Maximum number of results to return. Default: 10, Maximum: 50',
      default: 10,
      minimum: 1,
      maximum: 50,
    },
  },
  required: [],
};
