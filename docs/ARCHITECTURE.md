# Architecture Overview

## System Architecture (Target State)

```
┌─────────────┐
│  WhatsApp   │ ← User interface (Phase 2)
│   User      │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────┐
│          WhatsApp Business Cloud API                │
└──────┬──────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────┐
│         NestJS Control Plane (Phase 2)              │
│  ┌──────────────────────────────────────────────┐   │
│  │ • User Authentication & Authorization        │   │
│  │ • Session Management                         │   │
│  │ • Approval Workflows                         │   │
│  │ • Audit Logging                              │   │
│  │ • Idempotency & State Management             │   │
│  │ • Tool Allowlist per Scenario                │   │
│  └──────────────────────────────────────────────┘   │
└──────┬──────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────┐
│            Hermes Agent Runtime                     │
│  ┌──────────────────────────────────────────────┐   │
│  │ • Agent Loop & Context Management            │   │
│  │ • LLM Integration & Routing                  │   │
│  │ • Tool Selection & Execution                 │   │
│  │ • Session & Memory Management                │   │
│  │ • Scheduled Runs (morning reports)           │   │
│  └──────────────────────────────────────────────┘   │
└──────┬──────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────┐
│         B-Fresh MCP Server (Phase 1)                │
│  ┌──────────────────────────────────────────────┐   │
│  │ Tools:                                        │   │
│  │ • search_emails (Phase 1)                    │   │
│  │ • get_email_thread (Phase 3)                 │   │
│  │ • create_monday_task (Phase 3)               │   │
│  │ • draft_email (Phase 3)                      │   │
│  └──────────────────────────────────────────────┘   │
└──────┬──────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────┐
│         External Systems (Read-Only in POC)         │
│  ┌────────────┬────────────┬────────────────────┐   │
│  │   Gmail/   │  Monday.com│  Google Drive      │   │
│  │  Outlook   │            │  Connecteam        │   │
│  └────────────┴────────────┴────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

## Phase 1 (POC) - Current Implementation

```
┌─────────────┐
│ CLI User    │ ← Testing interface (temporary)
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────┐
│         Hermes Controller App                       │
│  • CLI Interface (interactive chat)                 │
│  • Environment Configuration                        │
│  • Basic Session Management                         │
└──────┬──────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────┐
│         Hermes Agent (to be integrated)             │
│  • LLM Provider Connection                          │
│  • Tool Selection Logic                             │
│  • Context Management                               │
└──────┬──────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────┐
│         MCP Server                                  │
│  • search_emails tool definition                    │
│  • Gmail Provider (IMAP)                            │
│  • Outlook Provider (IMAP)                          │
└──────┬──────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────┐
│      Gmail / Outlook (Read-Only Access)             │
└─────────────────────────────────────────────────────┘
```

## Component Responsibilities

### 1. Hermes Controller (Phase 1)
**Location:** `apps/hermes-controller`

**Responsibilities:**
- CLI interface for testing
- Environment validation
- Session initialization
- Message routing to/from Hermes Agent

**Not Responsible For:**
- LLM interaction (delegated to Hermes)
- Tool execution (delegated to MCP Server)
- Email access (delegated to Email Providers)

### 2. MCP Server (Phase 1)
**Location:** `packages/mcp-server`

**Responsibilities:**
- Tool definition and registration
- Email provider abstraction
- Search query execution
- Result formatting with source references

**Not Responsible For:**
- User authentication (Phase 2)
- Approval workflows (Phase 2+)
- LLM interaction
- Business logic

### 3. Shared Package
**Location:** `packages/shared`

**Responsibilities:**
- Type definitions
- Utility functions
- Constants and defaults
- Validation helpers

### 4. NestJS Control Plane (Phase 2)
**Location:** `apps/control-plane` (to be created)

**Future Responsibilities:**
- WhatsApp webhook handling
- User authentication & authorization
- Approval workflows
- Audit logging
- State management (PostgreSQL)
- Tool allowlist enforcement
- Idempotency guarantees

### 5. Hermes Agent (External, to be integrated)

**Responsibilities:**
- Agent loop execution
- LLM provider integration
- Tool selection and calling
- Context and memory management
- Scheduled runs

**Not Responsible For:**
- Tool implementation
- Credential management
- Business logic
- Approval workflows

## Security Boundaries

### Phase 1 (POC)
- Email access: Read-only via app passwords
- No terminal, filesystem, or browser access
- Single user, single session
- Credentials in .env (local only)

### Phase 2+ (Production)
- Email access: Read-only via OAuth2
- Credentials in secure vault
- Multi-user with proper isolation
- Audit trail for all operations
- Approval workflow for write operations
- Tool allowlist per user/scenario

## Data Flow

### Query Processing (Phase 1)
1. User types query in CLI
2. Hermes Controller passes to Hermes Agent
3. Hermes Agent sends to LLM
4. LLM decides to call `search_emails` tool
5. Tool call goes to MCP Server
6. MCP Server queries email provider
7. Results return with source references
8. Hermes formats response
9. Response displayed in CLI

### Query Processing (Phase 2+)
1. User sends WhatsApp message
2. WhatsApp Cloud API webhooks to NestJS
3. NestJS authenticates user, loads permissions
4. NestJS creates/resumes session with Hermes
5. Hermes processes with allowed tools only
6. Tool calls validated by NestJS
7. Write operations require explicit approval
8. All actions logged to PostgreSQL
9. Response sent back via WhatsApp

## Technology Stack

### Current (Phase 1)
- **Language:** TypeScript
- **Runtime:** Node.js 20+
- **Package Manager:** pnpm (workspaces)
- **CLI:** commander, inquirer, chalk, ora
- **Email:** IMAP (via app passwords)
- **LLM:** OpenAI/Anthropic (configured via env)

### Future (Phase 2+)
- **Backend Framework:** NestJS
- **Database:** PostgreSQL
- **ORM:** Prisma or TypeORM
- **Email:** OAuth2 (Gmail API / Microsoft Graph)
- **WhatsApp:** WhatsApp Business Cloud API
- **Message Queue:** Bull (Redis-based)
- **Monitoring:** Prometheus, Grafana

## Deployment Strategy

### Phase 1 (POC)
- Local development only
- No deployment needed
- Manual testing via CLI

### Phase 2+ (Production)
- **NestJS Control Plane:** Cloud deployment (Heroku/Railway/AWS)
- **MCP Server:** Deployed with Control Plane
- **Hermes Agent:** Deployed separately or co-located
- **PostgreSQL:** Managed database service
- **Redis:** For job queues and caching

## Scaling Considerations

### Phase 1
- Single user, single session
- No scaling needed

### Phase 2+
- Horizontal scaling of NestJS instances
- Session affinity or shared state via Redis
- Database connection pooling
- Rate limiting per user
- LLM request queuing
- Tool call caching where appropriate

## Error Handling

### Phase 1
- Basic error messages
- Console logging
- No persistence

### Phase 2+
- Structured error responses
- Full audit trail
- Retry logic with exponential backoff
- User-friendly error messages
- Alert on critical failures
- Dead letter queue for failed jobs
