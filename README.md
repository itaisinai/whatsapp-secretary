# WhatsApp Secretary

AI personal assistant powered by Hermes Agent, providing intelligent email search and management through natural language.

## Architecture

This is a monorepo containing:

- **apps/hermes-controller**: Main application controlling the Hermes Agent integration
- **packages/mcp-server**: MCP (Model Context Protocol) server providing tools for email search
- **packages/shared**: Shared types, utilities, and configurations

## Development Phases

### Phase 1 (POC): CLI-based Email Search
- Hermes Agent running locally
- Email search tool with read-only access
- CLI interface for testing
- Support for Hebrew natural language queries

### Phase 2: WhatsApp Integration
- WhatsApp Business Cloud API
- NestJS Control Plane
- Session management
- Audit logging

### Phase 3: Extended Capabilities
- Multi-system integration (Monday, Drive, Connecteam)
- Scheduled reports
- Approval workflows
- Write operations

## Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- Email account (Gmail or Outlook) with app password

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Configure your `.env` file with:
   - LLM provider API key
   - Email credentials
   - Other configuration values

## Getting Started (POC)

### 1. Install Hermes Agent

```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
source ~/.bashrc  # or ~/.zshrc
```

### 2. Setup the Project

```bash
# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
# See docs/POC_SETUP.md for detailed instructions
nano .env
```

### 3. Configure Hermes Integration

```bash
# Run the setup script
./scripts/setup-hermes.sh
```

### 4. Start Using

```bash
# Start Hermes
hermes

# Try Hebrew queries:
# תראה לי את חמשת המיילים האחרונים
# אילו מיילים עדיין לא קראתי?
```

📖 **Full usage guide:** [docs/POC_USAGE.md](./docs/POC_USAGE.md)

## Development

```bash
# Build all packages
pnpm build

# Build MCP server only
pnpm build --filter @whatsapp-secretary/mcp-server

# Test MCP server directly
cd packages/mcp-server && pnpm mcp

# Run linter
pnpm lint

# Format code
pnpm format
```

## Project Structure

```
whatsapp-secretary/
├── apps/
│   └── hermes-controller/     # Main Hermes Agent controller
├── packages/
│   ├── mcp-server/            # MCP server for tools
│   └── shared/                # Shared utilities and types
├── .env.example               # Environment variables template
└── package.json               # Root package configuration
```

## Tools

### search_emails
Search and retrieve emails with advanced filtering:
- **sender**: Filter by sender name or email
- **text**: Search in subject or content
- **receivedAfter/receivedBefore**: Date range filter
- **unreadOnly**: Show only unread emails
- **limit**: Number of results (with max limit)

Returns: email ID, thread ID, sender, subject, date, unread status, snippet, and source reference.

## Security

- All API keys are stored in `.env` (never committed)
- Email access is read-only for POC
- Tools are allowlisted per scenario
- No terminal, filesystem, or browser access for Hermes

## License

Private - B-Fresh Tech