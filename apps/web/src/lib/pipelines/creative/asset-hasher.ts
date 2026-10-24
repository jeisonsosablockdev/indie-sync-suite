/**
 * @file asset-hasher.ts
 * @layer Domain
 * @description Pure functional cryptographic SHA-256 hashing engine for creative deliverables,
 *              guaranteeing asset immutability and tamper detection. Zero side-effects, zero classes.
 */

import { createHash } from 'node:crypto';

/**
 * Computes the deterministic SHA-256 hexadecimal hash from a binary buffer.
 *
 * @param buffer - Binary asset buffer or Uint8Array
 * @returns 64-character lowercase hex SHA-256 digest
 */
export function computeSha256Buffer(buffer: Buffer | Uint8Array): string {
  // Step 1: Initialize SHA-256 digest
  const hash = createHash('sha256');

  // Step 2: Feed binary data
  hash.update(buffer);

  // Step 3: Return hex string
  return hash.digest('hex').toLowerCase();
}

/**
 * Computes the deterministic SHA-256 hexadecimal hash from a string (e.g. social copy or canonical JSON).
 *
 * @param content - UTF-8 text string
 * @returns 64-character lowercase hex SHA-256 digest
 */
export function computeSha256String(content: string): string {
  // Step 1: Initialize hash
  const hash = createHash('sha256');

  // Step 2: Feed UTF-8 text
  hash.update(content, 'utf8');

  // Step 3: Digest to hex
  return hash.digest('hex').toLowerCase();
}

/**
 * Verifies if the computed hash of the payload matches the expected hash.
 *
 * @param data - Binary buffer or string payload
 * @param expectedHash - Expected 64-character hex hash
 * @returns True if hashes match exactly
 */
export function verifyAssetIntegrity(
  data: Buffer | Uint8Array | string,
  expectedHash: string
): boolean {
  // Step 1: Compute hash based on input type
  const actualHash =
    typeof data === 'string' ? computeSha256String(data) : computeSha256Buffer(data);

  // Step 2: Case-insensitive hex comparison
  return actualHash.toLowerCase() === expectedHash.trim().toLowerCase();
}
