/**
 * @file keyring-adapter.test.ts
 * @layer Infrastructure Test
 * @description Unit tests for KeyringAdapter conforming to KeyringPort.
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { KeyringAdapter } from '../../../apps/web/src/lib/infrastructure/security/keyring-adapter';
import { CryptoFallbackStorage } from '../../../apps/web/src/lib/infrastructure/security/crypto-fallback';

describe('KeyringAdapter', () => {
  let tempFile: string;
  let adapter: KeyringAdapter;

  beforeEach(() => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'indie-keyring-test-'));
    tempFile = path.join(tempDir, 'adapter-secrets.enc.json');
    const storage = new CryptoFallbackStorage(tempFile);
    adapter = new KeyringAdapter('test-suite', storage);
  });

  afterEach(() => {
    if (fs.existsSync(tempFile)) {
      fs.rmSync(path.dirname(tempFile), { recursive: true, force: true });
    }
  });

  test('stores, retrieves, and deletes credentials cleanly', async () => {
    const service = 'openai';
    const account = 'user-profile-1';
    const secret = 'sk-proj-test-adapter-secret-9999';

    // Store
    await adapter.setSecret(service, account, secret);

    // Retrieve
    const retrieved = await adapter.getSecret(service, account);
    expect(retrieved).toBe(secret);

    // Different account returns null
    const other = await adapter.getSecret(service, 'other-account');
    expect(other).toBeNull();

    // Delete
    const deleted = await adapter.deleteSecret(service, account);
    expect(deleted).toBe(true);

    // After delete
    const afterDelete = await adapter.getSecret(service, account);
    expect(afterDelete).toBeNull();
  });
});
