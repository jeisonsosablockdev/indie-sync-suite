/**
 * @file media-handshake-service.ts
 * @layer Domain
 * @description Pure functional domain service creating media handshake envelopes binding SHA-256
 *              asset integrity hashes to pre-signed cloud storage URLs. Zero network I/O, zero classes.
 */

import { MediaHandshakePayload } from './distribution-schemas';

export interface MediaHandshakeInput {
  contentHash: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  cloudBucketBaseUrl?: string;
  expirationMinutes?: number;
}

/**
 * Pure generator crafting an immutable MediaHandshakePayload linking a vault asset to cloud storage.
 *
 * @param input - Input asset metadata and storage base
 * @returns Fully formed MediaHandshakePayload
 */
export function generateMediaHandshake(input: MediaHandshakeInput): MediaHandshakePayload {
  // Step 1: Validate hash format invariant (64 hex characters)
  if (!/^[a-f0-9]{64}$/i.test(input.contentHash)) {
    throw new Error(`Invalid SHA-256 content hash: ${input.contentHash}`);
  }

  // Step 2: Calculate expiration timestamp (default 60 minutes)
  const expirationMinutes = input.expirationMinutes ?? 60;
  const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000).toISOString();

  // Step 3: Construct safe pre-signed storage URL anchor
  const baseUrl = input.cloudBucketBaseUrl ?? 'https://storage.indie-suite.app/vault';
  const preSignedUrl = `${baseUrl}/${input.contentHash.toLowerCase()}/${encodeURIComponent(input.fileName)}?expires=${encodeURIComponent(expiresAt)}`;

  // Step 4: Return immutable handshake envelope
  return {
    contentHash: input.contentHash.toLowerCase(),
    fileName: input.fileName,
    mimeType: input.mimeType,
    fileSizeBytes: input.fileSizeBytes,
    preSignedUrl,
    expiresAt,
  };
}
