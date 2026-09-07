/**
 * @file browser-keyring.ts
 * @layer Infrastructure
 * @description Browser-compatible KeyringPort implementation using sessionStorage and in-memory map.
 */

import type { KeyringPort } from "./keyring-port";

/**
 * Browser-safe KeyringPort adapter that persists secrets in sessionStorage or in-memory map.
 * Contains zero Node.js filesystem imports.
 */
export class BrowserKeyringAdapter implements KeyringPort {
  private readonly inMemory = new Map<string, string>();
  private readonly servicePrefix: string;

  /**
   * Initializes browser keyring adapter.
   *
   * @param servicePrefix - Prefix namespace
   */
  constructor(servicePrefix: string = "indie-sync-suite") {
    this.servicePrefix = servicePrefix;
  }

  private formatKey(service: string, account: string): string {
    return `${this.servicePrefix}:${service}:${account}`;
  }

  async getSecret(service: string, account: string): Promise<string | null> {
    const key = this.formatKey(service, account);
    if (typeof window !== "undefined" && window.sessionStorage) {
      try {
        const val = window.sessionStorage.getItem(key);
        if (val !== null) return val;
      } catch {
        // Fallback to in-memory on storage restrictions
      }
    }
    return this.inMemory.get(key) ?? null;
  }

  async setSecret(service: string, account: string, secret: string): Promise<void> {
    const key = this.formatKey(service, account);
    if (typeof window !== "undefined" && window.sessionStorage) {
      try {
        window.sessionStorage.setItem(key, secret);
      } catch {
        // Fallback to in-memory
      }
    }
    this.inMemory.set(key, secret);
  }

  async deleteSecret(service: string, account: string): Promise<boolean> {
    const key = this.formatKey(service, account);
    let deleted = false;
    if (typeof window !== "undefined" && window.sessionStorage) {
      try {
        if (window.sessionStorage.getItem(key) !== null) {
          window.sessionStorage.removeItem(key);
          deleted = true;
        }
      } catch {
        // Fallback
      }
    }
    if (this.inMemory.has(key)) {
      this.inMemory.delete(key);
      deleted = true;
    }
    return deleted;
  }
}
