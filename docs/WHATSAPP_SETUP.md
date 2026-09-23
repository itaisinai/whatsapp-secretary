# WhatsApp Business API Integration Guide

This guide walks you through integrating WhatsApp with the WhatsApp Secretary.

## Overview

We'll use **WhatsApp Cloud API** (formerly WhatsApp Business API) which is:
- ✅ Free for testing
- ✅ Easy to set up
- ✅ Officially supported by Meta
- ✅ Cloud-hosted (no infrastructure needed)

## Step 1: Create Meta Developer Account

1. Go to https://developers.facebook.com/
2. Click "Get Started"
3. Sign up or log in with Facebook account
4. Complete developer registration

**Time:** 5 minutes

## Step 2: Create a WhatsApp Business App

1. Go to https://developers.facebook.com/apps
2. Click "Create App"
3. Select "Business" as app type
4. Fill in:
   - **App Name:** "WhatsApp Secretary Test" (or your choice)
   - **Contact Email:** Your email
   - **Business Account:** Create new or select existing
5. Click "Create App"

**Time:** 5 minutes

## Step 3: Add WhatsApp Product

1. In your app dashboard, find "WhatsApp" in the products list
2. Click "Set up"
3. Select or create a **Business Portfolio**
4. Click "Continue"

**Time:** 2 minutes

## Step 4: Get Test Phone Number

Meta provides a test number for development:

1. In WhatsApp product settings, go to "API Setup"
2. You'll see:
   - **Test Phone Number:** A number provided by Meta (e.g., +1 555...)
   - **Phone Number ID:** A long numeric ID
   - **WhatsApp Business Account ID:** Another ID

3. **Add Your Phone Number for Testing:**
   - Click "Add phone number"
   - Enter your personal WhatsApp number
   - You'll receive a verification code
   - Enter the code

**⚠️ Important:** The test number can only send messages to up to 5 verified numbers.

**Time:** 5 minutes

## Step 5: Get Access Token

1. In the "API Setup" section, find "Temporary access token"
2. Click "Generate Token"
3. Copy the token (starts with "EAAA...")
4. **⚠️ This token expires in 24 hours** - for production, you'll need a permanent token

**Save this for later!**

**Time:** 1 minute

## Step 6: Test Sending a Message

Test the API is working:

```bash
# Replace with your values
PHONE_NUMBER_ID="your_phone_number_id"
ACCESS_TOKEN="your_access_token"
TO="your_phone_number"  # Format: 972501234567 (no + or -)

curl -X POST \
  "https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"messaging_product\": \"whatsapp\",
    \"to\": \"${TO}\",
    \"type\": \"text\",
    \"text\": {
      \"body\": \"Hello from WhatsApp Secretary! 🤖\"
    }
  }"
```

You should receive the message on your WhatsApp!

**Time:** 5 minutes

## Step 7: Set Up Webhook (For Receiving Messages)

Webhooks allow your server to receive incoming WhatsApp messages.

### 7.1: Deploy a Webhook Endpoint

You need a publicly accessible HTTPS URL. Options:

**Option A: Use ngrok for testing (quickest)**

```bash
# Install ngrok
brew install ngrok

# Start ngrok
ngrok http 3000

# You'll get a URL like: https://abc123.ngrok.io
```

**Option B: Deploy to cloud (production)**
- Railway.app
- Heroku
- Vercel
- AWS/GCP/Azure

### 7.2: Create Webhook Endpoint

We'll create this in Phase 2, but here's the basic structure:

```typescript
// src/whatsapp/webhook.controller.ts
import { Controller, Get, Post, Body, Query } from '@nestjs/common';

@Controller('whatsapp/webhook')
export class WhatsAppWebhookController {
  
  // Verification endpoint (called by Meta)
  @Get()
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
    
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook verified');
      return challenge;  // Return challenge as plain text
    }
    
    return 'Forbidden';
  }
  
  // Receive messages endpoint
  @Post()
  async receiveMessage(@Body() body: any) {
    console.log('Incoming webhook:', JSON.stringify(body, null, 2));
    
    // Extract message
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];
    
    if (message) {
      const from = message.from;  // Phone number
      const text = message.text?.body;  // Message text
      
      console.log(`Message from ${from}: ${text}`);
      
      // TODO: Forward to Hermes Agent
      // const response = await this.hermesService.process(text);
      
      // TODO: Send response back to WhatsApp
      // await this.whatsappService.send(from, response);
    }
    
    return { status: 'ok' };
  }
}
```

### 7.3: Configure Webhook in Meta

1. Go to your WhatsApp product settings
2. Click "Configuration" in the left menu
3. Find "Webhook" section
4. Click "Edit"
5. Enter:
   - **Callback URL:** `https://your-domain.com/whatsapp/webhook`
   - **Verify Token:** A secret string you choose (e.g., "my_secret_token_123")
