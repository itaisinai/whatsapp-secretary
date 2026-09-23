import { registerAs } from '@nestjs/config';

type Environment = Record<string, unknown>;

function requiredString(config: Environment, key: string): string {
  const value = config[key];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${key} is required`);
  }
  return value;
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
}

export interface WhatsAppConfig {
  webhookVerifyToken: string;
  appSecret: string;
  phoneNumberId: string;
  accessToken: string;
  graphApiVersion: string;
  testRecipient?: string;
  testMessageOverride?: string;
}

export interface HermesConfig {
  openaiApiKey: string;
  sessionId?: string;
  mcpServerPath?: string;
}

export const appConfig = registerAs('app', (): AppConfig => {
  const port = Number(process.env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }

  return {
    port,
    nodeEnv: process.env.NODE_ENV ?? 'development',
  };
});

export const whatsappConfig = registerAs('whatsapp', (): WhatsAppConfig => {
  return {
    webhookVerifyToken: requiredString(process.env, 'WHATSAPP_WEBHOOK_VERIFY_TOKEN'),
    appSecret: requiredString(process.env, 'WHATSAPP_APP_SECRET'),
    phoneNumberId: requiredString(process.env, 'WHATSAPP_PHONE_NUMBER_ID'),
    accessToken: requiredString(process.env, 'WHATSAPP_ACCESS_TOKEN'),
    graphApiVersion: process.env.WHATSAPP_GRAPH_API_VERSION ?? 'v26.0',
    testRecipient: process.env.WHATSAPP_TEST_RECIPIENT,
    testMessageOverride: process.env.WHATSAPP_TEST_MESSAGE_OVERRIDE,
  };
});

export const hermesConfig = registerAs('hermes', (): HermesConfig => {
  return {
    openaiApiKey: requiredString(process.env, 'OPENAI_API_KEY'),
    sessionId: process.env.HERMES_SESSION_ID,
    mcpServerPath: process.env.MCP_SERVER_PATH,
  };
});

// For backward compatibility with existing validation function used in tests
export function validateEnvironment(config: Environment): Environment {
  requiredString(config, 'WHATSAPP_WEBHOOK_VERIFY_TOKEN');
  requiredString(config, 'WHATSAPP_APP_SECRET');
  requiredString(config, 'WHATSAPP_PHONE_NUMBER_ID');
  requiredString(config, 'WHATSAPP_ACCESS_TOKEN');
  requiredString(config, 'OPENAI_API_KEY');

  const port = Number(config.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }

  const mcpServerPath = config.MCP_SERVER_PATH;
  if (typeof mcpServerPath === 'string' && mcpServerPath.trim() === '') {
    throw new Error('MCP_SERVER_PATH cannot be empty if provided');
  }

  return { ...config, PORT: port };
}
