# Phase 2: Hermes Gateway for WhatsApp

This document explains how to use Hermes in **headless mode** for WhatsApp integration.

## Overview

Hermes has a built-in **Gateway** that connects to messaging platforms like WhatsApp, Telegram, Discord, etc. This runs as a background service (daemon) without the CLI interface.

## Architecture for Phase 2

```
┌─────────────────┐
│ WhatsApp User   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│ WhatsApp Business Cloud API │
└────────┬────────────────────┘
         │ Webhook
         ▼
┌──────────────────────────────────┐
│   NestJS Control Plane (Ours)    │
│  - Receives webhooks             │
│  - User authentication           │
│  - Session management            │
│  - Approval workflows            │
│  - Audit logging                 │
└────────┬─────────────────────────┘
         │ Forward to Hermes
         ▼
┌──────────────────────────────────┐
│     Hermes Gateway (Headless)    │
│  - Runs as daemon                │
│  - Processes messages            │
│  - Calls MCP tools               │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│   Our MCP Server                 │
│  - search_emails                 │
│  - (future: more tools)          │
└──────────────────────────────────┘
```

## Setup Options

### Option 1: Hermes Gateway (Recommended)

**Pros:**
- Built-in support for multiple platforms
- Handles connection management
- Session persistence
- Automatic reconnection

**Cons:**
- Less control over flow
- Approval workflows need custom implementation

**Setup:**

1. **Configure WhatsApp in Hermes:**
   ```bash
   hermes gateway setup
   # Select WhatsApp
   # Enter credentials
   ```

2. **Start Gateway as daemon:**
   ```bash
   hermes gateway start --daemon
   ```

3. **Messages flow directly:**
   ```
   WhatsApp → Hermes Gateway → MCP Tool → WhatsApp
   ```

### Option 2: NestJS + Hermes Gateway (Hybrid)

**Pros:**
- Full control in NestJS
- Custom approval workflows
- Audit logging in our DB
- User management

**Cons:**
- More complex setup

**Architecture:**

```typescript
// NestJS Controller
@Post('/whatsapp/webhook')
async handleWhatsApp(@Body() payload: WhatsAppWebhook) {
  // 1. Authenticate user
  const user = await this.authService.verify(payload.from);
  
  // 2. Check permissions
  const allowed = await this.permissionsService.check(user, 'search_emails');
  
  // 3. Forward to Hermes Gateway API
  const response = await this.hermesClient.sendMessage({
    userId: user.id,
    message: payload.message,
    allowedTools: ['search_emails']
  });
  
  // 4. Log to audit
  await this.auditService.log({
    user: user.id,
    action: 'search_emails',
    result: response
  });
  
  // 5. Send response back to WhatsApp
  await this.whatsappService.send(payload.from, response);
}
```

### Option 3: Direct Python Integration

If we need maximum control, we can import Hermes as a library:

```python
# hermes_service.py
from hermes import Agent, Tool

class HermesService:
    def __init__(self):
        self.agent = Agent(
            model="openai/gpt-4",
            tools_dir="/path/to/mcp/tools"
        )
    
    def process_message(self, message: str, user_id: str) -> str:
        # Custom logic before calling Hermes
        allowed_tools = self.get_user_tools(user_id)
        
        # Call Hermes
        response = self.agent.run(
            message,
            tools=allowed_tools,
            session_id=user_id
        )
        
        return response
```

Then call from NestJS via child process or HTTP.

## Recommended Approach for Your Project

Based on your design document, I recommend **Option 2 (Hybrid)**:

### Phase 2A: Basic Gateway
1. Use Hermes Gateway for initial testing
2. Connect directly to WhatsApp
3. Validate end-to-end flow

### Phase 2B: Add Control Plane
1. Build NestJS webhooks
2. Add user authentication
3. Add audit logging
4. Forward to Hermes Gateway

### Phase 3: Full Control
1. Implement approval workflows
2. Add multi-user support
3. Add write operations with approvals

## Hermes Gateway Commands

```bash
# Setup gateway (interactive)
hermes gateway setup

# Start gateway as daemon
hermes gateway start --daemon

# Check gateway status
hermes gateway status

# View gateway logs
hermes gateway logs

# Stop gateway
hermes gateway stop

# Configure specific platform
hermes gateway config whatsapp

# Test gateway
hermes gateway test
```

## Gateway Configuration File

Location: `~/.hermes/gateway.yaml`

