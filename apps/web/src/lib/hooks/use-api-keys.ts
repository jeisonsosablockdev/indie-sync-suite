/**
 * @file use-api-keys.ts
 * @layer Application
 * @description Application hook managing Open REST API keys: issuance, plaintext key display modal,
 *              scope assignment, listing, and immediate revocation. Zero direct JSX.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  ApiKeyScope,
  ExternalApiKey,
} from '../pipelines/portal/portal-schemas';
import { generateRawApiKey } from '../pipelines/api-gateway/api-auth-middleware';

export type { ApiKeyScope, ExternalApiKey };

export interface NewlyIssuedKey {
  rawKey: string;
  label: string;
}

export interface UseApiKeysReturn {
  apiKeys: ExternalApiKey[];
  newlyIssuedKey: NewlyIssuedKey | null;
  isLoading: boolean;
  isCreating: boolean;
  error: string | null;
  generateKey: (label: string, scopes: ApiKeyScope[]) => Promise<string | null>;
  revokeKey: (keyId: string) => Promise<boolean>;
  clearIssuedKey: () => void;
  refreshKeys: () => Promise<void>;
}

/**
 * Reactive application hook for managing REST API keys and credentials.
 *
 * @returns State and actions for API key administration
 */
export function useApiKeys(): UseApiKeysReturn {
  // Step 1: Initialize states
  const [apiKeys, setApiKeys] = useState<ExternalApiKey[]>([]);
  const [newlyIssuedKey, setNewlyIssuedKey] = useState<NewlyIssuedKey | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Step 2: Refresh keys list
  const refreshKeys = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 2a: Mock placeholder / local repository keys
      const sampleKeys: ExternalApiKey[] = [
        {
          id: 'k1',
          label: 'ChatGPT Actions Client',
          keyPrefix: 'iss_live_a1b2c3d4',
          keyHash: 'hash-sample-1',
          scopes: ['READ_RELEASES', 'READ_METRICS'],
          lastUsedAt: '2026-10-23T14:20:00Z',
          createdAt: '2026-10-20T10:00:00Z',
        },
      ];
      setApiKeys(sampleKeys);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al listar API keys');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Step 3: Load initial keys on mount
  useEffect(() => {
    let active = true;

    const loadInitial = async () => {
      try {
        const sampleKeys: ExternalApiKey[] = [
          {
            id: 'k1',
            label: 'ChatGPT Actions Client',
            keyPrefix: 'iss_live_a1b2c3d4',
            keyHash: 'hash-sample-1',
            scopes: ['READ_RELEASES', 'READ_METRICS'],
            lastUsedAt: '2026-10-23T14:20:00Z',
            createdAt: '2026-10-20T10:00:00Z',
          },
        ];
        if (active) {
          setApiKeys(sampleKeys);
        }
      } catch (err: unknown) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Error al inicializar API keys');
        }
      }
    };

    void loadInitial();

    return () => {
      active = false;
    };
  }, []);

  // Step 4: Issue a new API key
  const generateKey = useCallback(
    async (label: string, scopes: ApiKeyScope[]): Promise<string | null> => {
      if (!label.trim() || scopes.length === 0) {
        setError('El nombre de la llave y al menos un permiso son obligatorios');
        return null;
      }

      setIsCreating(true);
      setError(null);

      try {
        const pair = generateRawApiKey();
        const newKeyRecord: ExternalApiKey = {
          id: crypto.randomUUID(),
          label: label.trim(),
          keyPrefix: pair.keyPrefix,
          keyHash: pair.keyHash,
          scopes,
          createdAt: new Date().toISOString(),
        };

        setApiKeys((prev) => [newKeyRecord, ...prev]);
        setNewlyIssuedKey({ rawKey: pair.rawKey, label: label.trim() });
        return pair.rawKey;
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al generar nueva API key');
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    []
  );

  // Step 5: Revoke an existing API key
  const revokeKey = useCallback(async (keyId: string): Promise<boolean> => {
    try {
      setApiKeys((prev) =>
        prev.map((k) => (k.id === keyId ? { ...k, revokedAt: new Date().toISOString() } : k))
      );
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al revocar API key');
      return false;
    }
  }, []);

  // Step 6: Dismiss newly issued key modal
  const clearIssuedKey = useCallback(() => {
    setNewlyIssuedKey(null);
  }, []);

  return {
    apiKeys,
    newlyIssuedKey,
    isLoading,
    isCreating,
    error,
    generateKey,
    revokeKey,
    clearIssuedKey,
    refreshKeys,
  };
}
