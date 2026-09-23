import { createHmac, timingSafeEqual } from 'node:crypto';

const SIGNATURE_PREFIX = 'sha256=';

export function createMetaSignature(rawBody: Buffer, appSecret: string): string {
  return `${SIGNATURE_PREFIX}${createHmac('sha256', appSecret).update(rawBody).digest('hex')}`;
}

export function verifyMetaSignature(
  rawBody: Buffer | undefined,
  signature: string | undefined,
  appSecret: string,
): boolean {
  if (!rawBody || !signature || !signature.startsWith(SIGNATURE_PREFIX)) return false;
  const expected = Buffer.from(createMetaSignature(rawBody, appSecret));
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
