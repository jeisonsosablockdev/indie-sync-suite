/**
 * @file use-oauth-hub.ts
 * @layer Application
 * @description Application hook managing connected social profiles and ad accounts,
 *              health check status, and OAuth connection workflows. Zero direct JSX.
 */

'use client';

import { useState, useCallback } from 'react';
import {
  SocialPlatform,
  HealthStatus,
  SocialConnection,
} from '../pipelines/distribution/distribution-schemas';

export type { SocialPlatform, HealthStatus, SocialConnection };

export interface UseOAuthHubOptions {
  labelId: string;
  initialConnections?: SocialConnection[];
}

export interface UseOAuthHubReturn {
  connections: SocialConnection[];
  isLoading: boolean;
  error: string | null;
  refreshConnections: () => Promise<void>;
  initiateOAuthConnect: (platform: SocialPlatform) => Promise<string>;
  disconnectAccount: (connectionId: string) => Promise<boolean>;
}

/**
 * Custom application hook for OAuth Hub social and ad account management.
 *
 * @param options - Configuration including labelId and optional initial connections
 * @returns State and action handlers for the OAuth Hub view
 */
export function useOAuthHub({
  labelId,
  initialConnections = [],
}: UseOAuthHubOptions): UseOAuthHubReturn {
  // Step 1: Initialize local connection state
  const [connections, setConnections] = useState<SocialConnection[]>(initialConnections);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Step 2: Refresh connection health status
  const refreshConnections = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Simulated refresh delay
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error refreshing accounts';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Step 3: OAuth redirect URL generation
  const initiateOAuthConnect = useCallback(
    async (platform: SocialPlatform): Promise<string> => {
      setIsLoading(true);
      try {
        // Return simulated authorization gateway URL
        return `https://auth.postiz.com/oauth/authorize?platform=${platform}&label_id=${labelId}`;
      } finally {
        setIsLoading(false);
      }
    },
    [labelId]
  );

  // Step 4: Disconnect connection
  const disconnectAccount = useCallback(async (connectionId: string): Promise<boolean> => {
    setConnections((prev) => prev.filter((c) => c.id !== connectionId));
    return true;
  }, []);

  return {
    connections,
    isLoading,
    error,
    refreshConnections,
    initiateOAuthConnect,
    disconnectAccount,
  };
}
