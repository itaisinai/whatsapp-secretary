# Testing Guide - WhatsApp Secretary POC

This document provides test scenarios to validate the POC implementation.

## Test Environment Setup

Before running tests, ensure:

```bash
# 1. Dependencies installed
pnpm install

# 2. Environment configured
cp .env.example .env
# Edit .env with real credentials

# 3. Hermes installed
hermes --version

# 4. MCP server built
pnpm build --filter @whatsapp-secretary/mcp-server

# 5. Hermes configured
./scripts/setup-hermes.sh
```

## Test Scenarios

### Test 1: MCP Server Standalone

**Purpose:** Verify MCP server runs and responds to protocol messages

**Steps:**
```bash
cd packages/mcp-server
pnpm mcp
```

Send (via stdin):
```json
{"jsonrpc":"2.0","id":1,"method":"tools/list"}
```

**Expected Output:**
```json
{
  "jsonrpc":"2.0",
  "id":1,
  "result":{
    "tools":[
      {
        "name":"search_emails",
        "description":"Search and retrieve emails...",
        "inputSchema":{...}
      }
    ]
  }
}
```

**Pass Criteria:**
- ✅ Server starts without errors
- ✅ Responds with valid JSON-RPC
- ✅ Lists search_emails tool
- ✅ Tool schema is correct

---

### Test 2: Email Provider Connection

**Purpose:** Verify IMAP connection to email provider

**Steps:**
```bash
# Add to .env:
EMAIL_PROVIDER=gmail  # or outlook
EMAIL_ADDRESS=your_email@example.com
EMAIL_PASSWORD=your_app_password

# Start MCP server
cd packages/mcp-server
pnpm mcp
```

Check stderr for:
```
[MCP Server] Email provider initialized successfully
[Gmail] Connected successfully
```

**Pass Criteria:**
- ✅ Connection succeeds
- ✅ No authentication errors
- ✅ IMAP ready message appears

**Common Failures:**
- ❌ "Invalid credentials" → Check app password
- ❌ "IMAP not enabled" → Enable in email settings
- ❌ "Connection timeout" → Check firewall

---

### Test 3: Basic Email Search

**Purpose:** Test search_emails tool returns results

**Steps:**

Start MCP server and send:
```json
{
  "jsonrpc":"2.0",
  "id":2,
  "method":"tools/call",
  "params":{
    "name":"search_emails",
    "arguments":{"limit":3}
  }
}
```

**Expected Output:**
```json
{
  "jsonrpc":"2.0",
  "id":2,
  "result":{
    "content":[
      {
        "type":"text",
        "text":"{\"success\":true,\"data\":{\"emails\":[...],\"total\":X,\"hasMore\":false}}"
      }
    ]
  }
}
```

**Pass Criteria:**
- ✅ Returns success:true
- ✅ emails array has items
- ✅ Each email has: id, sender, subject, snippet, date, sourceUrl
- ✅ total count is accurate
- ✅ hasMore flag is correct

---

### Test 4: Hermes Integration

**Purpose:** Verify Hermes sees and can call our tool

**Steps:**
```bash
hermes

# In Hermes, send:
/tools
```

**Expected:** Should list `mcp_whatsapp_secretary_search_emails`

Then try:
```
Can you list the tools you have access to?
```

**Pass Criteria:**
- ✅ Tool is registered with Hermes
- ✅ Tool description is visible
- ✅ Hermes acknowledges it can search emails

---

### Test 5: Hebrew Query - Recent Emails

**Purpose:** Test Hebrew NLU and tool selection

**Query (Hebrew):**
```
תראה לי את שלושת המיילים האחרונים
```
(Show me the last 3 emails)

**Expected Behavior:**
1. Hermes understands the Hebrew query
2. Hermes selects search_emails tool
3. Hermes passes limit=3
4. Results are returned
5. Hermes formats response in Hebrew

**Pass Criteria:**
- ✅ Correct tool selected
- ✅ Correct parameters (limit: 3)
- ✅ Returns 3 emails
- ✅ Response includes sender, subject, date
- ✅ Response is in Hebrew
- ✅ No hallucinated content

---

### Test 6: Hebrew Query - Unread Emails

