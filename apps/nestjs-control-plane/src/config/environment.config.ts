import { registerAs } from '@nestjs/config';

export interface AppConfig {
  port: number;
  nodeEnv: string;
}

export interface HermesConfig {
  llmProvider: 'openai' | 'anthropic';
  llmApiKey: string;
  llmModel: string;
  sessionId: string;
}

export interface EmailConfig {
  provider: 'gmail' | 'outlook';
  address: string;
  password: string;
}

export const appConfig = registerAs('app', (): AppConfig => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
}));

export const hermesConfig = registerAs('hermes', (): HermesConfig => {
  const llmProvider = process.env.LLM_PROVIDER?.toLowerCase();
  if (llmProvider !== 'openai' && llmProvider !== 'anthropic') {
    throw new Error('LLM_PROVIDER must be "openai" or "anthropic"');
  }

  if (!process.env.LLM_API_KEY) {
    throw new Error('LLM_API_KEY is required');
  }

  if (!process.env.LLM_MODEL) {
    throw new Error('LLM_MODEL is required');
  }

  return {
    llmProvider,
    llmApiKey: process.env.LLM_API_KEY,
    llmModel: process.env.LLM_MODEL,
    sessionId: process.env.HERMES_SESSION_ID || 'default',
  };
});

export const emailConfig = registerAs('email', (): EmailConfig => {
  const provider = process.env.EMAIL_PROVIDER?.toLowerCase();
  if (provider !== 'gmail' && provider !== 'outlook') {
    throw new Error('EMAIL_PROVIDER must be "gmail" or "outlook"');
  }

  if (!process.env.EMAIL_ADDRESS) {
    throw new Error('EMAIL_ADDRESS is required');
  }

  if (!process.env.EMAIL_PASSWORD) {
    throw new Error('EMAIL_PASSWORD is required (use app password, not regular password)');
  }

  return {
    provider,
    address: process.env.EMAIL_ADDRESS,
    password: process.env.EMAIL_PASSWORD,
  };
});
