import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { searchEmailsTool } from './tools/search-emails';
import { GmailProvider } from './providers/gmail-provider';
import { OutlookProvider } from './providers/outlook-provider';
import { EmailProvider } from './providers/email-provider';
import type { SearchEmailsParams } from '@whatsapp-secretary/shared';

export class WhatsAppSecretaryMCPServer {
  private server: Server;
  private emailProvider: EmailProvider | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'whatsapp-secretary-mcp',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // Handle list_tools request
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools: Tool[] = [
        {
          name: searchEmailsTool.name,
          description: searchEmailsTool.description,
          inputSchema: {
            type: 'object',
            properties: this.convertParametersToJsonSchema(searchEmailsTool.parameters),
            required: searchEmailsTool.required || [],
          },
        },
      ];

      return { tools };
    });

    // Handle call_tool request
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (name === 'search_emails') {
        return await this.handleSearchEmails(args as SearchEmailsParams);
      }

      throw new Error(`Unknown tool: ${name}`);
    });
  }

  private convertParametersToJsonSchema(parameters: Record<string, any>): Record<string, any> {
    const schema: Record<string, any> = {};

    for (const [key, param] of Object.entries(parameters)) {
      schema[key] = {
        type: param.type === 'date' ? 'string' : param.type,
        description: param.description,
      };

      if (param.enum) {
        schema[key].enum = param.enum;
      }
      if (param.default !== undefined) {
        schema[key].default = param.default;
      }
      if (param.minimum !== undefined) {
        schema[key].minimum = param.minimum;
      }
      if (param.maximum !== undefined) {
        schema[key].maximum = param.maximum;
      }
      if (param.type === 'date') {
        schema[key].format = 'date-time';
      }
    }

    return schema;
  }

  private async handleSearchEmails(params: SearchEmailsParams) {
    try {
      if (!this.emailProvider) {
        throw new Error('Email provider not initialized');
      }

      const result = await this.emailProvider.searchEmails(params);

      // Format results for MCP response
      const content = [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              data: result,
              summary: `Found ${result.total} email(s). Showing ${result.emails.length} result(s).`,
            },
            null,
            2
          ),
        },
      ];

      return { content };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                error: errorMessage,
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  }

  async initialize(): Promise<void> {
    const emailProvider = process.env.EMAIL_PROVIDER?.toLowerCase();
    const emailAddress = process.env.EMAIL_ADDRESS;
    const emailPassword = process.env.EMAIL_PASSWORD;

    if (!emailProvider || !emailAddress || !emailPassword) {
      throw new Error(
        'Missing required environment variables: EMAIL_PROVIDER, EMAIL_ADDRESS, EMAIL_PASSWORD'
      );
    }

    if (emailProvider === 'gmail') {
      this.emailProvider = new GmailProvider({
        email: emailAddress,
        password: emailPassword,
      });
    } else if (emailProvider === 'outlook') {
      this.emailProvider = new OutlookProvider({
        email: emailAddress,
        password: emailPassword,
      });
    } else {
      throw new Error(`Unsupported email provider: ${emailProvider}`);
    }

    await this.emailProvider.initialize();
    console.error('[MCP Server] Email provider initialized successfully');
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('[MCP Server] WhatsApp Secretary MCP Server running on stdio');
  }

  async shutdown(): Promise<void> {
    if (this.emailProvider) {
      await this.emailProvider.disconnect();
    }
    await this.server.close();
  }
}
