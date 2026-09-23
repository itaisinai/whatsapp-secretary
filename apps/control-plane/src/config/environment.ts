type Environment = Record<string, unknown>;

function requiredString(config: Environment, key: string): string {
  const value = config[key];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${key} is required`);
  }
  return value;
}

export function validateEnvironment(config: Environment): Environment {
  requiredString(config, 'WHATSAPP_WEBHOOK_VERIFY_TOKEN');
  requiredString(config, 'WHATSAPP_APP_SECRET');

  const port = Number(config.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }

  return { ...config, PORT: port };
}
