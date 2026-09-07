/**
 * @file ai-provider-registry.test.ts
 * @layer Domain Test
 * @description Unit tests for AiProviderRegistry lazy model resolution, anti-SSRF validation, and reactive purging.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { AiProviderRegistry } from '../../../apps/web/src/lib/pipelines/agent/ai-provider-registry';
import { KeyringPort } from '../../../apps/web/src/lib/infrastructure/security/keyring-adapter';
import { CredentialService } from '../../../apps/web/src/lib/pipelines/security/credential-service';

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

describe('AiProviderRegistry', () => {
  let keyring: MockKeyring;
  let credentialService: CredentialService;
  let registry: AiProviderRegistry;

  beforeEach(() => {
    keyring = new MockKeyring();
    credentialService = new CredentialService(keyring);
    registry = new AiProviderRegistry(keyring, credentialService);
  });

  test('resolves model successfully when API key is present in keyring', async () => {
    await keyring.setSecret('ai:openai', 'default', 'sk-proj-valid-secret-key-123456');

    const model = await registry.resolveModel('gpt-4o');

    expect(model.modelId).toBe('gpt-4o');
    expect(model.provider).toBe('openai');
    expect(model.keyFingerprint).toBeDefined();
    expect(model.keyFingerprint.length).toBe(64); // SHA-256 hash length
  });

  test('throws descriptive error if model is not configured in keyring', async () => {
    await expect(registry.resolveModel('claude-3-5-sonnet-20241022')).rejects.toThrow(
      'Credencial no configurada para el proveedor "anthropic"'
    );
  });

  test('throws error if requested model is not recognized in the catalog', async () => {
    await expect(registry.resolveModel('unsupported-super-ai-9000')).rejects.toThrow(
      'no reconocido en el catálogo de proveedores'
    );
  });

  test('enforces SSRF check: blocks cloud metadata service endpoints (169.254.169.254)', async () => {
    await keyring.setSecret('ai:groq', 'default', 'gsk_valid-groq-key-123456');

    await expect(
      registry.resolveModel('llama-3.3-70b-versatile', {
        customBaseUrl: 'http://169.254.169.254/latest/meta-data',
      })
    ).rejects.toThrow('rechazada por seguridad');
  });

  test('allows HTTPS custom endpoints and localhost loopback for local Ollama', async () => {
    // Valid HTTPS custom endpoint
    await keyring.setSecret('ai:groq', 'default', 'gsk_valid-groq-key-123456');
    const groqModel = await registry.resolveModel('llama-3.3-70b-versatile', {
      customBaseUrl: 'https://custom-groq-proxy.internal.company.com/v1',
    });
    expect(groqModel.baseUrl).toBe('https://custom-groq-proxy.internal.company.com/v1');

    // Valid localhost loopback
    const ollamaModel = await registry.resolveModel('llama3.2', {
      customBaseUrl: 'http://localhost:11434/v1',
    });
    expect(ollamaModel.baseUrl).toBe('http://localhost:11434/v1');
  });

  test('reactively purges cached models when credentials are saved or revoked', async () => {
    await keyring.setSecret('ai:openai', 'default', 'sk-proj-key-123456');

    // 1. Resolve and cache
    await registry.resolveModel('gpt-4o');
    expect(registry.getCache().size()).toBe(1);

    // 2. Mutate credential via CredentialService
    await credentialService.saveCredential('openai', 'sk-proj-updated-key-abcdefgh');

    // 3. Cache must be automatically purged for openai
    expect(registry.getCache().size()).toBe(0);
  });
});
