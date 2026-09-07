/**
 * @file credential-service.test.ts
 * @layer Domain Test
 * @description Unit tests for CredentialService lifecycle and reactive event bus.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { CredentialService } from '../../../apps/web/src/lib/pipelines/security/credential-service';
import { KeyringPort } from '../../../apps/web/src/lib/infrastructure/security/keyring-adapter';

class MockKeyring implements KeyringPort {
  private store: Map<string, string> = new Map();

  async getSecret(service: string, account: string): Promise<string | null> {
    return this.store.get(`${service}:${account}`) || null;
  }

  async setSecret(service: string, account: string, secret: string): Promise<void> {
    this.store.set(`${service}:${account}`, secret);
  }

  async deleteSecret(service: string, account: string): Promise<boolean> {
    return this.store.delete(`${service}:${account}`);
  }
}

describe('CredentialService', () => {
  let keyring: MockKeyring;
  let service: CredentialService;

  beforeEach(() => {
    keyring = new MockKeyring();
    service = new CredentialService(keyring, 'test-account');
  });

  test('saves valid key and emits reactive change event', async () => {
    let notifiedProvider: string | null = null;
    service.onCredentialChange(provider => {
      notifiedProvider = provider;
    });

    const key = 'sk-proj-12345678901234567890';
    await service.saveCredential('openai', key);

    expect(notifiedProvider).toBe('openai');

    // Retrieve masked
    const masked = await service.getMaskedCredential('openai');
    expect(masked).toBe('sk-proj-...7890');

    // Raw key retrieval
    const raw = await service.getRawCredential('openai');
    expect(raw).toBe(key);
  });

  test('rejects malformed key with descriptive error', async () => {
    await expect(service.saveCredential('openai', 'invalid')).rejects.toThrow(
      'Formato de clave de API inválido'
    );
  });

  test('revokes credential and notifies listeners', async () => {
    let changeCount = 0;
    service.onCredentialChange(() => {
      changeCount++;
    });

    const key = 'sk-ant-12345678901234567890';
    await service.saveCredential('anthropic', key);
    expect(changeCount).toBe(1);

    const revoked = await service.revokeCredential('anthropic');
    expect(revoked).toBe(true);
    expect(changeCount).toBe(2);

    const masked = await service.getMaskedCredential('anthropic');
    expect(masked).toBeNull();
  });

  test('lists configured providers returning only masked keys', async () => {
    await service.saveCredential('openai', 'sk-proj-12345678901234567890');
    await service.saveCredential('google', 'AIzaSy12345678901234567890');

    const list = await service.listConfiguredProviders();
    expect(list.length).toBe(2);

    const openai = list.find(l => l.provider === 'openai');
    expect(openai?.maskedKey).toBe('sk-proj-...7890');

    const google = list.find(l => l.provider === 'google');
    expect(google?.maskedKey).toBe('AIzaSy...7890');
  });
});
