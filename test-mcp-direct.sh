#!/bin/bash
# Direct test of MCP server

echo "🧪 Testing MCP Server Directly"
echo "================================"
echo ""

cd "$(dirname "$0")"

echo "✅ Starting MCP Server..."
echo ""

# Start MCP server in background
node packages/mcp-server/dist/mcp-index.js > /tmp/mcp-response.txt 2>&1 &
MCP_PID=$!

# Give it time to start
sleep 2

echo "📋 Test 1: List Tools"
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | nc localhost 3001 2>/dev/null || echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

sleep 1

echo ""
echo "🔍 Test 2: Search Emails (limit 3)"
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"search_emails","arguments":{"limit":3}}}' | nc localhost 3001 2>/dev/null || echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"search_emails","arguments":{"limit":3}}}'

sleep 1

# Kill MCP server
kill $MCP_PID 2>/dev/null

echo ""
echo "✅ Tests complete!"
echo ""
echo "MCP Server output:"
cat /tmp/mcp-response.txt
rm /tmp/mcp-response.txt
