/**
 * @file distribution-tool-badge.test.tsx
 * @layer Presentation Test
 * @description UI component tests for DistributionToolBadge (HU-6.1 v4 / SPEC-04-06).
 *              Verifies risk tier badges (Tier 1 safe vs Tier 2 guardrail), status rendering,
 *              error message displays, and Guardrail authorization button clicks.
 */

// @vitest-environment jsdom

import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DistributionToolBadge } from '../../apps/web/src/components/assistant/distribution-tool-badge';

describe('Presentation: DistributionToolBadge (HU-6.1 v4 / SPEC-04-06)', () => {
  test('renders Tier 1 safe tool badge in EXECUTED status', () => {
    render(
      <DistributionToolBadge
        toolName="programar_publicacion"
        status="EXECUTED"
        paramsSummary="Instagram, TikTok • 2026-11-15 18:00 UTC"
      />
    );

    expect(screen.getByTestId('distribution-tool-badge-programar_publicacion')).toBeDefined();
    expect(screen.getByText('Programar Publicación')).toBeDefined();
    expect(screen.getByText('Tier 1 (Safe)')).toBeDefined();
    expect(screen.getByText('Completada')).toBeDefined();
    expect(screen.getByText('Instagram, TikTok • 2026-11-15 18:00 UTC')).toBeDefined();
  });

  test('renders Tier 2 Guardrail tool badge in CONFIRMING status with authorization button', () => {
    const handleConfirm = vi.fn();

    render(
      <DistributionToolBadge
        toolName="lanzar_campana_pauta"
        status="CONFIRMING"
        paramsSummary="Meta Ads • $50.00 USD • 5 días"
        onConfirmGuardrail={handleConfirm}
      />
    );

    expect(screen.getByTestId('distribution-tool-badge-lanzar_campana_pauta')).toBeDefined();
    expect(screen.getByText('Lanzar Pauta Programática')).toBeDefined();
    expect(screen.getByText('Tier 2 (Guardrail)')).toBeDefined();
    expect(screen.getByText('Requiere Autorización')).toBeDefined();
    expect(screen.getByText('Meta Ads • $50.00 USD • 5 días')).toBeDefined();

    const authBtn = screen.getByRole('button', { name: /Autorizar Ejecución/i });
    expect(authBtn).toBeDefined();

    fireEvent.click(authBtn);
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  test('renders tool in FAILED status with error message', () => {
    render(
      <DistributionToolBadge
        toolName="consultar_calendario_posts"
        status="FAILED"
        error="Network timeout connecting to SQLite database"
      />
    );

    expect(screen.getByTestId('distribution-tool-badge-consultar_calendario_posts')).toBeDefined();
    expect(screen.getByText('Consultar Calendario de Posts')).toBeDefined();
    expect(screen.getByText('Fallida')).toBeDefined();
    expect(screen.getByText('Network timeout connecting to SQLite database')).toBeDefined();
  });
});
