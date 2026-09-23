# Phase 2 Implementation Plan

## Goal
Connect WhatsApp to the existing MCP Server via NestJS, allowing users to send Hebrew queries via WhatsApp and receive email search results.

## What You Need to Do

### 1. WhatsApp Business API Setup (30-45 min)
**Follow:** [WHATSAPP_SETUP.md](./WHATSAPP_SETUP.md)

**Result:** 
- ✅ WhatsApp test number
- ✅ Access token
- ✅ Webhook configured
- ✅ Can send/receive messages

---

### 2. Create NestJS Application (2-3 hours)

#### 2.1: Initialize NestJS Project

```bash
# In the monorepo root
cd apps/
npx @nestjs/cli new control-plane
cd control-plane

# Install dependencies
npm install @nestjs/config
npm install axios
npm install @nestjs/throttler  # Rate limiting
```

#### 2.2: Project Structure

```
apps/control-plane/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── whatsapp/
│   │   ├── whatsapp.module.ts
│   │   ├── webhook.controller.ts
│   │   ├── whatsapp.service.ts
│   │   └── dto/
│   │       └── webhook-payload.dto.ts
│   ├── hermes/
│   │   ├── hermes.module.ts
│   │   └── hermes.service.ts
│   └── config/
│       └── configuration.ts
└── package.json
```

#### 2.3: Configuration Module

```typescript
// src/config/configuration.ts
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  whatsapp: {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
    apiUrl: 'https://graph.facebook.com/v21.0',
  },
  hermes: {
    command: 'hermes',
    mcpServerPath: process.env.MCP_SERVER_PATH,
  },
});
```

---

### 3. Implement WhatsApp Webhook (1 hour)

```typescript
// src/whatsapp/webhook.controller.ts
import { Controller, Get, Post, Body, Query, HttpCode } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { HermesService } from '../hermes/hermes.service';

@Controller('whatsapp/webhook')
export class WebhookController {
  constructor(
    private whatsappService: WhatsAppService,
    private hermesService: HermesService,
  ) {}

  @Get()
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      console.log('✅ Webhook verified');
      return parseInt(challenge, 10);
    }
    throw new Error('Forbidden');
  }

  @Post()
  @HttpCode(200)
  async receive(@Body() body: any) {
    console.log('📨 Incoming webhook:', JSON.stringify(body, null, 2));

    try {
      const message = this.extractMessage(body);
      if (!message) {
        return { status: 'ok' };
      }

      const { from, text, messageId } = message;
      console.log(`Message from ${from}: ${text}`);

      // Send to Hermes
      const response = await this.hermesService.processMessage(from, text);

      // Send response back to WhatsApp
      await this.whatsappService.sendMessage(from, response);

      // Mark original message as read
      await this.whatsappService.markAsRead(messageId);

      return { status: 'ok' };
    } catch (error) {
      console.error('❌ Error processing message:', error);
      return { status: 'error', message: error.message };
    }
  }

  private extractMessage(body: any) {
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (!message || message.type !== 'text') {
      return null;
    }

    return {
      from: message.from,
      text: message.text.body,
      messageId: message.id,
      timestamp: message.timestamp,
    };
  }
}
```

---

### 4. Implement WhatsApp Service (1 hour)

```typescript
// src/whatsapp/whatsapp.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class WhatsAppService {
  private apiUrl: string;
  private phoneNumberId: string;
  private accessToken: string;

  constructor(private configService: ConfigService) {
    this.apiUrl = this.configService.get('whatsapp.apiUrl');
    this.phoneNumberId = this.configService.get('whatsapp.phoneNumberId');
    this.accessToken = this.configService.get('whatsapp.accessToken');
  }

  async sendMessage(to: string, text: string): Promise<void> {
    const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;

    try {
      await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: text },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      console.log(`✅ Sent message to ${to}`);
    } catch (error) {
      console.error('❌ Failed to send message:', error.response?.data);
      throw error;
    }
  }

  async markAsRead(messageId: string): Promise<void> {
    const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;

    try {
      await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId,
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );
    } catch (error) {
      console.error('⚠️ Failed to mark as read:', error.response?.data);
    }
  }
}
```

---

### 5. Implement Hermes Service (2 hours)

**Option A: Call Hermes Gateway (Simpler)**

```typescript
// src/hermes/hermes.service.ts
import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class HermesService {
  async processMessage(userId: string, message: string): Promise<string> {
    try {
      // Call Hermes CLI with the message
      const escapedMessage = message.replace(/"/g, '\\"');
      const command = `hermes message --session "${userId}" "${escapedMessage}"`;

      const { stdout, stderr } = await execAsync(command, {
        timeout: 30000, // 30 second timeout
      });

      if (stderr) {
        console.error('Hermes stderr:', stderr);
      }

      return stdout.trim() || 'מצטער, לא הצלחתי לעבד את הבקשה';
    } catch (error) {
      console.error('Error calling Hermes:', error);
      return 'אירעה שגיאה בעיבוד הבקשה. אנא נסה שוב מאוחר יותר.';
    }
  }
}
```

**Option B: Spawn Hermes Process (More Control)**

