# NestJS Control Plane

Headless HTTP/REST API for communicating with Hermes Agent. This application provides a stateless control plane that can be called by external systems (WhatsApp, webhooks, etc.) without requiring an interactive CLI.

## Features

- **RESTful API**: HTTP endpoints for sending messages to Hermes
- **Session Management**: Track multiple conversation sessions
- **Direct Tool Access**: Call search_emails directly for testing
- **Health Checks**: Ready/live probes for container orchestration
- **Structured Logging**: Request/response logging with timing
- **Error Handling**: Global exception filters with proper error messages
- **Validation**: Automatic DTO validation with class-validator

## Architecture

```
External System (WhatsApp, etc.)
        ↓
NestJS Control Plane (HTTP API)
        ↓
Hermes Agent (via HermesService)
        ↓
MCP Server (search_emails tool)
        ↓
Email Provider (Gmail/Outlook)
```

## API Endpoints

### Send Message to Hermes
```bash
POST /hermes/message
Content-Type: application/json

{
  "message": "תראה לי את המיילים האחרונים",
  "sessionId": "user-123",  // optional
  "metadata": {}            // optional
}

Response:
{
  "sessionId": "user-123",
  "response": "הנה חמשת המיילים האחרונים...",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "sources": ["email-id-1", "email-id-2"],
  "toolsUsed": ["search_emails"]
}
```

### Direct Email Search
```bash
POST /hermes/search-emails
Content-Type: application/json

{
  "sender": "yossi@example.com",
  "text": "פרויקט",
  "unreadOnly": true,
  "limit": 10
}

Response:
{
  "emails": [...],
  "total": 5,
  "hasMore": false
}
```

### Test Connection
```bash
GET /hermes/test

Response:
{
  "status": "ok",
  "connections": {
    "hermes": true,
    "email": true,
    "mcp": true
  }
}
```

### Session Management
```bash
# List all sessions
GET /hermes/sessions

# Get specific session
GET /hermes/session?id=user-123
```

### Health Checks
```bash
# Basic health
GET /health

# Kubernetes readiness probe
GET /health/ready

# Kubernetes liveness probe
GET /health/live
```

## Installation

```bash
# From repository root
pnpm install

# Install only this app's dependencies
pnpm --filter @whatsapp-secretary/nestjs-control-plane install
```

## Configuration

Copy `.env.example` to `.env` or `.env.local`:

```bash
cp .env.example .env
```

Required environment variables:
- `LLM_PROVIDER`: openai or anthropic
- `LLM_API_KEY`: Your LLM API key
- `LLM_MODEL`: Model name (e.g., claude-3-5-sonnet-20241022)
- `EMAIL_PROVIDER`: gmail or outlook
- `EMAIL_ADDRESS`: Email account to search
- `EMAIL_PASSWORD`: App password (NOT regular password!)

Optional:
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: development or production
- `HERMES_SESSION_ID`: Default session ID

## Running

```bash
# Development (with hot reload)
pnpm --filter @whatsapp-secretary/nestjs-control-plane start:dev

# Production build
pnpm --filter @whatsapp-secretary/nestjs-control-plane build
pnpm --filter @whatsapp-secretary/nestjs-control-plane start
```

## Testing with curl

```bash
# Health check
curl http://localhost:3000/health

# Test connection
curl http://localhost:3000/hermes/test

# Send Hebrew message
curl -X POST http://localhost:3000/hermes/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "תראה לי את המיילים שלא קראתי",
    "sessionId": "test-session"
  }'

# Search emails directly
curl -X POST http://localhost:3000/hermes/search-emails \
  -H "Content-Type: application/json" \
  -d '{
    "sender": "yossi@example.com",
    "unreadOnly": true,
    "limit": 5
  }'
```

## Integration with WhatsApp (Phase 2)

This control plane is designed to be the bridge between WhatsApp Business API and Hermes:

1. **Webhook receives WhatsApp message** → POST to `/hermes/message`
2. **Hermes processes with tools** → Uses existing MCP server
3. **Response sent back** → Via WhatsApp Business API

Session management allows tracking multiple users' conversations.

## Deployment Notes

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN pnpm install
RUN pnpm build
CMD ["pnpm", "start"]
EXPOSE 3000
```

### Kubernetes
Use the health endpoints for probes:
```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 3000
readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
```

## Development Status

**Current Phase**: Skeleton implementation (Phase 1.5)

- ✅ NestJS application structure
- ✅ REST API endpoints
- ✅ Session management
- ✅ Configuration validation
- ✅ Error handling and logging
- ⏳ Hermes Agent integration (TODO)
- ⏳ MCP server connection (TODO)
- ⏳ Email provider implementation (TODO)

The actual Hermes integration will be implemented alongside the existing CLI controller. This control plane uses the same configuration and will call the same tools.

## Architecture Decisions

1. **Stateless by default**: Sessions are in-memory for now (will be Redis/DB in Phase 3)
2. **No new tools**: Uses existing `search_emails` via MCP
3. **Same configuration**: Shares env vars with CLI controller
4. **Separate from CLI**: Can run standalone or alongside CLI
5. **Ready for Phase 2**: Structure supports WhatsApp webhook integration

## See Also

- [Project Documentation](../../docs/ARCHITECTURE.md)
- [POC Setup Guide](../../docs/POC_SETUP.md)
- [Hermes Controller (CLI)](../hermes-controller/README.md)
- [MCP Server](../../packages/mcp-server/README.md)
