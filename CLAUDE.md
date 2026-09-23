# WhatsApp Secretary - Project Context

## Project Overview

WhatsApp Secretary is an AI-powered personal assistant for Niv, built on the Hermes Agent runtime. The assistant will search and summarize information from company systems, schedule morning reports, and prepare business actions for explicit approval.

## Development Phases

### Phase 1: POC (Current)
**Goal:** Prove Hermes Agent can serve as the agent runtime

**Scope:**
- Hermes Agent running locally via CLI
- One tool: `search_emails` (read-only)
- Single email account (Gmail or Outlook)
- Hebrew natural language support
- No WhatsApp, no database, no write operations

**Success Criteria:**
- Hermes selects the right tool for email queries
- Natural language queries work in Hebrew
- Results include source references
- No made-up data (LLM must use tool results only)
- Read-only access enforced

### Phase 2: WhatsApp Integration
- Replace CLI with WhatsApp Business Cloud API
- Add NestJS Control Plane
- Basic session management
- End-to-end flow: WhatsApp → NestJS → Hermes → MCP → WhatsApp

### Phase 3: Extended Capabilities
- Multi-system integration (Monday, Drive, Connecteam)
- Scheduled reports and reminders
- Approval workflows for write operations
- Multi-user support

## Architecture Principles

1. **Hermes is the runtime, not the owner:** Business logic, credentials, and policies stay in our services
2. **Allowlist everything:** Hermes only gets approved tools per scenario
3. **Read-only for POC:** No write operations until approval workflows are in place
4. **Source references required:** Every response must cite sources
5. **No generic tools:** No terminal, filesystem, or browser access

## Repository Structure

```
whatsapp-secretary/
├── apps/
│   ├── hermes-controller/        # CLI app for Hermes integration
│   │   ├── src/
│   │   │   ├── index.ts          # CLI entry point
│   │   │   ├── hermes-controller.ts  # Hermes Agent controller
│   │   │   ├── cli-interface.ts  # Interactive CLI
│   │   │   └── config/
│   │   │       └── environment.ts # Environment validation
│   │   └── package.json
│   └── nestjs-control-plane/    # NestJS HTTP API (headless mode)
│       ├── src/
│       │   ├── main.ts           # NestJS bootstrap
│       │   ├── app.module.ts     # Root module
│       │   ├── modules/
│       │   │   ├── hermes/       # Hermes integration module
│       │   │   │   ├── hermes.service.ts
│       │   │   │   ├── hermes.controller.ts
│       │   │   │   └── hermes.module.ts
│       │   │   └── health/       # Health check endpoints
│       │   ├── common/
│       │   │   ├── dto/          # Data transfer objects
│       │   │   ├── filters/      # Exception filters
│       │   │   └── interceptors/ # Request/response interceptors
│       │   └── config/
│       │       └── environment.config.ts
│       └── package.json
├── packages/
│   ├── mcp-server/               # MCP server with tools
│   │   ├── src/
│   │   │   ├── server.ts         # MCP server
│   │   │   ├── tools/
│   │   │   │   └── search-emails.ts
│   │   │   └── providers/
│   │   │       ├── email-provider.ts
│   │   │       ├── gmail-provider.ts
│   │   │       └── outlook-provider.ts
│   │   └── package.json
│   └── shared/                   # Shared types and utilities
│       ├── src/
│       │   ├── types/
│       │   │   ├── email.ts
│       │   │   └── tool.ts
│       │   └── utils/
│       │       ├── date.ts
│       │       └── validation.ts
│       └── package.json
├── docs/
│   ├── POC_SETUP.md             # Setup guide
│   └── ARCHITECTURE.md          # Architecture documentation
├── .env.example                 # Environment template
├── package.json                 # Root package (pnpm workspaces)
└── pnpm-workspace.yaml          # Workspace configuration
```

## Key Tools

### search_emails
**Purpose:** Unified email search tool (replaces separate tools for recent, unread, by-sender)

**Parameters:**
- `sender` (optional): Filter by sender name or email
- `text` (optional): Search in subject/body
- `receivedAfter/Before` (optional): Date range
- `unreadOnly` (optional): Only unread emails
- `limit` (optional): Max results (default 10, max 50)

