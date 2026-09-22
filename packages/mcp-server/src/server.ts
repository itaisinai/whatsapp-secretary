import type { ToolDefinition } from '@whatsapp-secretary/shared';
import { searchEmailsTool } from './tools/search-emails';

export class MCPServer {
  private tools: Map<string, ToolDefinition>;

  constructor() {
    this.tools = new Map();
    this.registerTool(searchEmailsTool);
  }

  registerTool(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
    console.log(`Registered tool: ${tool.name}`);
  }

  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  listTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  async start(port: number): Promise<void> {
    console.log(`MCP Server starting on port ${port}...`);
    // TODO: Implement MCP server HTTP/WebSocket endpoints
    // This will be implemented in the next PR (POC phase)
    console.log('MCP Server started successfully');
    console.log(`Available tools: ${Array.from(this.tools.keys()).join(', ')}`);
  }

  async stop(): Promise<void> {
    console.log('MCP Server stopping...');
    // TODO: Clean up connections
  }
}
