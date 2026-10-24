/**
 * @file asset-hasher.test.ts
 * @layer Domain Test
 * @description Unit tests for asset-hasher (HU-3.5 / SPEC-03-06).
 *              Verifies SHA-256 deterministic hashes for buffers and strings, integrity verification, and case-insensitivity.
 */

import { describe, test, expect } from 'vitest';
import {
  computeSha256Buffer,
  computeSha256String,
  verifyAssetIntegrity,
} from '../../../apps/web/src/lib/pipelines/creative/asset-hasher';

describe('Domain: asset-hasher (HU-3.5 / SPEC-03-06)', () => {
  const testString = 'indie-sync-suite-creative-deliverable';
  // Known SHA-256 digest for 'indie-sync-suite-creative-deliverable'
  const expectedHash = 'c31ae7eb660dba7c6e7d43a492b548b785d6394775233ec2b86d5f5cf902484e';

  test('@spec REQ-HU-3.5-01: computes deterministic 64-character lowercase SHA-256 for text content', () => {
    // Act
    const hash = computeSha256String(testString);

    // Assert
    expect(hash).toHaveLength(64);
    expect(hash).toBe(expectedHash);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  test('@spec REQ-HU-3.5-02: computes matching SHA-256 hash for binary buffer representation', () => {
    // Arrange
    const buffer = Buffer.from(testString, 'utf8');

    // Act
    const hash = computeSha256Buffer(buffer);

    // Assert
    expect(hash).toBe(expectedHash);
  });

  test('@spec REQ-HU-3.5-03: verifies asset integrity with case-insensitive comparison', () => {
    // Act & Assert
    expect(verifyAssetIntegrity(testString, expectedHash)).toBe(true);
    expect(verifyAssetIntegrity(testString, expectedHash.toUpperCase())).toBe(true);
    expect(verifyAssetIntegrity(Buffer.from(testString), expectedHash)).toBe(true);
  });

  test('@spec REQ-HU-3.5-04: rejects tampered data and invalid digests', () => {
    // Arrange
    const tampered = 'indie-sync-suite-creative-deliverable-TAMPERED';

    // Act & Assert
    expect(verifyAssetIntegrity(tampered, expectedHash)).toBe(false);
    expect(verifyAssetIntegrity(testString, '0000000000000000000000000000000000000000000000000000000000000000')).toBe(false);
  });
});
