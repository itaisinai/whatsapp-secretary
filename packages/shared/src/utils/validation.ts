export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function sanitizeString(str: string): string {
  return str.trim().replace(/\s+/g, ' ');
}

export function validateLimit(limit: number | undefined, defaultLimit: number, maxLimit: number): number {
  if (limit === undefined) {
    return defaultLimit;
  }

  if (typeof limit !== 'number' || limit < 1) {
    return defaultLimit;
  }

  return Math.min(limit, maxLimit);
}