```yaml
platforms:
  whatsapp:
    enabled: true
    phone_number: "+1234567890"
    credentials:
      # Will be set up via `hermes gateway setup`
    
messaging:
  default_model: "openai/gpt-4"
  timeout: 30
  
mcp_servers:
  whatsapp_secretary:
    command: "node"
    args: ["/path/to/mcp-server/dist/mcp-index.js"]
    env:
      EMAIL_PROVIDER: "gmail"
      EMAIL_ADDRESS: "your@email.com"
      EMAIL_PASSWORD: "your_app_password"
```

## NestJS Integration (Phase 2B)

### 1. Install Dependencies

```bash
npm install @nestjs/common @nestjs/core @nestjs/platform-express
npm install axios  # for calling Hermes Gateway API
```

### 2. Create Hermes Service

```typescript
// src/hermes/hermes.service.ts
import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class HermesService {
  async sendMessage(userId: string, message: string): Promise<string> {
    // Option A: Call Hermes Gateway via API
    // (if gateway exposes HTTP API)
    
    // Option B: Call Hermes CLI programmatically
    const { stdout } = await execAsync(
      `hermes message --session ${userId} "${message}"`
    );
    return stdout;
  }
  
  async checkGatewayStatus(): Promise<boolean> {
    try {
      const { stdout } = await execAsync('hermes gateway status');
      return stdout.includes('running');
    } catch {
      return false;
    }
  }
}
```

### 3. Create WhatsApp Controller

```typescript
// src/whatsapp/whatsapp.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { HermesService } from '../hermes/hermes.service';

@Controller('whatsapp')
export class WhatsAppController {
  constructor(
    private hermesService: HermesService
  ) {}
  
  @Post('webhook')
  async handleIncoming(@Body() payload: any) {
    const { from, message } = payload;
    
    // Forward to Hermes
    const response = await this.hermesService.sendMessage(
      from,  // Use phone number as session ID
      message
    );
    
    // Send response back to WhatsApp Business API
    // (implementation depends on WhatsApp API)
    
    return { success: true };
  }
}
```

## Testing Gateway Mode

### Test Locally (Development)

1. **Start gateway:**
   ```bash
   hermes gateway start
   ```

2. **Send test message:**
   ```bash
   # Via Hermes CLI
   hermes message --platform whatsapp "תראה לי את המיילים"
   
   # Or simulate webhook
   curl -X POST http://localhost:3000/whatsapp/webhook \
     -H "Content-Type: application/json" \
     -d '{"from":"+123","message":"תראה לי את המיילים"}'
   ```

### Test with Real WhatsApp (Staging)

1. Set up WhatsApp Business API test number
2. Configure webhook URL: `https://your-server.com/whatsapp/webhook`
3. Send message from test phone
4. Verify flow works end-to-end

## Monitoring & Debugging

### Gateway Logs

```bash
# View real-time logs
hermes gateway logs -f

# View last 100 lines
hermes gateway logs --tail 100

# Filter by platform
hermes gateway logs --platform whatsapp
```

### NestJS Logs

```typescript
// Add logging in controllers
import { Logger } from '@nestjs/common';

@Controller('whatsapp')
export class WhatsAppController {
  private logger = new Logger('WhatsAppController');
  
  async handleIncoming(payload: any) {
    this.logger.log(`Received message from ${payload.from}`);
    // ...
  }
}
```

## Security Considerations

1. **Webhook Verification:**
   - Validate WhatsApp webhook signatures
   - Use webhook verification token

2. **Rate Limiting:**
   - Add rate limits per user
   - Prevent abuse

3. **User Authentication:**
   - Verify user phone numbers
   - Maintain session security

4. **Audit Logging:**
   - Log all tool calls
   - Track approval workflows
   - Monitor for suspicious activity

## Next Steps

1. ✅ Complete POC with CLI (current)
2. 🔄 Test Hermes Gateway locally
3. 🔄 Set up WhatsApp Business API test account
4. 🔄 Build NestJS Control Plane
5. 🔄 Integrate gateway with NestJS
6. 🔄 Deploy to production

## Resources

- **Hermes Gateway Docs:** https://hermes-agent.nousresearch.com/docs/user-guide/messaging
- **WhatsApp Business API:** https://developers.facebook.com/docs/whatsapp/cloud-api
- **NestJS Docs:** https://docs.nestjs.com/

## Questions to Resolve

- [ ] Does Hermes Gateway expose an HTTP API for programmatic access?
- [ ] How to implement approval workflows with gateway?
- [ ] Session management strategy (Hermes vs our DB)?
- [ ] How to handle long-running tool calls (>30s)?