**Returns:**
- Email ID and thread ID
- Sender, subject, date
- Unread status and snippet
- Source URL when available

**Constraints:**
- Read-only (no write operations)
- No attachments in POC
- No thread expansion (future: `get_email_thread`)

## Development Guidelines

### For POC Implementation (Next PR)
1. **Integrate Hermes Agent:** Connect to Hermes Agent runtime
2. **Implement email search:** Choose IMAP or API-based approach
3. **Test Hebrew queries:** Ensure natural language works
4. **Validate tool selection:** Hermes must choose the right tool
5. **Enforce read-only:** No write operations at any level
6. **Include sources:** Every response must cite email IDs/URLs

### Code Style
- TypeScript strict mode
- Explicit types (avoid `any`)
- Clear error messages
- TODO comments for Phase 2+ features
- Comments in English, user-facing text in Hebrew

### Security
- Never commit `.env` file
- Use app passwords, not main passwords
- Validate all inputs
- Sanitize outputs
- Log security events

### Testing Queries (Hebrew)
```
תראה לי את חמשת המיילים האחרונים
אילו מיילים עדיין לא קראתי?
מה המיילים האחרונים שקיבלתי מיוסי?
תמצא מיילים מהשבוע האחרון בנושא פרויקט
מתוך התוצאות, מה נראה שדורש ממני פעולה?
```

## Environment Variables

Required for POC:
- `LLM_PROVIDER`: openai or anthropic
- `LLM_API_KEY`: API key for LLM provider
- `LLM_MODEL`: Model name
- `EMAIL_PROVIDER`: gmail or outlook
- `EMAIL_ADDRESS`: Email account
- `EMAIL_PASSWORD`: App password (NOT regular password!)

See `.env.example` and `docs/POC_SETUP.md` for details.

## Common Tasks

```bash
# Install dependencies
pnpm install

# Run the CLI app (interactive)
pnpm dev

# Run the NestJS control plane (HTTP API)
pnpm dev:nestjs

# Build everything
pnpm build

# Test connection (CLI)
pnpm --filter hermes-controller test

# Clean build artifacts
pnpm clean
```

## NestJS Control Plane (Headless Mode)

The NestJS control plane provides a stateless HTTP API for headless communication with Hermes Agent. This allows external systems (WhatsApp, webhooks, other services) to interact with Hermes without requiring an interactive CLI.

**Key Features:**
- RESTful API for message processing
- Session management for multiple conversations
- Direct tool access for testing
- Health check endpoints for orchestration
- Structured logging and error handling

**API Endpoints:**
- `POST /hermes/message` - Send a message to Hermes
- `POST /hermes/search-emails` - Direct email search
- `GET /hermes/test` - Test connections
- `GET /hermes/sessions` - List active sessions
- `GET /health` - Health checks

**Running:**
```bash
# Development mode with hot reload
pnpm dev:nestjs

# Production build
pnpm --filter nestjs-control-plane build
pnpm --filter nestjs-control-plane start
```

See `apps/nestjs-control-plane/README.md` for detailed API documentation and usage examples.

## Important Notes

1. **App Passwords:** Gmail/Outlook require app passwords, not regular passwords. See `docs/POC_SETUP.md`.
2. **Hebrew Support:** The LLM must handle Hebrew queries naturally.
3. **Tool Implementation:** The actual Hermes integration and email search will be in the next PR.
4. **No Premature Optimization:** Phase 1 is proof-of-concept only.
5. **Document Decisions:** Add TODO comments explaining why features are deferred.

## Next Steps After Skeleton

1. Research and choose Hermes Agent integration approach
2. Implement email provider (IMAP vs API)
3. Connect Hermes to MCP server
4. Test with Hebrew queries
5. Document POC results and decisions
6. Go/No-Go decision on Hermes as runtime

## References

- **Design Document:** B-Fresh Tech Design (see project docs)
- **Hermes Agent:** [Add documentation link when available]
- **MCP Protocol:** [Add documentation link when available]
- **Gmail App Passwords:** https://myaccount.google.com/apppasswords
- **Outlook App Passwords:** https://account.microsoft.com/security
