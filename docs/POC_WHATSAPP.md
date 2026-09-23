# WhatsApp Secretary POC - Complete Setup Guide

This guide walks you through testing the full WhatsApp → Hermes → MCP → WhatsApp flow using Meta's test webhook feature.

## Overview

The POC allows you to:
1. Send a simulated incoming WhatsApp message from Meta's Developer Dashboard
2. Have your local control-plane process it through Hermes
3. Receive Hermes's response back in WhatsApp to your personal test number

**Important**: This uses Meta's test webhook feature, which sends fake sender data. Outbound replies go to `WHATSAPP_TEST_RECIPIENT` instead.

## Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- Hermes Agent installed (`curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash`)
- Meta Developer account with WhatsApp Business API access
- ngrok installed (`brew install ngrok` on macOS)

## Step 1: Install Dependencies

```bash
pnpm install
pnpm build
```

## Step 2: Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and configure the following:

### Required Configuration

```bash
# Control Plane
PORT=3000

# WhatsApp Cloud API
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your-random-secret-token
WHATSAPP_APP_SECRET=your-meta-app-secret
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_ACCESS_TOKEN=your-temporary-access-token
WHATSAPP_GRAPH_API_VERSION=v26.0
WHATSAPP_TEST_RECIPIENT=972541234567

# Hermes
HERMES_SESSION_ID=poc-session
MCP_SERVER_PATH=/Users/youruser/path/to/whatsapp-secretary/packages/mcp-server/dist/mcp-index.js

# Email Provider (use mock for testing)
EMAIL_PROVIDER=mock
EMAIL_ADDRESS=
EMAIL_PASSWORD=
```

### Where to Get These Values

#### WHATSAPP_WEBHOOK_VERIFY_TOKEN
Choose any random string (e.g., `my-secret-verify-token-123`). You'll use this when configuring the webhook in Meta.

#### WHATSAPP_APP_SECRET
1. Go to Meta Developer Dashboard
2. Select your WhatsApp Business app
3. Go to Settings → Basic
4. Copy the "App Secret"

#### WHATSAPP_PHONE_NUMBER_ID
1. In Meta Developer Dashboard
2. Go to WhatsApp → API Setup
3. Copy the "Phone number ID" shown in the "Try it out" section

#### WHATSAPP_ACCESS_TOKEN
1. In the same API Setup screen
2. Click "Generate access token" (temporary, valid for 24 hours)
3. Or create a permanent token in Settings → System Users

#### WHATSAPP_TEST_RECIPIENT
Your personal phone number in international format, digits only:
- Format: `<country_code><number>`
- Example: `972541234567` (Israel)
- Example: `15551234567` (USA)

**Add this number as a test recipient**:
1. WhatsApp → API Setup → "To" field
2. Click "Manage phone number list"
3. Add your personal number
4. Verify it via the code sent to WhatsApp

#### MCP_SERVER_PATH
Absolute path to the built MCP server:

```bash
# Get the absolute path
echo "$(pwd)/packages/mcp-server/dist/mcp-index.js"
```

Copy this path to your `.env` file.

## Step 3: Start the Local Server

```bash
pnpm dev:poc
```

You should see:
```
[Bootstrap] Control plane listening on port 3000
```

## Step 4: Start ngrok

In a new terminal:

```bash
ngrok http 3000
```

You'll see output like:
```
Forwarding  https://abc123def456.ngrok.app -> http://localhost:3000
```

Copy the `https://` URL (e.g., `https://abc123def456.ngrok.app`).

## Step 5: Configure Webhook in Meta

1. Go to Meta Developer Dashboard
2. Select your WhatsApp Business app
3. Go to WhatsApp → Configuration

### Add Webhook URL

