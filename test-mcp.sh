#!/bin/bash
# Test MCP Server directly

echo "Starting MCP Server..."
echo ""
echo "Send this to test listing tools:"
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
echo ""
echo "Or this to search emails:"
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"search_emails","arguments":{"limit":3}}}'
echo ""
echo "Type Ctrl+D when done."
echo ""

cd "$(dirname "$0")/packages/mcp-server"
node dist/mcp-index.js
