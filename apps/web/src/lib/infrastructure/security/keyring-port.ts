/**
 * @file keyring-port.ts
 * @layer Infrastructure
 * @description KeyringPort interface defining the contract for secure credential storage.
 */

export interface KeyringPort {
  /**
   * Retrieves a secret by service and account identifiers.
   *
   * @param service - Target service (e.g., "indie-sync-suite:openai")
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