1. Click "Edit" next to "Webhook"
2. **Callback URL**: `https://abc123def456.ngrok.app/webhooks/whatsapp`
3. **Verify token**: The value you set for `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
4. Click "Verify and Save"

If successful, you'll see a green checkmark.

### Subscribe to Webhook Events

1. In the same Configuration page
2. Find "Webhook fields"
3. Click "Manage" next to your WhatsApp Business Account
4. Enable the `messages` field
5. Click "Save"

## Step 6: Test the Flow

### Send a Test Message

1. In Meta Developer Dashboard
2. Go to WhatsApp → API Setup
3. Scroll to "Try it out" section
4. Select "Incoming Message" from the samples dropdown
5. Click "Send to server"

### Expected Flow

1. **Meta sends webhook** → Your ngrok URL
2. **Control plane logs** (check your terminal):
   ```
   [WebhookController] WhatsApp webhook received: {"object":"whatsapp_business_account","entries":1}
   [WebhookController] Processing message from Test Sender: "test message body"
   [HermesService] Processing message for session whatsapp-16315551234
   [HermesService] Spawning Hermes: hermes run --session-id whatsapp-16315551234 ...
   [WhatsAppService] Sent WhatsApp message to ***4567
   ```

3. **Check ngrok dashboard**: http://localhost:4040
   - You'll see the POST request from Meta
   - Status should be 200 OK

4. **Check WhatsApp**: Your personal number should receive Hermes's response

### Test with Hebrew

After the initial test works, you can test Hebrew queries. Since Meta's test webhook has a fixed body, you'll need to:

**Option A**: Wait for a real incoming message (requires production setup)

**Option B**: Modify the test locally:
1. Use Postman or curl to send a webhook manually
2. Include your Meta signature (see Meta's documentation)

## Expected Logs

### Successful Processing

```
[WebhookController] WhatsApp webhook received: {"object":"whatsapp_business_account","entries":1}
[WebhookController] Processing message from Test Sender: "test message body"
[HermesService] Processing message for session whatsapp-16315551234
[WhatsAppService] Using test recipient ***4567 instead of sender ***1234
[WhatsAppService] Sent WhatsApp message to ***4567
[WebhookController] Successfully sent reply to ***4567
```

### Status Update (Ignored)

```
[WebhookController] WhatsApp webhook received: {"object":"whatsapp_business_account","entries":1}
[WebhookController] Skipping webhook: No messages in webhook (likely a status update)
```

### Errors

If you see errors, check:
- ✅ MCP_SERVER_PATH points to the built file (not source)
- ✅ Hermes is installed and in your PATH
- ✅ WHATSAPP_TEST_RECIPIENT is in international format
- ✅ Your test recipient number is added in Meta dashboard
- ✅ Access token is valid (not expired)
- ✅ ngrok is running and URL matches webhook config

## Troubleshooting

### Webhook verification fails
- Check `WHATSAPP_WEBHOOK_VERIFY_TOKEN` matches in both `.env` and Meta
- Ensure ngrok URL is correct
- Check firewall/network settings

### "Invalid webhook signature" error
- Check `WHATSAPP_APP_SECRET` is correct
- Ensure you're using the raw body (NestJS is configured for this)

### Hermes timeout
- Check `MCP_SERVER_PATH` is correct
- Ensure MCP server built successfully: `pnpm build`
- Check Hermes logs for errors

### No WhatsApp message received
- Verify `WHATSAPP_TEST_RECIPIENT` is correct
- Check the number is added as a test recipient in Meta
- Check `WHATSAPP_ACCESS_TOKEN` is valid
- Check `WHATSAPP_PHONE_NUMBER_ID` is correct
- Look for API errors in logs

### Meta Test Webhook Limitations

The Meta test webhook sends **fake data**:
- Sender: `16315551234` (not a real number)
- Message: Fixed test message body
- Phone number ID: May be different from your actual ID

**Therefore**:
- Replies go to `WHATSAPP_TEST_RECIPIENT` (configured)
- Use your real `WHATSAPP_PHONE_NUMBER_ID` for outbound
- The inbound sender won't receive anything (it's fake)

## Testing with Real Messages

To test with real incoming messages:

1. Complete WhatsApp Business verification (production setup)
2. Register a real phone number
3. Send a message from your phone to the business number
4. Remove or comment out `WHATSAPP_TEST_RECIPIENT`
5. Replies will go to the actual sender

## Architecture

```
Meta Test Webhook
    ↓
Your ngrok URL
    ↓
Control Plane (localhost:3000)
    ↓ (validates signature, parses payload)
Hermes Service
    ↓ (spawns Hermes CLI with MCP server)
MCP Server (stdio)
    ↓ (search_emails tool)
Mock Email Provider
    ↓ (returns sample data)
Hermes generates response
    ↓
WhatsApp Service
    ↓ (sends via Graph API)
Your WhatsApp (WHATSAPP_TEST_RECIPIENT)
```

## Next Steps

After the POC works:

1. ✅ Test with Hebrew queries (requires custom webhook payload)
2. ✅ Add real email provider (Gmail/Outlook)
3. ✅ Complete WhatsApp Business verification
4. ✅ Deploy to production
5. ✅ Add database for audit logging
6. ✅ Implement approval workflows

## Security Notes

- Never commit your `.env` file
- Rotate access tokens regularly
- Use permanent tokens for production (not temporary)
- Enable webhook signature validation (already implemented)
- Monitor logs for suspicious activity
- Sanitize logs (no full phone numbers or tokens)

## Questions?

- **Hermes not found**: Run `which hermes` to verify installation
- **Port conflicts**: Change `PORT` in `.env`
- **ngrok limits**: Free tier has request limits; consider paid plan
- **Meta API limits**: Test numbers have rate limits

---

**Success**: When you see Hermes's response arrive in WhatsApp, the POC is complete! 🎉
