/**
 * @file key-masker.test.ts
 * @layer Domain Test
 * @description Unit tests for in-memory key masking, format validation, and SHA-256 fingerprint generation.
 */

import { describe, test, expect } from 'vitest';
import {
  maskApiKey,
  computeKeyFingerprint,
  validateKeyFormat,
} from '../../../apps/web/src/lib/pipelines/security/key-masker';

describe('Key Masker & In-Memory Perimeter', () => {
  describe('maskApiKey', () => {
    test('masks Anthropic keys preserving sk-ant- prefix and 4-character suffix', () => {
      const key = 'sk-ant-api03-abcdef1234567890wxyz';
      expect(maskApiKey(key)).toBe('sk-ant-...wxyz');
    });

    test('masks OpenAI project keys preserving sk-proj- prefix and 4-character suffix', () => {
      const key = 'sk-proj-xyz1234567890abcdefghijklmnopqrstuv';
      expect(maskApiKey(key)).toBe('sk-proj-...stuv');
    });

    test('masks standard OpenAI keys preserving sk- prefix and 4-character suffix', () => {
      const key = 'sk-1234567890abcdefghijklmnop';
      expect(maskApiKey(key)).toBe('sk-...mnop');
    });

    test('masks Groq keys preserving gsk_ prefix and 4-character suffix', () => {
      const key = 'gsk_1234567890abcdefghijklmnopqrstuv';
      expect(maskApiKey(key)).toBe('gsk_...stuv');
    });

    test('masks Google Gemini keys preserving AIzaSy prefix and 4-character suffix', () => {
      const key = 'AIzaSyABCDEF1234567890GHIJKLMN';
      expect(maskApiKey(key)).toBe('AIzaSy...KLMN');
    });

    test('masks short keys (<8 chars) with generic ***', () => {
      expect(maskApiKey('')).toBe('***');
      expect(maskApiKey('1234567')).toBe('***');
    });

    test('masks generic keys with ...suffix', () => {
      const key = 'my-custom-provider-secret-token-9999';
      expect(maskApiKey(key)).toBe('...9999');
    });
  });

  describe('computeKeyFingerprint', () => {
    test('generates deterministic SHA-256 hash without leaking plaintext key', () => {
      const key = 'sk-ant-test-secret-sample-key';
      const fp1 = computeKeyFingerprint(key);
      const fp2 = computeKeyFingerprint(key);

      expect(fp1).toBe(fp2);
      expect(fp1.length).toBe(64); // 32 bytes = 64 hex characters
      expect(fp1).not.toContain(key);
    });

    test('produces different hashes for different keys', () => {
      const fp1 = computeKeyFingerprint('key-a-12345678');
      const fp2 = computeKeyFingerprint('key-b-12345678');
      expect(fp1).not.toBe(fp2);
    });
  });

  describe('validateKeyFormat', () => {
    test('validates OpenAI key format', () => {
      expect(validateKeyFormat('openai', 'sk-proj-12345678901234567890')).toBe(true);
      expect(validateKeyFormat('openai', 'sk-12345678901234567890')).toBe(true);
      expect(validateKeyFormat('openai', 'invalid-key')).toBe(false);
      expect(validateKeyFormat('openai', 'sk-too-short')).toBe(false);
    });

    test('validates Anthropic key format', () => {
      expect(validateKeyFormat('anthropic', 'sk-ant-12345678901234567890')).toBe(true);
      expect(validateKeyFormat('anthropic', 'sk-proj-invalid')).toBe(false);
    });

    test('validates Google Gemini key format', () => {
      expect(validateKeyFormat('google', 'AIzaSy12345678901234567890')).toBe(true);
      expect(validateKeyFormat('google', 'invalid')).toBe(false);
    });

    test('validates Groq key format', () => {
      expect(validateKeyFormat('groq', 'gsk_12345678901234567890')).toBe(true);
      expect(validateKeyFormat('groq', 'invalid')).toBe(false);
    });
  });
});
