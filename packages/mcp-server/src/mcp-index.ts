#!/usr/bin/env node
import dotenv from 'dotenv';
import { WhatsAppSecretaryMCPServer } from './mcp-stdio-server';

// Load environment variables
dotenv.config();

const server = new WhatsAppSecretaryMCPServer();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.error('\n[MCP Server] Shutting down...');
  await server.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('\n[MCP Server] Shutting down...');
  await server.shutdown();
  process.exit(0);
});

// Start the server
(async () => {
  try {
    await server.initialize();
    await server.run();
  } catch (error) {
    console.error('[MCP Server] Failed to start:', error);
    process.exit(1);
  }
})();