6. Click "Verify and Save"

Meta will call your GET endpoint to verify.

7. **Subscribe to webhook fields:**
   - Check "messages"
   - This tells Meta to send you incoming messages

**Time:** 15 minutes

## Step 8: Test End-to-End

1. Send a message to your WhatsApp Business number
2. Your webhook receives it
3. Your server processes it
4. (Phase 2) Forward to Hermes
5. (Phase 2) Get response
6. Send response back to user

**Current Status:** You can receive webhooks, but response logic is in Phase 2.

## Step 9: Get Production Access

For production (after testing):

1. **Add a phone number:**
   - Go to WhatsApp product settings
   - Click "Phone Numbers" → "Add phone number"
   - Options:
     - New number from Meta (~$5-15/month)
     - Port existing business number

2. **Verify your business:**
   - Meta requires business verification for production
   - Submit business documents
   - Takes 1-3 days

3. **Get permanent access token:**
   - The 24-hour token is for testing only
   - Generate a permanent System User token
   - Store securely in environment variables

**Time:** 2-3 days (verification)

## Architecture After WhatsApp Integration

```
User sends WhatsApp message
  ↓
WhatsApp Cloud API receives it
  ↓
WhatsApp Cloud API calls your webhook
  ↓
Your NestJS server (webhook endpoint)
  ↓
Your server forwards to Hermes Gateway
  ↓
Hermes Agent processes with MCP tools
  ↓
Your server receives response
  ↓
Your server sends via WhatsApp Cloud API
  ↓
User receives response on WhatsApp
```

## Environment Variables Needed

Add to your `.env`:

```bash
# WhatsApp Cloud API
WHATSAPP_PHONE_NUMBER_ID=123456789
WHATSAPP_ACCESS_TOKEN=EAAA...
WHATSAPP_BUSINESS_ACCOUNT_ID=123456789
WHATSAPP_VERIFY_TOKEN=your_webhook_secret_token

# Webhook
WEBHOOK_URL=https://your-domain.com/whatsapp/webhook
```

## Testing Checklist

- [ ] Created Meta Developer account
- [ ] Created WhatsApp Business App
- [ ] Got test phone number from Meta
- [ ] Generated access token
- [ ] Added your number for testing
- [ ] Sent test message successfully
- [ ] Deployed webhook endpoint
- [ ] Verified webhook with Meta
- [ ] Subscribed to messages
- [ ] Received incoming message in webhook
- [ ] (Phase 2) Connected to Hermes
- [ ] (Phase 2) Sent response back

## Cost

**Development/Testing:**
- ✅ FREE (Meta provides test number)
- ✅ Up to 5 verified numbers
- ✅ Unlimited messages

**Production:**
- Phone number: ~$5-15/month
- Messages: FREE up to 1,000 conversations/month
- After 1,000: $0.005-0.012 per conversation (varies by country)

**Conversation = 24-hour window with a user**

## Common Issues & Solutions

### Issue: Webhook verification fails

**Solution:**
- Check your verify token matches
- Ensure endpoint returns challenge as plain text (not JSON)
- Check URL is HTTPS

### Issue: Not receiving messages

**Solution:**
- Check webhook is subscribed to "messages"
- Check your endpoint returns 200 status
- Check logs for errors

### Issue: Can't send messages

**Solution:**
- Check access token is valid
- Check phone number format (no + or spaces)
- Check recipient number is verified for testing

### Issue: Message shows as sent but not delivered

**Solution:**
- Recipient must have WhatsApp installed
- For test number, recipient must be verified first
- Check WhatsApp message logs in Meta dashboard

## Next Steps After Setup

1. ✅ Complete WhatsApp API setup (this guide)
2. 🔄 Build NestJS webhook endpoint (Phase 2)
3. 🔄 Connect webhook to Hermes Gateway (Phase 2)
4. 🔄 Test Hebrew queries via WhatsApp
5. 🔄 Add authentication & authorization
6. 🔄 Add approval workflows (Phase 3)
7. 🔄 Deploy to production

## Resources

- **WhatsApp Cloud API Docs:** https://developers.facebook.com/docs/whatsapp/cloud-api
- **Quick Start:** https://developers.facebook.com/docs/whatsapp/cloud-api/get-started
- **Webhook Reference:** https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks
- **Message Templates:** https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages

## Getting Help

- **Meta Developer Community:** https://developers.facebook.com/community/
- **WhatsApp Business API Support:** Available in Meta Business Suite

---

**Estimated Total Time: 30-45 minutes for initial setup**

**Ready for Phase 2 Implementation: Yes! ✅**
