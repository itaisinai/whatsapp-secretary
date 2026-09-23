import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { HermesConfig, EmailConfig } from '../../config/environment.config';
import type { SearchEmailsParams, SearchEmailsResult } from '@whatsapp-secretary/shared';

interface HermesSession {
  id: string;
  createdAt: Date;
  lastActivity: Date;
  messageCount: number;
}

@Injectable()
export class HermesService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(HermesService.name);
  private sessions = new Map<string, HermesSession>();
  private hermesConfig: HermesConfig;
  private emailConfig: EmailConfig;
  private initialized = false;

  constructor(private configService: ConfigService) {
    this.hermesConfig = this.configService.get<HermesConfig>('hermes')!;
    this.emailConfig = this.configService.get<EmailConfig>('email')!;
  }

  async onModuleInit() {
    await this.initialize();
  }

  async onModuleDestroy() {
    await this.shutdown();
  }

  private async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.logger.log('Initializing Hermes Agent...');
    this.logger.log(`LLM Provider: ${this.hermesConfig.llmProvider}`);
    this.logger.log(`LLM Model: ${this.hermesConfig.llmModel}`);
    this.logger.log(`Email Provider: ${this.emailConfig.provider}`);
    this.logger.log(`Email Account: ${this.emailConfig.address}`);

    // TODO: Initialize Hermes Agent connection
    // This will be implemented when Hermes integration is complete
    // - Connect to Hermes Agent runtime
    // - Configure LLM provider
    // - Register MCP tools via existing MCP server
    // - Set up session management
    // For now, this is a skeleton that accepts the configuration

    this.initialized = true;
    this.logger.log('Hermes Agent initialized successfully');
  }

  async sendMessage(
    message: string,
    sessionId: string = this.hermesConfig.sessionId,
    metadata?: Record<string, unknown>,
  ): Promise<{
    response: string;
    sources?: string[];
    toolsUsed?: string[];
  }> {
    if (!this.initialized) {
      throw new Error('HermesService not initialized');
    }

    // Create or update session
    this.updateSession(sessionId);

    this.logger.debug(`Processing message in session ${sessionId}: "${message}"`);

    // TODO: Send message to Hermes Agent and get response
    // This will be implemented when Hermes integration is complete
    // - Send user message to Hermes Agent
    // - Hermes decides whether to use tools or respond directly
    // - If tool is needed, Hermes calls search_emails via MCP
    // - Return formatted response with sources
    //
    // For Phase 2, this is where WhatsApp messages will be processed
    // The flow will be: WhatsApp → NestJS → Hermes → MCP → Email Provider

    return {
      response: `[Headless Mode - POC Not Implemented Yet] Received: ${message}`,
      sources: [],
      toolsUsed: [],
    };
  }

  async searchEmails(params: SearchEmailsParams): Promise<SearchEmailsResult> {
    if (!this.initialized) {
      throw new Error('HermesService not initialized');
    }

    // TODO: Direct tool call for testing
    // This will call the search_emails tool directly via MCP
    this.logger.debug('Direct email search:', params);

    return {
      emails: [],
      total: 0,
      hasMore: false,
    };
  }

  async testConnection(): Promise<{
    hermes: boolean;
    email: boolean;
    mcp: boolean;
  }> {
    if (!this.initialized) {
      throw new Error('HermesService not initialized');
    }

    this.logger.log('Testing connections...');

    // TODO: Test actual connections when implemented
    // For now, return mock status
    return {
      hermes: true,
      email: false, // Not implemented yet
      mcp: false, // Not implemented yet
    };
  }

  getSession(sessionId: string): HermesSession | undefined {
    return this.sessions.get(sessionId);
  }

  listSessions(): HermesSession[] {
    return Array.from(this.sessions.values());
  }

  private updateSession(sessionId: string): void {
    const existing = this.sessions.get(sessionId);
    if (existing) {
      existing.lastActivity = new Date();
      existing.messageCount++;
    } else {
      this.sessions.set(sessionId, {
        id: sessionId,
        createdAt: new Date(),
        lastActivity: new Date(),
        messageCount: 1,
      });
    }
  }

  private async shutdown(): Promise<void> {
    this.logger.log('Shutting down Hermes Agent...');
    // TODO: Clean up connections and sessions
    this.sessions.clear();
    this.initialized = false;
  }
}
