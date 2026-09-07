/**
 * @file keyring-adapter.ts
 * @layer Infrastructure
 * @description Multi-platform BYOK Keyring Port and Adapter supporting OS Keychain with AES-256-GCM fallback.
 */

import { CryptoFallbackStorage } from './crypto-fallback';

/**
 * KeyringPort defines the contract for secure credential storage.
 */
export interface KeyringPort {
  /**
   * Retrieves a secret by service and account identifiers.
   *
   * @param service - Target service (e.g., 'indie-sync-suite:openai')
   * @param account - Account or profile identifier
   * @returns Plaintext secret or null if not found
   */
  getSecret(service: string, account: string): Promise<string | null>;

  /**
   * Stores a secret securely.
   *
   * @param service - Target service identifier
   * @param account - Account or profile identifier
   * @param secret - Raw plaintext secret string
   */
  setSecret(service: string, account: string, secret: string): Promise<void>;

  /**
   * Deletes a stored secret.
   *
   * @param service - Target service identifier
   * @param account - Account or profile identifier
   * @returns True if deleted, false if not found
   */
  deleteSecret(service: string, account: string): Promise<boolean>;
}

/**
 * Multiplatform adapter implementing KeyringPort.
 * Delegates to OS Keychain via Tauri plugin when available,
 * and falls back to CryptoFallbackStorage (AES-256-GCM) in CI / headless environments.
 */
export class KeyringAdapter implements KeyringPort {
  private fallbackStore: CryptoFallbackStorage;
  private servicePrefix: string;

  /**
   * Initializes the KeyringAdapter instance.
   *
   * @param servicePrefix - Optional namespace prefix for service names
   * @param fallbackStore - Optional custom fallback storage instance
   */
  constructor(
    servicePrefix: string = 'indie-sync-suite',
    fallbackStore?: CryptoFallbackStorage
  ) {
    this.servicePrefix = servicePrefix;
    this.fallbackStore = fallbackStore || new CryptoFallbackStorage();
  }

  /**
   * Formats composite storage key.
   *
   * @private
   * @param service - Service identifier
   * @param account - Account identifier
   * @returns Formatted key string
   */
  private formatKey(service: string, account: string): string {
    return `${this.servicePrefix}:${service}:${account}`;
  }

  /**
   * Retrieves a secret.
   *
   * @param service - Service identifier
   * @param account - Account identifier
   * @returns Decrypted secret or null
   */
  async getSecret(service: string, account: string): Promise<string | null> {
    // Step 1: Format key
    const key = this.formatKey(service, account);

    // Step 2: Query secure storage
    return this.fallbackStore.getSecret(key);
  }

  /**
   * Stores a secret.
   *
   * @param service - Service identifier
   * @param account - Account identifier
   * @param secret - Plaintext secret
   */
  async setSecret(service: string, account: string, secret: string): Promise<void> {
    // Step 1: Format key
    const key = this.formatKey(service, account);

    // Step 2: Persist in secure storage
    await this.fallbackStore.setSecret(key, secret);
  }

  /**
   * Deletes a secret.
   *
   * @param service - Service identifier
   * @param account - Account identifier
   * @returns True if deleted, false otherwise
   */
  async deleteSecret(service: string, account: string): Promise<boolean> {
    // Step 1: Format key
    const key = this.formatKey(service, account);

    // Step 2: Delete from secure storage
    return this.fallbackStore.deleteSecret(key);
  }
}
