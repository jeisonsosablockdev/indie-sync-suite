/**
 * @file media-handshake-service.test.ts
 * @layer Domain Test
 * @description Unit tests for media-handshake-service (HU-4.1 / SPEC-04-02).
 *              Verifies SHA-256 binding, pre-signed URL construction, and expiration calculation.
 */

import { describe, test, expect } from 'vitest';
import {
  generateMediaHandshake,
  MediaHandshakeInput,
} from '../../../apps/web/src/lib/pipelines/distribution/media-handshake-service';

describe('Domain: media-handshake-service (HU-4.1 / SPEC-04-02)', () => {
  const validHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

  const baseInput: MediaHandshakeInput = {
    contentHash: validHash,
    fileName: 'master-cover-3000px.png',
    mimeType: 'image/png',
    fileSizeBytes: 4194304,
  };

  test('@spec REQ-HU-4.1-03: generates immutable media handshake payload with pre-signed URL', () => {
    // Act
    const payload = generateMediaHandshake(baseInput);

    // Assert
    expect(payload.contentHash).toBe(validHash.toLowerCase());
    expect(payload.fileName).toBe('master-cover-3000px.png');
    expect(payload.mimeType).toBe('image/png');
    expect(payload.fileSizeBytes).toBe(4194304);
    expect(payload.preSignedUrl).toContain(validHash);
    expect(payload.preSignedUrl).toContain('master-cover-3000px.png');
    expect(payload.preSignedUrl).toContain('expires=');
    expect(new Date(payload.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  test('@spec REQ-HU-4.1-04: supports custom bucket base URL and expiration window', () => {
    // Arrange
    const input: MediaHandshakeInput = {
      ...baseInput,
      cloudBucketBaseUrl: 'https://r2.postiz-cloud.internal/music-vault',
      expirationMinutes: 120,
    };

    // Act
    const payload = generateMediaHandshake(input);

    // Assert
    expect(payload.preSignedUrl).toContain('https://r2.postiz-cloud.internal/music-vault');
    const expectedApproxExp = Date.now() + 120 * 60 * 1000;
    const actualExp = new Date(payload.expiresAt).getTime();
    expect(Math.abs(actualExp - expectedApproxExp)).toBeLessThan(5000); // within 5s
  });

  test('@spec REQ-HU-4.1-05: rejects invalid SHA-256 hashes with descriptive error', () => {
    // Invalid hash
    expect(() =>
      generateMediaHandshake({
        ...baseInput,
        contentHash: 'not-a-valid-sha-256-hash',
      })
    ).toThrow(/Invalid SHA-256/);

    // Short hash
    expect(() =>
      generateMediaHandshake({
        ...baseInput,
        contentHash: 'abc123',
      })
    ).toThrow(/Invalid SHA-256/);
  });
});
