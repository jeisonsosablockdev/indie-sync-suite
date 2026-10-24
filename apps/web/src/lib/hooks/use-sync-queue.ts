/**
 * @file use-sync-queue.ts
 * @layer Application
 * @description Application hook inspecting the cloud_sync_queue outbox, monitoring retry states,
 *              and triggering manual retries on dead-letter failures. Zero direct JSX.
 */

'use client';

import { useState, useCallback } from 'react';

export interface SyncQueueItemState {
  id: string;
  aggregateType: string;
  aggregateId: string;
  action: string;
  status: 'PENDING' | 'PROCESSING' | 'SYNCED' | 'FAILED';
  retryCount: number;
  errorMessage?: string | null;
  createdAt: string;
  syncedAt?: string | null;
}

export interface UseSyncQueueOptions {
  initialItems?: SyncQueueItemState[];
}

export interface UseSyncQueueReturn {
  queueItems: SyncQueueItemState[];
  pendingCount: number;
  failedCount: number;
  isLoading: boolean;
  error: string | null;
  refreshQueue: () => Promise<void>;
  forceRetry: (itemId: string) => Promise<boolean>;
}

/**
 * Custom application hook for monitoring the background outbox synchronization queue.
 *
 * @param options - Configuration including optional initial items
 * @returns State and action handlers for the sync queue monitor
 */
export function useSyncQueue({
  initialItems = [],
}: UseSyncQueueOptions = {}): UseSyncQueueReturn {
  // Step 1: Initialize local queue state
  const [queueItems, setQueueItems] = useState<SyncQueueItemState[]>(initialItems);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Step 2: Compute counts
  const pendingCount = queueItems.filter((i) => i.status === 'PENDING' || i.status === 'PROCESSING').length;
  const failedCount = queueItems.filter((i) => i.status === 'FAILED').length;

  // Step 3: Refresh queue status
  const refreshQueue = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Simulated refresh
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error refreshing queue';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Step 4: Force retry failed outbox item
  const forceRetry = useCallback(async (itemId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      setQueueItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, status: 'PENDING', retryCount: 0, errorMessage: null }
            : item
        )
      );
      return true;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    queueItems,
    pendingCount,
    failedCount,
    isLoading,
    error,
    refreshQueue,
    forceRetry,
  };
}
