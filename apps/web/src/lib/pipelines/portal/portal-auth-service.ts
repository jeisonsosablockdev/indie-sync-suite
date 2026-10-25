/**
 * @file portal-auth-service.ts
 * @layer Domain
 * @description Pure cryptographic utilities for Artist Portal Magic Links:
 *              HMAC-SHA256 token signing, signature verification, expiration checks, and token hashing.
 *              Zero network I/O, zero classes.
 */

import { createHmac, createHash } from 'node:crypto';
import {
  MagicLinkTokenPayload,
  MagicLinkTokenPayloadSchema,
} from './portal-schemas';

/**
 * Computes SHA-256 hash of a string for secure database storage.
 *
 * @param token - Raw token string to hash
 * @returns Hex-encoded SHA-256 digest
 */
export function hashToken(token: string): string {
  // Step 1: Hash token deterministically with SHA-256
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Encodes and signs a MagicLinkTokenPayload into a URL-safe compact token string.
 *
 * @param payload - Validated token payload
 * @param secret - HMAC secret key
 * @returns Compact URL-safe token format (base64urlPayload.signature)
 */
export function signMagicLinkPayload(
  payload: MagicLinkTokenPayload,
  secret: string
): string {
  // Step 1: Validate payload schema
  const parsed = MagicLinkTokenPayloadSchema.parse(payload);

  // Step 2: Base64URL encode payload JSON
  const payloadBase64 = Buffer.from(JSON.stringify(parsed)).toString('base64url');

  // Step 3: Compute HMAC-SHA256 signature
  const signature = createHmac('sha256', secret)
    .update(payloadBase64)
    .digest('base64url');

  // Step 4: Return composite compact token
  return `${payloadBase64}.${signature}`;
}

/**
 * Verifies the integrity and authenticity of a signed Magic Link token.
 *
 * @param rawToken - Signed compact token string
 * @param secret - HMAC secret key
 * @returns Verified MagicLinkTokenPayload or null if corrupted/tampered
 */
export function verifyMagicLinkToken(
  rawToken: string,
  secret: string
): MagicLinkTokenPayload | null {
  // Step 1: Split token into payload and signature parts
  const parts = rawToken.split('.');
  if (parts.length !== 2) {
    return null;
  }

  const [payloadBase64, signature] = parts;

  // Step 2: Recompute signature and compare
  const expectedSignature = createHmac('sha256', secret)
    .update(payloadBase64)
    .digest('base64url');

  if (signature !== expectedSignature) {
    return null;
  }

  // Step 3: Decode and parse payload JSON
  try {
    const jsonStr = Buffer.from(payloadBase64, 'base64url').toString('utf8');
    const rawObj = JSON.parse(jsonStr) as unknown;
    const validated = MagicLinkTokenPayloadSchema.parse(rawObj);

    // Step 4: Check expiration timestamp
    const nowEpochSeconds = Math.floor(Date.now() / 1000);
    if (validated.exp <= nowEpochSeconds) {
      return null;
    }

    return validated;
  } catch {
    return null;
  }
}
