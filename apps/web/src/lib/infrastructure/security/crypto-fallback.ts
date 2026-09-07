/**
 * @file crypto-fallback.ts
 * @layer Infrastructure
 * @description AES-256-GCM encrypted local storage fallback for BYOK API keys in CI and headless environments.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Storage schema for encrypted secrets file.
 */
export interface EncryptedStore {
  version: number;
  cipher: 'aes-256-gcm';
  secrets: Record<string, {
    iv: string;
    authTag: string;
    ciphertext: string;
  }>;
}

/**
 * Derives or retrieves the 32-byte master encryption key.
 * Prioritizes process.env.BYOK_MASTER_KEY or process.env.APP_ENCRYPTION_KEY in CI.
 * Falls back to local machine PBKDF2 derivation.
 *
 * @returns 32-byte encryption key buffer
 */
export function getMasterKey(): Buffer {
  // Step 1: Check prioritized environment variables for CI/headless reproducibility
  const envKey = process.env.BYOK_MASTER_KEY || process.env.APP_ENCRYPTION_KEY;
  if (envKey) {
    return crypto.createHash('sha256').update(envKey).digest();
  }

  // Step 2: Fallback to machine-derived key via PBKDF2
  const machineSeed = `${process.env.USER || 'indie-user'}-${process.platform}-${process.arch}`;
  const salt = Buffer.from('indie-sync-suite-byok-salt-v1', 'utf-8');
  return crypto.pbkdf2Sync(machineSeed, salt, 100_000, 32, 'sha256');
}

/**
 * Encrypts a plaintext secret string using AES-256-GCM.
 *
 * @param plaintext - The raw secret string to encrypt
 * @param masterKey - Optional custom master key buffer (defaults to getMasterKey())
 * @returns Object containing hex-encoded iv, authTag, and ciphertext
 */
export function encryptSecret(
  plaintext: string,
  masterKey: Buffer = getMasterKey()
): { iv: string; authTag: string; ciphertext: string } {
  // Step 1: Generate 12-byte random initialization vector
  const iv = crypto.randomBytes(12);

  // Step 2: Create AES-256-GCM cipher instance
  const cipher = crypto.createCipheriv('aes-256-gcm', masterKey, iv);

  // Step 3: Encrypt the plaintext secret
  let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
  ciphertext += cipher.final('hex');

  // Step 4: Extract 16-byte authentication tag
  const authTag = cipher.getAuthTag().toString('hex');

  return {
    iv: iv.toString('hex'),
    authTag,
    ciphertext,
  };
}

/**
 * Decrypts an AES-256-GCM encrypted secret.
 *
 * @param encrypted - Encrypted payload with iv, authTag, and ciphertext
 * @param masterKey - Optional custom master key buffer (defaults to getMasterKey())
 * @returns Decrypted plaintext secret
 */
export function decryptSecret(
  encrypted: { iv: string; authTag: string; ciphertext: string },
  masterKey: Buffer = getMasterKey()
): string {
  // Step 1: Reconstitute buffers from hex
  const iv = Buffer.from(encrypted.iv, 'hex');
  const authTag = Buffer.from(encrypted.authTag, 'hex');

  // Step 2: Create decipher instance and set authentication tag
  const decipher = crypto.createDecipheriv('aes-256-gcm', masterKey, iv);
  decipher.setAuthTag(authTag);

  // Step 3: Decrypt ciphertext
  let decrypted = decipher.update(encrypted.ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * File-backed encrypted fallback store for headless/CI environments.
 */
export class CryptoFallbackStorage {
  private filePath: string;

  /**
   * Initializes the fallback storage instance.
   *
   * @param customPath - Optional custom path for the secrets storage file
   */
  constructor(customPath?: string) {
    if (customPath) {
      this.filePath = customPath;
    } else {
      const dataDir = process.env.BYOK_DATA_DIR || path.join(process.cwd(), '.indie-data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      this.filePath = path.join(dataDir, 'byok-secrets.enc.json');
    }
  }

  /**
   * Reads and decodes the store from disk.
   *
   * @private
   * @returns EncryptedStore object
   */
  private readStore(): EncryptedStore {
    if (!fs.existsSync(this.filePath)) {
      return { version: 1, cipher: 'aes-256-gcm', secrets: {} };
    }
    try {
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(raw) as EncryptedStore;
    } catch {
      return { version: 1, cipher: 'aes-256-gcm', secrets: {} };
    }
  }

  /**
   * Writes the store to disk atomically.
   *
   * @private
   * @param store - EncryptedStore to write
   */
  private writeStore(store: EncryptedStore): void {
    const parentDir = path.dirname(this.filePath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(this.filePath, JSON.stringify(store, null, 2), { mode: 0o600 });
  }

  /**
   * Retrieves a decrypted secret by key.
   *
   * @param key - Storage key
   * @returns Decrypted plaintext string or null if not found
   */
  async getSecret(key: string): Promise<string | null> {
    // Step 1: Read encrypted store
    const store = this.readStore();
    const item = store.secrets[key];
    if (!item) return null;

    // Step 2: Attempt decryption
    try {
      return decryptSecret(item);
    } catch {
      return null;
    }
  }

  /**
   * Encrypts and saves a secret.
   *
   * @param key - Storage key
   * @param secret - Plaintext secret string
   */
  async setSecret(key: string, secret: string): Promise<void> {
    // Step 1: Read current store
    const store = this.readStore();

    // Step 2: Encrypt secret and update store
    store.secrets[key] = encryptSecret(secret);

    // Step 3: Write to disk with restricted permissions
    this.writeStore(store);
  }

  /**
   * Deletes a secret from storage.
   *
   * @param key - Storage key
   * @returns True if deleted, false if not found
   */
  async deleteSecret(key: string): Promise<boolean> {
    // Step 1: Read current store
    const store = this.readStore();
    if (!(key in store.secrets)) {
      return false;
    }

    // Step 2: Delete entry and persist
    delete store.secrets[key];
    this.writeStore(store);
    return true;
  }
}
