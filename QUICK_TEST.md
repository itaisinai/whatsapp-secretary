# Quick Test Guide - No Email Password Needed! 🎉

You can test the WhatsApp Secretary POC **without providing real email credentials** using the mock email provider.

## What's Included in Mock Mode

The mock provider includes **8 fake emails** with:
- ✅ Hebrew content (emails from יוסי, דני, מיכל, רועי)
- ✅ English content (for mixed scenarios)
- ✅ Various dates (2 hours ago to 1 week ago)
- ✅ Read/unread statuses
- ✅ Different subjects (פרויקט, תקציב, meetings, etc.)

## Setup (3 minutes)

### 1. Install Hermes Agent

```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
source ~/.bashrc  # or source ~/.zshrc
```

### 2. Setup the Project

The `.env` file is already configured for mock mode!

```bash
# Install dependencies (if not done)
pnpm install

# Run the setup script
./scripts/setup-hermes.sh
```

The setup script will:
- Build the MCP server
- Configure Hermes to use our tool
- Use mock data (no real email needed)

## Test It!

### Start Hermes:

```bash
hermes
```

### Try These Hebrew Queries:

**1. Show recent emails:**
```
תראה לי את חמשת המיילים האחרונים
```

Expected: Should show 5 most recent mock emails

---

**2. Show unread emails:**
```
אילו מיילים עדיין לא קראתי?
```

Expected: Should show 3 unread emails (from יוסי, דני, and Newsletter)

---

**3. Search by sender:**
```
מה המיילים מיוסי?
```

Expected: Should show 2 emails from יוסי כהן

---

**4. Search by text:**
```
תמצא מיילים בנושא פרויקט
```

Expected: Should show emails containing "פרויקט" in subject/body

---

**5. Search by text (English):**
```
תמצא מיילים על meeting
```

Expected: Should show the "Meeting notes" email

---

**6. Multiple filters:**
```
תראה לי מיילים שלא נקראו מדני
```

Expected: Should show 1 unread email from דני לוי (about תקציב)

---

**7. Date range:**
```
תראה לי מיילים מהשלושה ימים האחרונים
```

Expected: Should show recent emails (last 3 days)

---

## What to Verify

For each query, check:

✅ **Tool Selection:** Hermes chooses `mcp_whatsapp_secretary_search_emails`

✅ **Parameter Mapping:** Correct parameters sent (sender, text, unreadOnly, etc.)

✅ **Results:** Returns matching emails

✅ **Hebrew Understanding:** Hermes understands Hebrew queries correctly

✅ **Response Format:** Clean, formatted response in Hebrew

✅ **Source URLs:** Each email has a source link

✅ **No Hallucinations:** Only returns the mock emails, doesn't make up content

## Hermes Commands

While in Hermes:

- `/tools` - List available tools (should see our search_emails)
- `/new` - Start fresh conversation
- `/retry` - Retry last query
- `/usage` - Check token usage
- `/help` - Show all commands

## Expected Mock Emails

The mock provider has these 8 emails:

| From | Subject | Status | Age |
|------|---------|--------|-----|
| יוסי כהן | עדכון פרויקט - דחוף | Unread | 2 hrs |
| דני לוי | תקציב לרבעון הבא | Unread | 5 hrs |
| Sarah Johnson | Meeting notes from yesterday | Read | 1 day |
| מיכל שמש | הצעת מחיר חדשה | Read | 2 days |
| יוסי כהן | Re: עדכון פרויקט | Read | 3 days |
| Newsletter | Weekly Tech Updates | Unread | 4 days |
| רועי אברהם | הזמנה למיטאפ | Read | 5 days |
| דני לוי | דוח סטטוס שבועי | Read | 7 days |

## Troubleshooting

### "Tool not found"

Rerun the setup:
```bash
./scripts/setup-hermes.sh
```

### "Connection failed" or similar errors

Check that `.env` has:
```
EMAIL_PROVIDER=mock
```

### Hermes doesn't respond

Try:
```bash
hermes
/reload-mcp
```

Then try your query again.

### Want to see MCP server logs

In another terminal:
```bash
tail -f ~/.hermes/logs/mcp-*.log
```

## Test Standalone (Without Hermes)

You can also test the MCP server directly:

```bash
cd packages/mcp-server
pnpm mcp
```

Then send (via stdin):
```json
{"jsonrpc":"2.0","id":1,"method":"tools/list"}
```

Press Enter, then Ctrl+D to see the response.

## Next Steps After Testing

Once you verify everything works with mock data:

1. ✅ **Go Decision:** Hermes Agent works great as our runtime
2. 📊 **Document Results:** What worked, what didn't, performance
3. 🔄 **Real Email (Optional):** Add real credentials to test with your actual inbox
4. 📱 **Phase 2:** Move to WhatsApp integration

## Performance Expectations (Mock Mode)

- **Latency:** < 1 second (no network calls)
- **Cost:** Minimal (only LLM tokens for understanding + response)
- **Accuracy:** Should be 100% for tool selection

## Success Criteria

For POC to pass with mock data:

- ✅ Hermes understands Hebrew queries
- ✅ Correctly selects search_emails tool
- ✅ Maps natural language to parameters
- ✅ Returns structured results
- ✅ No hallucinated content
- ✅ Formats nice responses
- ✅ Handles edge cases (no results, etc.)

---

## Real Email Testing (Optional)

If you want to test with real email later:

1. Get an app password from Gmail/Outlook
2. Edit `.env`:
   ```bash
   EMAIL_PROVIDER=gmail  # or outlook
   EMAIL_ADDRESS=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password
   ```
3. Rerun setup: `./scripts/setup-hermes.sh`
4. Test with Hermes

But for now, **mock mode is perfect for validating the POC!** 🚀
