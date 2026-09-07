/**
 * @file credential-service.ts
 * @layer Domain
 * @description Credential lifecycle service with strict in-memory perimeter and reactive cache invalidation bus.
 */

import { KeyringPort } from '../../infrastructure/security/keyring-adapter';
import { maskApiKey, validateKeyFormat } from './key-masker';

/**
 * Supported LLM providers for BYOK model integration.
 */
export type SupportedProvider = 'openai' | 'anthropic' | 'google' | 'groq';

export const SUPPORTED_PROVIDERS: readonly SupportedProvider[] = [
  'openai',
  'anthropic',
  'google',
  'groq',
] as const;

export type CredentialChangeListener = (provider: SupportedProvider) => void;

/**
 * Service managing BYOK credential lifecycle and reactive event dispatching.
 */
export class CredentialService {
  private keyring: KeyringPort;
  private listeners: Set<CredentialChangeListener> = new Set();
  private defaultAccount: string;

  /**
   * Initializes CredentialService with a secure KeyringPort.
   *
   * @param keyring - KeyringPort implementation
   * @param defaultAccount - Account identifier (defaults to 'default')
   */
  constructor(keyring: KeyringPort, defaultAccount: string = 'default') {
    this.keyring = keyring;
    this.defaultAccount = defaultAccount;
  }

  /**
   * Subscribes a listener to credential mutation events for reactive cache purging.
   *
   * @param listener - Callback invoked when a credential changes or is revoked
   * @returns Unsubscribe function
   */
  onCredentialChange(listener: CredentialChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Dispatches change event to all registered listeners.
   *
   * @private
   * @param provider - Provider whose credential was mutated
   */
  private notifyChange(provider: SupportedProvider): void {
    for (const listener of this.listeners) {
      try {
        listener(provider);
      } catch {
        // Suppress listener errors to ensure isolation
      }
    }
  }

  /**
   * Stores an API key after format validation and dispatches reactive purge.
   *
   * @param provider - Target LLM provider
   * @param key - Raw API key string
   */
  async saveCredential(provider: SupportedProvider, key: string): Promise<void> {
    // Step 1: Validate key format
    if (!validateKeyFormat(provider, key)) {
      throw new Error(`Formato de clave de API inválido para el proveedor: ${provider}`);
    }

    // Step 2: Store secret securely in keyring
    await this.keyring.setSecret(`ai:${provider}`, this.defaultAccount, key.trim());

    // Step 3: Emit reactive change event to purge cached AI SDK clients
    this.notifyChange(provider);
  }

  /**
   * Retrieves masked credential for safe UI display.
   *
   * @param provider - Target LLM provider
   * @returns Masked key string or null if not configured
   */
  async getMaskedCredential(provider: SupportedProvider): Promise<string | null> {
    // Step 1: Retrieve secret from keyring
    const secret = await this.keyring.getSecret(`ai:${provider}`, this.defaultAccount);
    if (!secret) return null;

    // Step 2: Return only masked representation
    return maskApiKey(secret);
  }

  /**
   * Retrieves raw secret for authorized execution pipeline only.
   * NEVER serialize the returned string to JSON or expose to UI components.
   *
   * @param provider - Target LLM provider
   * @returns Raw secret string or null if not found
   */
  async getRawCredential(provider: SupportedProvider): Promise<string | null> {
    return this.keyring.getSecret(`ai:${provider}`, this.defaultAccount);
  }

  /**
   * Revokes and removes an API key from storage.
   *
   * @param provider - Target LLM provider
   * @returns True if revoked, false if not found
   */
  async revokeCredential(provider: SupportedProvider): Promise<boolean> {
    // Step 1: Delete secret from keyring
    const deleted = await this.keyring.deleteSecret(`ai:${provider}`, this.defaultAccount);

    // Step 2: Notify listeners to purge in-memory caches
    if (deleted) {
      this.notifyChange(provider);
    }

    return deleted;
  }

  /**
   * Lists all providers that currently have an active credential configured.
   * Returns only masked keys for safe UI consumption.
   *
   * @returns Array of configured provider objects with masked keys
   */
  async listConfiguredProviders(): Promise<Array<{ provider: SupportedProvider; maskedKey: string }>> {
    const results: Array<{ provider: SupportedProvider; maskedKey: string }> = [];

    for (const provider of SUPPORTED_PROVIDERS) {
      const masked = await this.getMaskedCredential(provider);
      if (masked) {
        results.push({ provider, maskedKey: masked });
      }
    }

    return results;
  }
}
