/**
 * @file crypto-fallback.test.ts
 * @layer Infrastructure Test
 * @description Comprehensive unit tests for AES-256-GCM encryption fallback and BYOK_MASTER_KEY support.
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  encryptSecret,
  decryptSecret,
  getMasterKey,
  CryptoFallbackStorage,
} from '../../../apps/web/src/lib/infrastructure/security/crypto-fallback';

describe('AES-256-GCM Crypto Fallback', () => {
  const originalMasterKey = process.env.BYOK_MASTER_KEY;
  const originalAppKey = process.env.APP_ENCRYPTION_KEY;
  let testStoragePath: string;

  beforeEach(() => {
    delete process.env.BYOK_MASTER_KEY;
    delete process.env.APP_ENCRYPTION_KEY;
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'indie-crypto-test-'));
    testStoragePath = path.join(tempDir, 'test-secrets.enc.json');
  });

  afterEach(() => {
    if (originalMasterKey) process.env.BYOK_MASTER_KEY = originalMasterKey;
    if (originalAppKey) process.env.APP_ENCRYPTION_KEY = originalAppKey;
    if (fs.existsSync(testStoragePath)) {
      fs.rmSync(path.dirname(testStoragePath), { recursive: true, force: true });
    }
  });

  describe('Key Derivation & Master Key Priority', () => {
    test('uses BYOK_MASTER_KEY from env when provided', () => {
      process.env.BYOK_MASTER_KEY = 'test-ci-master-key-32-chars-long!!';
      const key = getMasterKey();
      expect(key).toBeInstanceOf(Buffer);
      expect(key.length).toBe(32);
    });

    test('uses APP_ENCRYPTION_KEY when BYOK_MASTER_KEY is not set', () => {
      process.env.APP_ENCRYPTION_KEY = 'fallback-app-encryption-key-ci';
      const key = getMasterKey();
      expect(key).toBeInstanceOf(Buffer);
      expect(key.length).toBe(32);
    });

    test('falls back to deterministic machine-derived PBKDF2 key when env vars are absent', () => {
      const key1 = getMasterKey();
      const key2 = getMasterKey();
      expect(key1).toBeInstanceOf(Buffer);
      expect(key1.length).toBe(32);
      expect(key1.equals(key2)).toBe(true);
    });
  });

  describe('AES-256-GCM Encryption / Decryption Roundtrip', () => {
    test('encrypts and decrypts secret string with 100% fidelity', () => {
      const secret = 'sk-proj-super-secret-key-1234567890abcdef';
      const encrypted = encryptSecret(secret);

      expect(encrypted.iv).toBeDefined();
      expect(encrypted.iv.length).toBe(24); // 12 bytes = 24 hex chars
      expect(encrypted.authTag).toBeDefined();
      expect(encrypted.authTag.length).toBe(32); // 16 bytes = 32 hex chars
      expect(encrypted.ciphertext).toBeDefined();
      expect(encrypted.ciphertext).not.toContain(secret);

      const decrypted = decryptSecret(encrypted);
      expect(decrypted).toBe(secret);
    });

    test('fails decryption if ciphertext is tampered with', () => {
      const secret = 'sk-ant-test-key-tamper-check';
      const encrypted = encryptSecret(secret);

      // Tamper with ciphertext
      const tamperedCiphertext = encrypted.ciphertext.slice(0, -2) + 'ff';
      const tampered = { ...encrypted, ciphertext: tamperedCiphertext };

      expect(() => decryptSecret(tampered)).toThrow();
    });

    test('fails decryption if authTag is tampered with', () => {
      const secret = 'sk-ant-test-key-auth-tag-check';
      const encrypted = encryptSecret(secret);

      // Tamper with authTag
      const tamperedAuthTag = '00000000000000000000000000000000';
      const tampered = { ...encrypted, authTag: tamperedAuthTag };

      expect(() => decryptSecret(tampered)).toThrow();
    });
  });

  describe('CryptoFallbackStorage File Persistence', () => {
    test('saves, retrieves, and deletes encrypted secrets on disk', async () => {
      const storage = new CryptoFallbackStorage(testStoragePath);

      // Initially null
      const initial = await storage.getSecret('openai:default');
      expect(initial).toBeNull();

      // Store secret
      const rawKey = 'sk-proj-persisted-secret-key-xyz';
      await storage.setSecret('openai:default', rawKey);

      // Raw file on disk must NOT contain plaintext key
      const fileRaw = fs.readFileSync(testStoragePath, 'utf-8');
      expect(fileRaw).not.toContain(rawKey);
      expect(fileRaw).toContain('aes-256-gcm');

      // Retrieve decrypted secret
      const retrieved = await storage.getSecret('openai:default');
      expect(retrieved).toBe(rawKey);

      // Delete secret
      const deleted = await storage.deleteSecret('openai:default');
      expect(deleted).toBe(true);

      const afterDelete = await storage.getSecret('openai:default');
      expect(afterDelete).toBeNull();
    });
  });
});
