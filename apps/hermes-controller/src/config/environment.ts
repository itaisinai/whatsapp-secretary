export interface Environment {
  llmProvider: string;
  llmApiKey: string;
  llmModel: string;
  emailProvider: 'gmail' | 'outlook';
  emailAddress: string;
  emailPassword: string;
  hermesApiUrl: string;
  hermesSessionId: string;
  mcpServerPort: number;
}

export function validateEnvironment(): Environment {
  const required = [
    'LLM_PROVIDER',
    'LLM_API_KEY',
    'LLM_MODEL',
    'EMAIL_PROVIDER',
    'EMAIL_ADDRESS',
    'EMAIL_PASSWORD',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Please copy .env.example to .env and fill in the values.'
    );
  }

  const emailProvider = process.env.EMAIL_PROVIDER?.toLowerCase();
  if (emailProvider !== 'gmail' && emailProvider !== 'outlook') {
    throw new Error('EMAIL_PROVIDER must be either "gmail" or "outlook"');
  }

  return {
    llmProvider: process.env.LLM_PROVIDER!,
    llmApiKey: process.env.LLM_API_KEY!,
    llmModel: process.env.LLM_MODEL!,
    emailProvider: emailProvider as 'gmail' | 'outlook',
    emailAddress: process.env.EMAIL_ADDRESS!,
    emailPassword: process.env.EMAIL_PASSWORD!,
    hermesApiUrl: process.env.HERMES_API_URL || 'http://localhost:3000',
    hermesSessionId: process.env.HERMES_SESSION_ID || 'poc-session',
    mcpServerPort: parseInt(process.env.MCP_SERVER_PORT || '3001', 10),
  };
}
