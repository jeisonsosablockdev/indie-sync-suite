/**
 * @file use-byok-credentials.ts
 * @layer Application
 * @description React Hook for managing BYOK credentials and executing provider diagnostics in the UI layer.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  SupportedProvider,
  SUPPORTED_PROVIDERS,
  CredentialService,
} from '../pipelines/security/credential-service';
import { KeyringAdapter } from '../infrastructure/security/keyring-adapter';
import {
  checkProviderHealth,
  HealthCheckResult,
} from '../infrastructure/security/health-checker';

export interface ProviderItemState {
  provider: SupportedProvider;
  maskedKey: string | null;
  health?: HealthCheckResult;
  isChecking: boolean;
}

// Singleton instances for browser/client state
let credentialServiceInstance: CredentialService | null = null;

function getCredentialService(): CredentialService {
  if (!credentialServiceInstance) {
    const keyring = new KeyringAdapter();
    credentialServiceInstance = new CredentialService(keyring);
  }
  return credentialServiceInstance;
}

/**
 * Hook providing reactive state and handlers for BYOK key management and health testing.
 *
 * @returns State and actions for the BYOK manager component
 */
export function useByokCredentials() {
  const [providers, setProviders] = useState<Record<SupportedProvider, ProviderItemState>>({
    openai: { provider: 'openai', maskedKey: null, isChecking: false },
    anthropic: { provider: 'anthropic', maskedKey: null, isChecking: false },
    google: { provider: 'google', maskedKey: null, isChecking: false },
    groq: { provider: 'groq', maskedKey: null, isChecking: false },
  });
  const [isInitializing, setIsInitializing] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  const service = getCredentialService();

  /**
   * Refreshes masked credentials from secure storage.
   */
  const refreshCredentials = useCallback(async () => {
    try {
      const configured = await service.listConfiguredProviders();
      const configuredMap = new Map(configured.map(c => [c.provider, c.maskedKey]));

      setProviders(prev => {
        const next = { ...prev };
        for (const p of SUPPORTED_PROVIDERS) {
          next[p] = {
            ...next[p],
            maskedKey: configuredMap.get(p) || null,
          };
        }
        return next;
      });
    } catch (err: any) {
      setActionError(err?.message || 'Error al cargar credenciales');
    } finally {
      setIsInitializing(false);
    }
  }, [service]);

  useEffect(() => {
    let active = true;

    const loadInitial = async () => {
      try {
        const configured = await service.listConfiguredProviders();
        if (!active) return;
        const configuredMap = new Map(configured.map(c => [c.provider, c.maskedKey]));

        setProviders(prev => {
          const next = { ...prev };
          for (const p of SUPPORTED_PROVIDERS) {
            next[p] = {
              ...next[p],
              maskedKey: configuredMap.get(p) || null,
            };
          }
          return next;
        });
      } catch (err: any) {
        if (active) {
          setActionError(err?.message || 'Error al cargar credenciales');
        }
      } finally {
        if (active) {
          setIsInitializing(false);
        }
      }
    };

    loadInitial();

    const unsubscribe = service.onCredentialChange(() => {
      refreshCredentials();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [refreshCredentials, service]);

  /**
   * Saves a new API key for a provider and automatically tests connection.
   */
  const saveKey = useCallback(async (provider: SupportedProvider, rawKey: string) => {
    setActionError(null);
    try {
      // Step 1: Save in credential service
      await service.saveCredential(provider, rawKey);

      // Step 2: Set checking state
      setProviders(prev => ({
        ...prev,
        [provider]: { ...prev[provider], isChecking: true },
      }));

      // Step 3: Run health check
      const result = await checkProviderHealth(provider, rawKey);

      setProviders(prev => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          health: result,
          isChecking: false,
        },
      }));
    } catch (err: any) {
      setActionError(err?.message || 'Error al guardar credencial');
      setProviders(prev => ({
        ...prev,
        [provider]: { ...prev[provider], isChecking: false },
      }));
      throw err;
    }
  }, [service]);

  /**
   * Revokes a provider's stored credential.
   */
  const revokeKey = useCallback(async (provider: SupportedProvider) => {
    setActionError(null);
    try {
      await service.revokeCredential(provider);
      setProviders(prev => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          maskedKey: null,
          health: undefined,
          isChecking: false,
        },
      }));
    } catch (err: any) {
      setActionError(err?.message || 'Error al revocar credencial');
      throw err;
    }
  }, [service]);

  /**
   * Re-tests health of an already configured provider.
   */
  const testConnection = useCallback(async (provider: SupportedProvider) => {
    setActionError(null);
    const rawKey = await service.getRawCredential(provider);
    if (!rawKey) {
      setActionError(`No hay credencial configurada para ${provider}`);
      return;
    }

    setProviders(prev => ({
      ...prev,
      [provider]: { ...prev[provider], isChecking: true },
    }));

    const result = await checkProviderHealth(provider, rawKey);

    setProviders(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        health: result,
        isChecking: false,
      },
    }));
  }, [service]);

  return {
    providers,
    isInitializing,
    actionError,
    saveKey,
    revokeKey,
    testConnection,
    refreshCredentials,
  };
}
