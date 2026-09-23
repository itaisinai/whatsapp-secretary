#!/bin/bash

# WhatsApp Secretary - Hermes Setup Script
# This script configures Hermes Agent to use our MCP server

set -e

HERMES_CONFIG_DIR="$HOME/.hermes"
HERMES_CONFIG="$HERMES_CONFIG_DIR/config.yaml"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MCP_SERVER_PATH="$PROJECT_ROOT/packages/mcp-server/dist/mcp-index.js"

echo "🔧 Setting up Hermes Agent for WhatsApp Secretary"
echo ""

# Check if Hermes is installed
if ! command -v hermes &> /dev/null; then
    echo "❌ Hermes Agent is not installed."
    echo ""
    echo "Please install it first:"
    echo "  curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash"
    echo ""
    echo "Then run this script again."
    exit 1
fi

echo "✓ Hermes Agent is installed"

# Check if .env exists
if [ ! -f "$PROJECT_ROOT/.env" ]; then
    echo "❌ .env file not found"
    echo ""
    echo "Please create .env file from .env.example:"
    echo "  cp .env.example .env"
    echo "  # Then edit .env with your credentials"
    exit 1
fi

echo "✓ .env file found"

# Build the MCP server
echo ""
echo "📦 Building MCP server..."
cd "$PROJECT_ROOT"
pnpm build --filter @whatsapp-secretary/mcp-server

if [ ! -f "$MCP_SERVER_PATH" ]; then
    echo "❌ MCP server build failed - $MCP_SERVER_PATH not found"
    exit 1
fi

echo "✓ MCP server built successfully"

# Load environment variables
export $(cat "$PROJECT_ROOT/.env" | grep -v '^#' | xargs)

# Check required env vars (only for gmail/outlook, not mock)
if [ -z "$EMAIL_PROVIDER" ]; then
    echo "❌ Missing EMAIL_PROVIDER in .env"
    exit 1
fi

# For gmail/outlook, require credentials
if [ "$EMAIL_PROVIDER" != "mock" ]; then
    if [ -z "$EMAIL_ADDRESS" ] || [ -z "$EMAIL_PASSWORD" ]; then
        echo "❌ Missing email credentials in .env for provider: $EMAIL_PROVIDER"
        echo "  EMAIL_ADDRESS and EMAIL_PASSWORD are required for gmail/outlook"
        echo "  Or set EMAIL_PROVIDER=mock for testing without credentials"
        exit 1
    fi
fi

echo "✓ Environment variables configured"

# Create Hermes config directory if it doesn't exist
mkdir -p "$HERMES_CONFIG_DIR"

# Backup existing config if it exists
if [ -f "$HERMES_CONFIG" ]; then
    BACKUP_FILE="$HERMES_CONFIG.backup.$(date +%Y%m%d_%H%M%S)"
    cp "$HERMES_CONFIG" "$BACKUP_FILE"
    echo "✓ Backed up existing config to: $BACKUP_FILE"
fi

# Add MCP server to Hermes config
echo ""
echo "📝 Configuring Hermes to use WhatsApp Secretary MCP server..."

# Check if mcp_servers section exists
if [ -f "$HERMES_CONFIG" ] && grep -q "mcp_servers:" "$HERMES_CONFIG"; then
    echo "⚠️  mcp_servers section already exists in config.yaml"
    echo ""
    echo "Please manually add this to your $HERMES_CONFIG:"
    cat <<EOF

mcp_servers:
  whatsapp_secretary:
    command: "node"
    args: ["$MCP_SERVER_PATH"]
    env:
      EMAIL_PROVIDER: "$EMAIL_PROVIDER"
      EMAIL_ADDRESS: "$EMAIL_ADDRESS"
      EMAIL_PASSWORD: "$EMAIL_PASSWORD"
    tools:
      include: [search_emails]
EOF
else
    # Append to config
    cat <<EOF >> "$HERMES_CONFIG"

# WhatsApp Secretary MCP Server
mcp_servers:
  whatsapp_secretary:
    command: "node"
    args: ["$MCP_SERVER_PATH"]
    env:
      EMAIL_PROVIDER: "$EMAIL_PROVIDER"
      EMAIL_ADDRESS: "$EMAIL_ADDRESS"
      EMAIL_PASSWORD: "$EMAIL_PASSWORD"
    tools:
      include: [search_emails]
EOF
    echo "✓ Added WhatsApp Secretary to Hermes config"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start using WhatsApp Secretary with Hermes:"
echo "  1. Start Hermes: hermes"
echo "  2. Try a query in Hebrew:"
echo "     תראה לי את חמשת המיילים האחרונים"
echo "     אילו מיילים עדיין לא קראתי?"
echo ""
echo "The 'search_emails' tool will be available to Hermes Agent."
echo ""
