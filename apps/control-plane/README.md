# Control Plane - WhatsApp Webhook Server

HTTP server for receiving WhatsApp webhooks and managing communication with Hermes Agent.

## Current Status

**Phase 1 (Complete):** WhatsApp webhook infrastructure
- ✅ Webhook verification (GET)
- ✅ Webhook message receipt with signature validation (POST)
- ✅ Health check endpoints for Kubernetes
- ✅ Global exception handling
- ✅ HTTP request/response logging
- ✅ Type-safe configuration management

**Phase 2 (Planned):** Hermes Agent integration
- ⏳ Process WhatsApp messages through Hermes
- ⏳ Session mapping (WhatsApp sender → Hermes session)
- ⏳ Email search via MCP server
- ⏳ Response formatting and delivery

## API Endpoints

### Health Checks

```bash
# Basic health check
GET /health
Response: { "status": "ok", "timestamp": "2024-01-15T10:30:00.000Z" }

# Kubernetes readiness probe
GET /health/ready
Response: { "ready": true }

# Kubernetes liveness probe
GET /health/live
Response: { "alive": true }
```

### WhatsApp Webhooks

```bash
# Webhook verification (Meta calls this during setup)
GET /webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=<token>&hub.challenge=<challenge>
Response: <challenge> (plain text)

# Message receipt (Meta POSTs here when messages arrive)
POST /webhooks/whatsapp
Headers: X-Hub-Signature-256: sha256=<hmac>
Body: { "object": "whatsapp_business_account", "entry": [...] }
Response: { "status": "ok" }
```

## Configuration

Required environment variables:

```bash
PORT=3000                                      # Server port
WHATSAPP_WEBHOOK_VERIFY_TOKEN=<random-secret> # For webhook verification
WHATSAPP_APP_SECRET=<meta-app-secret>         # For signature validation
```

See `.env.example` for full configuration including Phase 2 placeholders.

## Running

```bash
# Development with hot reload
pnpm dev:control-plane  # from repository root

# Production
pnpm --filter @whatsapp-secretary/control-plane build
pnpm --filter @whatsapp-secretary/control-plane start

# Tests
pnpm --filter @whatsapp-secretary/control-plane test
```

## Local Setup with Meta

1. Copy `.env.example` to `.env` and set `WHATSAPP_WEBHOOK_VERIFY_TOKEN` and `WHATSAPP_APP_SECRET`
2. Run `pnpm dev:control-plane` from repository root
3. Expose port 3000 with `ngrok http 3000`
4. In Meta, use `https://<ngrok-host>/webhooks/whatsapp` as the callback URL
5. Use the exact `WHATSAPP_WEBHOOK_VERIFY_TOKEN` value as the Verify token

**Note**: Do not register a production phone number for this initial webhook test.

## Architecture

### Module Structure

```
src/
├── main.ts                          # Bootstrap with error handling
├── app.module.ts                    # Root module with global providers
├── config/
│   └── environment.ts               # Namespaced config (app, whatsapp)
├── common/
│   ├── filters/
│   │   └── all-exceptions.filter.ts # Global exception handling
│   └── interceptors/
│       └── logging.interceptor.ts   # HTTP request/response logging
├── whatsapp/
│   ├── webhook.controller.ts        # Webhook endpoints
│   ├── meta-signature.ts            # HMAC-SHA256 signature verification
│   └── whatsapp.module.ts           # WhatsApp module
└── health/
    ├── health.controller.ts         # Health check endpoints
    └── health.module.ts             # Health module
```

### Global Providers

- **AllExceptionsFilter**: Catches all exceptions and returns structured JSON errors
- **LoggingInterceptor**: Logs HTTP requests with timing (method, URL, status, duration)

### Security

- Webhook signature verification using HMAC-SHA256
- No request body logging (privacy protection)
- No CORS enabled (webhooks don't need it)
- Sanitized error messages (no internal stack traces to clients)

## Testing

Uses Node.js built-in test runner (`node:test`):

```bash
pnpm test
```

Tests cover:
- ✅ Environment validation
- ✅ HMAC signature verification
- ✅ Webhook controller (verification and receipt)
- ✅ Health endpoints
- ✅ Exception filter behavior
- ✅ Logging interceptor behavior

All tests use direct class instantiation (no NestJS TestingModule) for simplicity.

## Phase 2 Integration Plan

When implementing Hermes integration:

1. **Create `hermes/` module** with:
   - `HermesGateway` abstraction (interface)
   - Concrete implementation (child process, HTTP, or other transport)
   - Session manager (Redis/DB-backed)

2. **Update WebhookController** to:
   - Extract message from webhook payload
   - Map WhatsApp sender to Hermes session
   - Call `hermesGateway.sendMessage()`
   - Format and send response back to WhatsApp

3. **Update health checks** to:
   - Check actual Hermes availability in `/health/ready`
   - Return `ready: false` when Hermes is unavailable

4. **Add comprehensive tests** for:
   - Hermes communication with fake adapter
   - Timeout handling
   - Session mapping
   - Error scenarios

## Deployment

### Kubernetes

Use health endpoints for probes:

```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

## References

- [WhatsApp Cloud API Webhooks](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Project Architecture](../../CLAUDE.md)
