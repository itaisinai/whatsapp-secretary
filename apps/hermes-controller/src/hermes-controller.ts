import { Environment } from './config/environment';
import type { SearchEmailsParams, SearchEmailsResult } from '@whatsapp-secretary/shared';

export class HermesController {
  private env: Environment;
  private sessionId: string;
  private initialized = false;

  constructor(env: Environment) {
    this.env = env;
    this.sessionId = env.hermesSessionId;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.log('Initializing Hermes Agent...');
    console.log(`LLM Provider: ${this.env.llmProvider}`);
    console.log(`LLM Model: ${this.env.llmModel}`);
    console.log(`Email Provider: ${this.env.emailProvider}`);
    console.log(`Email Account: ${this.env.emailAddress}`);
    console.log(`Session ID: ${this.sessionId}`);

    // TODO: Initialize Hermes Agent connection
    // This will be implemented in the next PR (POC phase)
    // - Connect to Hermes Agent API
    // - Configure LLM provider
    // - Register MCP tools (search_emails)
    // - Set up session management

    this.initialized = true;
  }

  async testConnection(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    // TODO: Test Hermes Agent connection
    // This will be implemented in the next PR
    console.log('Testing connection to Hermes Agent...');
    console.log('Testing email provider connection...');
  }

  async sendMessage(message: string): Promise<string> {
    if (!this.initialized) {
      throw new Error('HermesController not initialized. Call initialize() first.');
    }

    // TODO: Send message to Hermes Agent and get response
    // This will be implemented in the next PR (POC phase)
    // - Send user message to Hermes Agent
    // - Hermes decides whether to use tools or respond directly
    // - If tool is needed, Hermes calls search_emails via MCP
    // - Return formatted response with sources

    return `[POC Not Implemented Yet] Received: ${message}`;
  }

  async searchEmails(params: SearchEmailsParams): Promise<SearchEmailsResult> {
    if (!this.initialized) {
      throw new Error('HermesController not initialized. Call initialize() first.');
    }

    // TODO: Direct tool call for testing
    // This will be implemented in the next PR
    console.log('Search params:', params);

    return {
      emails: [],
      total: 0,
      hasMore: false,
    };
  }

  getSessionId(): string {
    return this.sessionId;
  }

  async shutdown(): Promise<void> {
    console.log('Shutting down Hermes Agent...');
    // TODO: Clean up connections and sessions
    this.initialized = false;
  }
}
