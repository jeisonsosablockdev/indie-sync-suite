/**
 * @file sync-queue-monitor.test.tsx
 * @layer Presentation Test
 * @description UI component tests for SyncQueueMonitor (HU-4.5 / SPEC-04-05).
 *              Verifies outbox queue display, empty state, status pills, error diagnostics,
 *              and dead-letter retry actions.
 */

// @vitest-environment jsdom

import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SyncQueueMonitor } from '../../apps/web/src/components/distribution/sync-queue-monitor';
import { SyncQueueItemState } from '../../apps/web/src/lib/hooks/use-sync-queue';

describe('Presentation: SyncQueueMonitor (HU-4.5 / SPEC-04-05)', () => {
  const sampleItems: SyncQueueItemState[] = [
    {
      id: 'q-1',
      aggregateType: 'scheduled_post',
      aggregateId: 'post-1001',
      action: 'SCHEDULE',
      status: 'PENDING',
      retryCount: 0,
      createdAt: '2026-10-23T20:00:00.000Z',
    },
    {
      id: 'q-2',
      aggregateType: 'ad_campaign',
      aggregateId: 'camp-2002',
      action: 'CREATE',
      status: 'FAILED',
      retryCount: 3,
      errorMessage: 'OAuth token expired for Meta Ads Manager',
      createdAt: '2026-10-23T21:00:00.000Z',
    },
    {
      id: 'q-3',
      aggregateType: 'social_connection',
      aggregateId: 'conn-3003',
      action: 'SYNC',
      status: 'SYNCED',
      retryCount: 1,
      createdAt: '2026-10-23T19:00:00.000Z',
      syncedAt: '2026-10-23T19:05:00.000Z',
    },
  ];

  test('renders empty placeholder when queue has no items', () => {
    render(<SyncQueueMonitor initialItems={[]} />);

    expect(screen.getByTestId('sync-queue-monitor')).toBeDefined();
    expect(
      screen.getByText('La cola de sincronización está completamente vacía. Todos los eventos han sido procesados.')
    ).toBeDefined();
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(1); // pending or failed count
  });

  test('renders outbox items table with status pills, error messages, and retry counters', () => {
    render(<SyncQueueMonitor initialItems={sampleItems} />);

    expect(screen.getByText('Monitor de Cola Outbox & Sincronización Postiz')).toBeDefined();
    expect(screen.getByText('scheduled_post')).toBeDefined();
    expect(screen.getByText('ad_campaign')).toBeDefined();
    expect(screen.getByText('social_connection')).toBeDefined();

    expect(screen.getByText('Pendiente')).toBeDefined();
    expect(screen.getByText('Fallido (Dead-Letter)')).toBeDefined();
    expect(screen.getByText('Sincronizado')).toBeDefined();

    expect(screen.getByText('OAuth token expired for Meta Ads Manager')).toBeDefined();
    expect(screen.getByText('3 / 3')).toBeDefined();
    expect(screen.getByText('Reintentar')).toBeDefined();
  });

  test('resets failed item to pending when clicking Reintentar button', async () => {
    render(<SyncQueueMonitor initialItems={sampleItems} />);

    const retryBtn = screen.getByText('Reintentar');
    expect(retryBtn).toBeDefined();

    await act(async () => {
      fireEvent.click(retryBtn);
    });

    // Item should now be reset to PENDING and retry count 0 / 3
    expect(screen.getAllByText('Pendiente').length).toBe(2);
    expect(screen.getAllByText('0 / 3').length).toBe(2);
  });
});