**Query (Hebrew):**
```
אילו מיילים עדיין לא קראתי?
```
(Which emails haven't I read yet?)

**Expected Tool Call:**
```json
{
  "name": "search_emails",
  "arguments": {
    "unreadOnly": true
  }
}
```

**Pass Criteria:**
- ✅ unreadOnly flag is set
- ✅ Only unread emails returned
- ✅ Count matches inbox unread count

---

### Test 7: Hebrew Query - Search by Sender

**Query (Hebrew):**
```
מה המיילים האחרונים שקיבלתי מיוסי?
```
(What are the recent emails I got from Yossi?)

**Expected Tool Call:**
```json
{
  "name": "search_emails",
  "arguments": {
    "sender": "יוסי"  // or transliterated "yossi"
  }
}
```

**Pass Criteria:**
- ✅ sender parameter is set
- ✅ Results filtered by sender
- ✅ Hebrew name handled correctly

---

### Test 8: Hebrew Query - Search by Text

**Query (Hebrew):**
```
תמצא מיילים מהשבוע האחרון בנושא פרויקט
```
(Find emails from the last week about project)

**Expected Tool Call:**
```json
{
  "name": "search_emails",
  "arguments": {
    "text": "פרויקט",  // or "project"
    "receivedAfter": "2024-01-15T00:00:00Z"  // 7 days ago
  }
}
```

**Pass Criteria:**
- ✅ text parameter includes search term
- ✅ receivedAfter is set to ~7 days ago
- ✅ Results match search criteria
- ✅ Hebrew search term works

---

### Test 9: Complex Query with Multiple Filters

**Query (Hebrew):**
```
תראה לי מיילים שלא נקראו מדני בשבוע האחרון
```
(Show me unread emails from Danny from the last week)

**Expected Tool Call:**
```json
{
  "name": "search_emails",
  "arguments": {
    "sender": "דני",
    "unreadOnly": true,
    "receivedAfter": "2024-01-15T00:00:00Z"
  }
}
```

**Pass Criteria:**
- ✅ Multiple filters combined correctly
- ✅ Results match all criteria
- ✅ No emails outside filter range

---

### Test 10: Edge Cases

**Test 10a: No Results**

**Query:** `תראה לי מיילים מאדם שלא קיים`

**Pass Criteria:**
- ✅ Returns empty results gracefully
- ✅ Hermes explains no results found
- ✅ No error thrown

**Test 10b: Very Large Mailbox**

**Query:** `תראה לי את כל המיילים` (show me all emails)

**Pass Criteria:**
- ✅ Respects max limit (50)
- ✅ hasMore flag is true
- ✅ Doesn't timeout or crash

**Test 10c: Invalid Date Range**

**Query:** `מיילים מאתמול עד לפני שבוע` (yesterday to a week ago - invalid range)

**Pass Criteria:**
- ✅ Either corrects the range or returns empty
- ✅ Doesn't crash
- ✅ Hermes acknowledges the issue

---

## Performance Tests

### Latency Test

**Measure end-to-end latency:**

```bash
time hermes <<EOF
תראה לי את חמשת המיילים האחרונים
EOF
```

**Target:** < 5 seconds (p95)

**Components:**
- Hermes processing: ~1-2s
- MCP communication: ~100ms
- IMAP connection: ~1-3s (first time)
- Email fetch: ~500ms-2s
- LLM response: ~1-3s

### Cost Test

**Measure token usage:**

In Hermes:
```
/usage
```

After a few queries, check:
- Input tokens per query
- Output tokens per response
- Estimated cost

**Target:** < $0.10 per query

---

## Success Criteria Summary

For POC to be considered successful:

1. **Integration:** ✅ Hermes sees and uses our MCP tool
2. **Hebrew Support:** ✅ Understands Hebrew queries correctly
3. **Tool Selection:** ✅ 90%+ accuracy in selecting search_emails
4. **Parameter Mapping:** ✅ Correctly maps NL to tool params
5. **Results Quality:** ✅ Accurate, with source references
6. **No Hallucinations:** ✅ Only returns real email data
7. **Performance:** ✅ < 5s latency, < $0.10 per query
8. **Reliability:** ✅ Handles edge cases gracefully
9. **Security:** ✅ Read-only access enforced

---

## Test Report Template

After running tests, document:

```markdown
# POC Test Report - [Date]

## Environment
- Hermes Version: X.X.X
- Email Provider: Gmail / Outlook
- LLM Model: [model name]
- Test Duration: [X hours]

## Test Results

### Functional Tests
| Test | Status | Notes |
|------|--------|-------|
| MCP Server Standalone | ✅/❌ | ... |
| Email Connection | ✅/❌ | ... |
| Basic Search | ✅/❌ | ... |
| Hermes Integration | ✅/❌ | ... |
| Hebrew Query 1 | ✅/❌ | ... |
| Hebrew Query 2 | ✅/❌ | ... |
| ... | | |

### Performance Metrics
- Average Latency: Xs
- P95 Latency: Xs
- Average Cost: $X.XX
- Tool Selection Accuracy: X%

### Issues Found
1. [Issue description]
2. [Issue description]

### Recommendations
- [Recommendation 1]
- [Recommendation 2]

## Go/No-Go Decision
[✅ GO / ❌ NO-GO] - [Reason]
```

---

## Troubleshooting

### Test Failures

**"Tool not found"**
- Rebuild: `pnpm build --filter @whatsapp-secretary/mcp-server`
- Rerun setup: `./scripts/setup-hermes.sh`
- Restart Hermes

**"Connection failed"**
- Verify app password
- Check IMAP enabled
- Test with openssl: `openssl s_client -connect imap.gmail.com:993`

**"Hebrew not working"**
- Check LLM model (use GPT-4 or Claude)
- Try simpler query first
- Check Hermes logs

**"Slow performance"**
- First query is always slower (IMAP connection)
- Reduce limit parameter
- Check network latency

---

## Automated Testing (Future)

For Phase 2+, add:
- Unit tests for email providers
- Integration tests for MCP protocol
- E2E tests with mock Hermes
- Performance benchmarks
- Hebrew NLU test suite
