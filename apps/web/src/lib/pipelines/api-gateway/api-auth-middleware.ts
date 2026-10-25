/**
 * @file api-auth-middleware.ts
 * @layer Domain
 * @description Pure functions for Open REST API Gateway authentication:
 *              API key issuance (`iss_live_...`), SHA-256 hashing, Authorization Bearer parsing,
 *              and granular scope evaluation. Zero network I/O, zero classes.
 */

import { randomBytes, createHash } from 'node:crypto';
import { ApiKeyScope } from '../portal/portal-schemas';

export interface GeneratedApiKeyPair {
  rawKey: string;
  keyPrefix: string;
  keyHash: string;
}

/**
 * Computes deterministic SHA-256 hash of an API key secret for safe storage.
 *
 * @param rawKey - Plaintext API key
 * @returns Hex-encoded SHA-256 digest
 */
export function hashApiKey(rawKey: string): string {
  // Step 1: Hash raw key with SHA-256
  return createHash('sha256').update(rawKey).digest('hex');
}

/**
 * Generates a high-entropy API key with canonical `iss_live_` prefix and returns its hash pair.
 *
 * @returns GeneratedApiKeyPair containing the plaintext key, its prefix, and its hash
 */
export function generateRawApiKey(): GeneratedApiKeyPair {
  // Step 1: Generate 24 cryptographically secure random bytes
  const secret = randomBytes(24).toString('base64url');
  const rawKey = `iss_live_${secret}`;
  const keyPrefix = rawKey.slice(0, 16);

  // Step 2: Compute SHA-256 hash
  const keyHash = hashApiKey(rawKey);

  return {
    rawKey,
    keyPrefix,
    keyHash,
  };
}

/**
 * Extracts Bearer token string from an Authorization HTTP header.
 *
 * @param authHeader - Value of incoming Authorization header
 * @returns Token string or null if header is missing or malformed
 */
export function extractBearerToken(authHeader?: string | null): string | null {
  // Step 1: Check header presence
  if (!authHeader || typeof authHeader !== 'string') {
    return null;
  }

  // Step 2: Extract Bearer scheme value
  const parts = authHeader.trim().split(/\s+/);
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1];
  }

  return null;
}

/**
 * Evaluates whether granted scopes satisfy the required permission scope.
 *
 * @param grantedScopes - Array of scopes assigned to the active API key
 * @param requiredScope - Target scope required for the requested operation
 * @returns True if granted scopes permit execution
 */
export function hasRequiredScope(
  grantedScopes: ApiKeyScope[],
  requiredScope: ApiKeyScope
): boolean {
  // Step 1: FULL_ACCESS grants universal authorization
  if (grantedScopes.includes('FULL_ACCESS')) {
    return true;
  }

  // Step 2: Check for specific matching scope
  return grantedScopes.includes(requiredScope);
}