```typescript
import { spawn } from 'child_process';

async processMessage(userId: string, message: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hermes = spawn('hermes', [
      'message',
      '--session', userId,
      '--json', // If Hermes supports JSON output
      message
    ]);

    let output = '';
    let error = '';

    hermes.stdout.on('data', (data) => {
      output += data.toString();
    });

    hermes.stderr.on('data', (data) => {
      error += data.toString();
    });

    hermes.on('close', (code) => {
      if (code === 0) {
        resolve(output.trim());
      } else {
        reject(new Error(`Hermes exited with code ${code}: ${error}`));
      }
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      hermes.kill();
      reject(new Error('Hermes timeout'));
    }, 30000);
  });
}
```

---

### 6. Environment Variables

Update `.env`:

```bash
# NestJS
PORT=3000
NODE_ENV=development

# WhatsApp
WHATSAPP_PHONE_NUMBER_ID=123456789
WHATSAPP_ACCESS_TOKEN=EAAA...
WHATSAPP_VERIFY_TOKEN=my_secret_token_123

# Hermes
MCP_SERVER_PATH=/Users/itai/Documents/GitHub/whatsapp-secretary/packages/mcp-server/dist/mcp-index.js

# Email (from Phase 1)
EMAIL_PROVIDER=mock
EMAIL_ADDRESS=
EMAIL_PASSWORD=
```

---

### 7. Testing Phase 2 (1 hour)

#### Test 1: Local Webhook

```bash
# Terminal 1: Start NestJS
cd apps/control-plane
npm run start:dev

# Terminal 2: Start ngrok
ngrok http 3000

# Update webhook URL in Meta Dashboard
# URL: https://abc123.ngrok.io/whatsapp/webhook
# Verify Token: my_secret_token_123
```

#### Test 2: Send Message

Send a WhatsApp message to your business number:
```
תראה לי את חמשת המיילים האחרונים
```

Expected flow:
1. WhatsApp → Your webhook
2. Your server → Hermes
3. Hermes → MCP Server
4. MCP Server → Mock emails
5. Response → WhatsApp

#### Test 3: Check Logs

```bash
# NestJS logs
npm run start:dev

# Hermes logs
hermes gateway logs -f

# ngrok logs
# Visit: http://localhost:4040
```

---

### 8. Deployment (2-3 hours)

#### Option A: Railway (Recommended - Easy)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create project
railway init

# Add environment variables
railway variables set WHATSAPP_ACCESS_TOKEN=...
railway variables set WHATSAPP_PHONE_NUMBER_ID=...
# ... add all variables

# Deploy
railway up
```

#### Option B: Heroku

```bash
heroku create whatsapp-secretary
heroku config:set WHATSAPP_ACCESS_TOKEN=...
git push heroku main
```

#### Option C: Docker + Any Cloud

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/control-plane/package*.json ./apps/control-plane/

# Install dependencies
RUN npm install

# Copy source
COPY . .

# Build
RUN npm run build

# Install Hermes
RUN curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

---

## Timeline Estimate

| Task | Time | Status |
|------|------|--------|
| WhatsApp API Setup | 45 min | ⬜ Todo |
| NestJS Setup | 1 hour | ⬜ Todo |
| Webhook Implementation | 1 hour | ⬜ Todo |
| WhatsApp Service | 1 hour | ⬜ Todo |
| Hermes Integration | 2 hours | ⬜ Todo |
| Testing | 1 hour | ⬜ Todo |
| Deployment | 2 hours | ⬜ Todo |
| **Total** | **8-9 hours** | |

---

## Success Criteria

- [ ] WhatsApp webhook receives messages
- [ ] Messages forwarded to Hermes
- [ ] Hermes calls MCP server
- [ ] Hebrew queries understood
- [ ] Responses sent back to WhatsApp
- [ ] Works end-to-end with mock data
- [ ] Deployed to production

---

## What's NOT in Phase 2

❌ User authentication (Phase 3)  
❌ Approval workflows (Phase 3)  
❌ Multi-user support (Phase 3)  
❌ Real email access (optional)  
❌ Database/audit logging (Phase 3)  
❌ Write operations (Phase 3)  

---

## Quick Start Commands

```bash
# 1. Setup WhatsApp (follow WHATSAPP_SETUP.md)

# 2. Create NestJS app
cd apps
npx @nestjs/cli new control-plane

# 3. Install deps
cd control-plane
npm install @nestjs/config axios

# 4. Copy Phase 2 code (from this guide)

# 5. Configure .env

# 6. Start dev server
npm run start:dev

# 7. Test with ngrok
ngrok http 3000

# 8. Send WhatsApp message

# 9. Deploy when ready
railway up
```

---

## Need Help?

- **WhatsApp Issues:** Check [WHATSAPP_SETUP.md](./WHATSAPP_SETUP.md)
- **Hermes Issues:** Check [PHASE2_GATEWAY.md](./PHASE2_GATEWAY.md)
- **Architecture Questions:** Check [ARCHITECTURE.md](./ARCHITECTURE.md)

**You're ready to start Phase 2!** 🚀
