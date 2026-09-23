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

## Getting Started - WhatsApp POC

### Prerequisites

1. **Install Hermes Agent**
   ```bash
   curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
   source ~/.bashrc  # or ~/.zshrc
   ```

2. **Meta WhatsApp Business API Setup**
   - Create a Meta Developer account
   - Set up WhatsApp Business API
   - Get test phone number and access token
   - Add your personal number as test recipient
   
   📖 **See:** [docs/POC_WHATSAPP.md](./docs/POC_WHATSAPP.md) for complete setup

### Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Build packages
pnpm build

# 3. Configure environment
cp .env.example .env
# Edit .env with your WhatsApp credentials and MCP server path

# 4. Start the POC server
pnpm dev:poc

# 5. In another terminal, start ngrok
ngrok http 3000

# 6. Configure Meta webhook with ngrok URL
# 7. Test with Meta Dashboard → Send test message
# 8. Check your WhatsApp for the response!
```

📖 **Full POC guide:** [docs/POC_WHATSAPP.md](./docs/POC_WHATSAPP.md)

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