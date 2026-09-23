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
}

// TODO Phase 2: Add HermesConfig when integration is implemented
// export interface HermesConfig {
//   enabled: boolean;
//   command: string;
//   timeoutMs: number;
// }

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
  };
});

// For backward compatibility with existing validation function used in tests
export function validateEnvironment(config: Environment): Environment {
  requiredString(config, 'WHATSAPP_WEBHOOK_VERIFY_TOKEN');
  requiredString(config, 'WHATSAPP_APP_SECRET');

  const port = Number(config.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }

  return { ...config, PORT: port };
}
