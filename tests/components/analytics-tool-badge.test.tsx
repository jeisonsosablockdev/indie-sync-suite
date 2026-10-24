/**
 * @file analytics-tool-badge.test.tsx
 * @layer Presentation Test
 * @description UI component tests for AnalyticsToolBadge (HU-6.1 v5 / SPEC-05-06).
 *              Verifies Safe Tier 1 and Guardrail Tier 2 rendering, status styles,
 *              and confirmation callback.
 */

// @vitest-environment jsdom

import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnalyticsToolBadge } from '../../apps/web/src/components/assistant/analytics-tool-badge';

describe('Presentation: AnalyticsToolBadge (SPEC-05-06)', () => {
  test('renders Safe Tier 1 tool in EXECUTED state', () => {
    render(
      <AnalyticsToolBadge
        toolName="consultar_metricas_rendimiento"
        status="EXECUTED"
        paramsSummary='{"timeWindow": "LAST_30_DAYS"}'
      />
    );

    expect(screen.getByText('Consultar Métricas de Rendimiento')).toBeDefined();
    expect(screen.getByText('Safe Tier 1')).toBeDefined();
    expect(screen.getByText('Ejecutada')).toBeDefined();
    expect(screen.getByText('Métricas calculadas exitosamente')).toBeDefined();
    expect(screen.getByText('{"timeWindow": "LAST_30_DAYS"}')).toBeDefined();
  });

  test('renders Guardrail Tier 2 tool in CONFIRMING state with user action button', () => {
    const onConfirm = vi.fn();

    render(
      <AnalyticsToolBadge
        toolName="generar_panel_custom"
        status="CONFIRMING"
        paramsSummary='{"endpointUrl": "https://api.spotify.com/stats"}'
        onConfirmGuardrail={onConfirm}
      />
    );

    expect(screen.getByText('Generar Panel Custom API')).toBeDefined();
    expect(screen.getByText('Guardrail Tier 2')).toBeDefined();
    expect(screen.getByText('Requiere Confirmación')).toBeDefined();
    expect(
      screen.getByText('Se requiere autorización previa para configurar este panel.')
    ).toBeDefined();

    const confirmBtn = screen.getByText('Confirmar y Ejecutar');
    fireEvent.click(confirmBtn);

    expect(onConfirm).toHaveBeenCalled();
  });

  test('renders FAILED state with error message', () => {
    render(
      <AnalyticsToolBadge
        toolName="analizar_eficiencia_pauta"
        status="FAILED"
        error="Presupuesto insuficiente para estimar CPA"
      />
    );

    expect(screen.getByText('Analizar Eficiencia de Pauta')).toBeDefined();
    expect(screen.getByText('Falló')).toBeDefined();
    expect(screen.getByText('Presupuesto insuficiente para estimar CPA')).toBeDefined();
  });
});
