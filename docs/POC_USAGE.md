
# POC Usage Guide

This guide explains how to use the WhatsApp Secretary POC with Hermes Agent.

## Prerequisites

Before starting, make sure you have completed the setup in [POC_SETUP.md](./POC_SETUP.md):

- ✅ Hermes Agent installed
- ✅ Email account with app password
- ✅ Environment variables configured
- ✅ Dependencies installed (`pnpm install`)

## Quick Start

### 1. Setup Hermes Integration

Run the setup script to configure Hermes with our MCP server:

```bash
./scripts/setup-hermes.sh
```

This script will:
- Build the MCP server
- Configure Hermes to use the WhatsApp Secretary MCP server
- Set up environment variables

### 2. Start Hermes

```bash
hermes
```

### 3. Test Email Search

Try these Hebrew queries:

```
תראה לי את חמשת המיילים האחרונים
```
(Show me the last 5 emails)

```
אילו מיילים עדיין לא קראתי?
```
(Which emails haven't I read yet?)

```
מה המיילים האחרונים שקיבלתי מיוסי?
```
(What are the recent emails I received from Yossi?)

```
תמצא מיילים מהשבוע האחרון בנושא פרויקט
```
(Find emails from the last week about project)

```
מתוך התוצאות, מה נראה שדורש ממני פעולה?
```
(From the results, what seems to require action from me?)

## How It Works

### Architecture Flow

```
You (Hebrew Query)
  ↓
Hermes Agent (LLM decides to use search_emails tool)
  ↓
WhatsApp Secretary MCP Server (stdio communication)
  ↓
Gmail/Outlook Provider (IMAP)
  ↓
Your Email Account (read-only access)
  ↓
Results with source links
  ↓
Hermes formats response in Hebrew
  ↓
You see the answer
```

### Tool: search_emails

Our MCP server exposes one tool to Hermes:

**Tool Name:** `search_emails`

**Parameters:**
- `sender` (optional): Filter by sender name or email
- `text` (optional): Search in subject or body  
- `receivedAfter` (optional): ISO date string, e.g. "2024-01-01T00:00:00Z"
- `receivedBefore` (optional): ISO date string
- `unreadOnly` (optional): boolean, default false
- `limit` (optional): number, default 10, max 50

**Returns:**
```json
{
  "success": true,
  "data": {
    "emails": [
      {
        "id": "gmail-123",
        "threadId": "thread-456",
        "sender": {
          "name": "John Doe",
          "email": "john@example.com"
        },
        "subject": "Project Update",
        "snippet": "Here's the latest status...",
        "receivedAt": "2024-01-15T10:30:00Z",
        "isUnread": true,
        "sourceUrl": "https://mail.google.com/mail/u/0/#inbox/123"
      }
    ],
    "total": 15,
    "hasMore": true
  },
  "summary": "Found 15 email(s). Showing 10 result(s)."
}
```

## Example Interactions

### Example 1: Recent Emails

**You:** `תראה לי את שלושת המיילים האחרונים`

**Hermes:** Calls `search_emails` with `{limit: 3}`

**Response:** Shows 3 most recent emails with sender, subject, snippet, and links

### Example 2: Unread Emails

**You:** `אילו מיילים לא קראתי?`

**Hermes:** Calls `search_emails` with `{unreadOnly: true}`

**Response:** Lists all unread emails

### Example 3: Search by Sender

**You:** `תראה לי מיילים מדני`

**Hermes:** Calls `search_emails` with `{sender: "דני"}`

**Response:** Shows emails from senders matching "דני" (Danny)

### Example 4: Search by Text

**You:** `חפש מיילים על תקציב`

**Hermes:** Calls `search_emails` with `{text: "תקציב"}`

**Response:** Shows emails with "תקציב" (budget) in subject or body

### Example 5: Date Range

**You:** `מיילים מהשבוע האחרון`

**Hermes:** Calls `search_emails` with `{receivedAfter: "2024-01-08T00:00:00Z"}`

**Response:** Shows emails from the past 7 days

## Hermes Commands

While chatting with Hermes, you can use these commands:

- `/new` - Start a fresh conversation
- `/model [provider:model]` - Change the LLM model
- `/retry` - Retry the last query
- `/undo` - Undo the last turn
- `/usage` - Check token usage
- `/help` - Show all commands

## Testing the Tool Directly

You can test the MCP server directly without Hermes:

```bash
cd packages/mcp-server
pnpm mcp
```

Then send MCP protocol messages via stdin. Example:

```json
{"jsonrpc":"2.0","id":1,"method":"tools/list"}
```

```json
{
  "jsonrpc":"2.0",
  "id":2,
  "method":"tools/call",
  "params":{
    "name":"search_emails",
    "arguments":{"limit":5}
  }
}
```

Press Ctrl+D to close stdin and see the response.

## Troubleshooting

### Hermes doesn't see the tool

1. Check Hermes config:
   ```bash
   cat ~/.hermes/config.yaml | grep -A 10 whatsapp_secretary
   ```

2. Restart Hermes:
   ```bash
   hermes
   ```

3. Check if MCP server is registered:
   Send a message and look for tool calls in the output

### Email connection fails

1. Verify credentials in `.env`:
   ```bash
   grep EMAIL .env
   ```

2. Test IMAP connection manually (Gmail example):
   ```bash
   openssl s_client -connect imap.gmail.com:993 -crlf
   # Should show SSL connection
   ```

3. Check you're using an **App Password**, not your regular password

4. For Gmail: Make sure IMAP is enabled in Settings → Forwarding and POP/IMAP

### Hermes can't find the tool

Make sure the MCP server is built:
```bash
pnpm build --filter @whatsapp-secretary/mcp-server
```

Check the path in `~/.hermes/config.yaml` points to the correct location.

### Hebrew queries don't work

1. Make sure you're using a good LLM model:
   ```bash
   hermes model
   # Select GPT-4, Claude Opus, or similar
   ```

2. Hebrew is fully supported by modern LLMs - the issue is likely elsewhere

### Tool returns no results

1. Check your email account actually has emails
2. Try a broader query (no filters)
3. Check the date range isn't excluding everything
4. Look at the MCP server logs (stderr) for errors

## Performance Notes

- **First query**: May take 5-10 seconds (IMAP connection + email fetch)
- **Subsequent queries**: Should be faster (connection reused)
- **Large mailboxes**: Searching might be slow, use filters

## Security Reminders

- ✅ Read-only access (no write operations)
- ✅ App passwords (not your main password)
- ✅ Environment variables (not committed to git)
- ✅ Local execution (no cloud service has your password)

## Next Steps

After the POC is successful:

1. **Phase 2**: Replace CLI with WhatsApp integration
2. **Phase 3**: Add more tools (Monday, Drive, Connecteam)
3. **Phase 4**: Add write operations with approval workflows

## Support

For issues:
1. Check this documentation
2. Check `docs/POC_SETUP.md`
3. Check Hermes Agent docs: https://hermes-agent.nousresearch.com/docs/
4. Review `PROJECT_STATUS.md` for known limitations
