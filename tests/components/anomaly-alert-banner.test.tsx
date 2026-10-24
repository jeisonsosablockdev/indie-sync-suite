/**
 * @file anomaly-alert-banner.test.tsx
 * @layer Presentation Test
 * @description UI component tests for AnomalyAlertBanner (HU-5.6 / SPEC-05-05).
 *              Verifies empty state, rendering critical and opportunity alerts,
 *              1-click tactical execution, and dismiss functionality.
 */

// @vitest-environment jsdom

import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AnomalyAlertBanner } from '../../apps/web/src/components/analytics/anomaly-alert-banner';
import { AnomalyAlert } from '../../apps/web/src/lib/pipelines/analytics/analytics-schemas';

describe('Presentation: AnomalyAlertBanner (SPEC-05-05)', () => {
  const releaseId = '33333333-3333-4333-8333-333333333333';

  const sampleAlerts: AnomalyAlert[] = [
    {
      id: 'alert-drop-1',
      releaseId,
      metricType: 'STREAMS',
      severity: 'CRITICAL',
      changePct: -52.4,
      currentValue: 450,
      baselineValue: 950,
      detectedAt: '2026-10-24T00:00:00.000Z',
      tacticalSuggestion: 'Activar publicación de refuerzo con fragmento acústico en redes.',
    },
    {
      id: 'alert-spike-2',
      releaseId,
      metricType: 'CONVERSIONS',
      severity: 'OPPORTUNITY',
      changePct: 75.0,
      currentValue: 350,
      baselineValue: 200,
      detectedAt: '2026-10-24T00:00:00.000Z',
      tacticalSuggestion: 'Alta conversión detectada en Meta Ads. Ampliar presupuesto diario.',
    },
  ];

  test('renders null when initialAlerts is empty', () => {
    const { container } = render(<AnomalyAlertBanner releaseId={releaseId} initialAlerts={[]} />);
    expect(container.firstChild).toBeNull();
  });

  test('renders critical risk drop and opportunity spike alerts', () => {
    render(<AnomalyAlertBanner releaseId={releaseId} initialAlerts={sampleAlerts} />);

    // Severity titles
    expect(screen.getByText('Alerta de Rendimiento')).toBeDefined();
    expect(screen.getByText('Oportunidad de Crecimiento')).toBeDefined();

    // Baseline change badges
    expect(screen.getByText('-52.4% vs media 7 días')).toBeDefined();
    expect(screen.getByText('+75% vs media 7 días')).toBeDefined();

    // Tactical suggestions
    expect(
      screen.getByText('Activar publicación de refuerzo con fragmento acústico en redes.')
    ).toBeDefined();
    expect(
      screen.getByText('Alta conversión detectada en Meta Ads. Ampliar presupuesto diario.')
    ).toBeDefined();
  });

  test('executes 1-click tactical action and dismisses resolved alert', async () => {
    const onActionExecuted = vi.fn();

    render(
      <AnomalyAlertBanner
        releaseId={releaseId}
        initialAlerts={sampleAlerts}
        onActionExecuted={onActionExecuted}
      />
    );

    const actionButtons = screen.getAllByText('Aplicar Táctica');
    expect(actionButtons.length).toBe(2);

    // Click tactical action on first alert
    fireEvent.click(actionButtons[0]);

    await waitFor(() => {
      expect(onActionExecuted).toHaveBeenCalledWith('alert-drop-1');
    });

    // Alert 1 should be dismissed from UI, Alert 2 remains
    await waitFor(() => {
      expect(
        screen.queryByText('Activar publicación de refuerzo con fragmento acústico en redes.')
      ).toBeNull();
      expect(
        screen.getByText('Alta conversión detectada en Meta Ads. Ampliar presupuesto diario.')
      ).toBeDefined();
    });
  });

  test('dismisses alert when clicking close button', async () => {
    render(<AnomalyAlertBanner releaseId={releaseId} initialAlerts={sampleAlerts} />);

    const dismissButtons = screen.getAllByTitle('Descartar alerta');
    expect(dismissButtons.length).toBe(2);

    // Dismiss second alert
    fireEvent.click(dismissButtons[1]);

    await waitFor(() => {
      expect(
        screen.queryByText('Alta conversión detectada en Meta Ads. Ampliar presupuesto diario.')
      ).toBeNull();
      expect(
        screen.getByText('Activar publicación de refuerzo con fragmento acústico en redes.')
      ).toBeDefined();
    });
  });
});
