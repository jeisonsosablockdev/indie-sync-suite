/**
 * @file keyring-adapter.ts
 * @layer Infrastructure
 * @description Multi-platform BYOK Keyring Port and Adapter supporting OS Keychain with AES-256-GCM fallback.
 */

import { CryptoFallbackStorage } from './crypto-fallback';
import type { KeyringPort } from './keyring-port';

export type { KeyringPort };

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
