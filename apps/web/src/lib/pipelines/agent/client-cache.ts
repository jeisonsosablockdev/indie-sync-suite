/**
 * @file client-cache.ts
 * @layer Domain
 * @description In-memory LLM client instance cache indexed by SHA-256 fingerprints with deterministic reactive purging.
 */

import { computeKeyFingerprint } from '../security/key-masker';

/**
 * Cache managing instantiated LLM provider clients without retaining raw secret material.
 */
export class ClientCache<T = any> {
  private cache: Map<string, T> = new Map();

  /**
   * Generates composite cache key using provider, modelId, and the SHA-256 fingerprint of the key.
   *
   * @param provider - Provider identifier
   * @param modelId - Target model identifier
   * @param keyFingerprint - Hex SHA-256 fingerprint (never the raw API key)
   * @returns Cache key string
   */
  private buildKey(provider: string, modelId: string, keyFingerprint: string): string {
    return `${provider.toLowerCase()}:${modelId}:${keyFingerprint}`;
  }

  /**
   * Retrieves a cached client instance if present.
   *
   * @param provider - Provider name
   * @param modelId - Model ID
   * @param keyFingerprint - SHA-256 key fingerprint
   * @returns Cached client instance or undefined
   */
  get(provider: string, modelId: string, keyFingerprint: string): T | undefined {
    const key = this.buildKey(provider, modelId, keyFingerprint);
    return this.cache.get(key);
  }

  /**
   * Caches an instantiated client.
   *
   * @param provider - Provider name
   * @param modelId - Model ID
   * @param keyFingerprint - SHA-256 key fingerprint
   * @param client - Instantiated client object
   */
  set(provider: string, modelId: string, keyFingerprint: string, client: T): void {
    const key = this.buildKey(provider, modelId, keyFingerprint);
    this.cache.set(key, client);
  }

  /**
   * Deterministically purges all cached clients for a specified provider.
   * Called when credentials for that provider are updated or revoked.
   *
   * @param provider - Provider name to purge
   * @returns Number of evicted instances
   */
  purgeProvider(provider: string): number {
    const prefix = `${provider.toLowerCase()}:`;
    let evicted = 0;

    for (const key of Array.from(this.cache.keys())) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        evicted++;
      }
    }

    return evicted;
  }

  /**
   * Clears all cached client instances.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Returns current count of cached clients.
   *
   * @returns Number of cached client instances
   */
  size(): number {
    return this.cache.size;
  }
}
