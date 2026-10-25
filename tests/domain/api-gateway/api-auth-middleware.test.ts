/**
 * @file api-auth-middleware.test.ts
 * @layer Domain Test
 * @description Unit tests for Open REST API Gateway authentication functions (HU-6.2 / SPEC-06-02).
 *              Verifies key generation format, SHA-256 hashing, Authorization Bearer parsing,
 *              and granular scope evaluation.
 */

import { describe, test, expect } from 'vitest';
import {
  hashApiKey,
  generateRawApiKey,
  extractBearerToken,
  hasRequiredScope,
} from '../../../apps/web/src/lib/pipelines/api-gateway/api-auth-middleware';

describe('Domain: ApiAuthMiddleware (SPEC-06-02)', () => {
  describe('hashApiKey', () => {
    test('hashes raw key into 64-char hex SHA-256 digest', () => {
      const hash1 = hashApiKey('iss_live_sample_token_123');
      const hash2 = hashApiKey('iss_live_sample_token_123');

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });
  });

  describe('generateRawApiKey', () => {
    test('generates valid key pair with iss_live_ prefix and matching hash', () => {
      const pair = generateRawApiKey();

      expect(pair.rawKey).toMatch(/^iss_live_[A-Za-z0-9_-]+/);
      expect(pair.keyPrefix).toBe(pair.rawKey.slice(0, 16));
      expect(pair.keyHash).toBe(hashApiKey(pair.rawKey));
      expect(pair.keyHash).toHaveLength(64);
    });

    test('generates distinct cryptographic keys on consecutive calls', () => {
      const k1 = generateRawApiKey();
      const k2 = generateRawApiKey();

      expect(k1.rawKey).not.toBe(k2.rawKey);
      expect(k1.keyHash).not.toBe(k2.keyHash);
    });
  });

  describe('extractBearerToken', () => {
    test('extracts token from standard Bearer Authorization header', () => {
      expect(extractBearerToken('Bearer my-secret-token-123')).toBe('my-secret-token-123');
      expect(extractBearerToken('bearer my-secret-token-123')).toBe('my-secret-token-123');
      expect(extractBearerToken('Bearer   spaced-token  ')).toBe('spaced-token');
    });

    test('returns null for non-Bearer schemes or empty values', () => {
      expect(extractBearerToken('Basic dXNlcjpwYXNz')).toBeNull();
      expect(extractBearerToken('Token abc')).toBeNull();
      expect(extractBearerToken('my-token-without-scheme')).toBeNull();
      expect(extractBearerToken('')).toBeNull();
      expect(extractBearerToken(null)).toBeNull();
      expect(extractBearerToken(undefined)).toBeNull();
    });
  });

  describe('hasRequiredScope', () => {
    test('authorizes any scope when FULL_ACCESS is granted', () => {
      expect(hasRequiredScope(['FULL_ACCESS'], 'READ_RELEASES')).toBe(true);
      expect(hasRequiredScope(['FULL_ACCESS'], 'WRITE_TASKS')).toBe(true);
      expect(hasRequiredScope(['FULL_ACCESS'], 'READ_METRICS')).toBe(true);
    });

    test('authorizes when exact required scope is granted', () => {
      expect(hasRequiredScope(['READ_RELEASES', 'READ_METRICS'], 'READ_RELEASES')).toBe(true);
      expect(hasRequiredScope(['READ_RELEASES', 'READ_METRICS'], 'READ_METRICS')).toBe(true);
    });

    test('denies authorization when required scope is absent', () => {
      expect(hasRequiredScope(['READ_RELEASES'], 'WRITE_TASKS')).toBe(false);
      expect(hasRequiredScope(['READ_METRICS'], 'FULL_ACCESS')).toBe(false);
      expect(hasRequiredScope([], 'READ_RELEASES')).toBe(false);
    });
  });
});
