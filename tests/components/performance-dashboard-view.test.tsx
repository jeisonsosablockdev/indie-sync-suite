/**
 * @file performance-dashboard-view.test.tsx
 * @layer Presentation Test
 * @description UI component tests for PerformanceDashboardView (HU-5.1 / SPEC-05-01).
 *              Verifies metric card displays, time-window tab switching, and country breakdown.
 */

// @vitest-environment jsdom

import React from 'react';
import { describe, test, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PerformanceDashboardView } from '../../apps/web/src/components/analytics/performance-dashboard-view';

describe('Presentation: PerformanceDashboardView (SPEC-05-01)', () => {
  const releaseId = '33333333-3333-4333-8333-333333333333';

  test('renders dashboard title, time-window tabs, and KPI cards', async () => {
    render(<PerformanceDashboardView releaseId={releaseId} />);

    expect(screen.getByText('Rendimiento del Lanzamiento')).toBeDefined();
    expect(screen.getByText('Pre-Release')).toBeDefined();
    expect(screen.getByText('Drop Week')).toBeDefined();
    expect(screen.getByText('Post-Release')).toBeDefined();
    expect(screen.getByText('Histórico')).toBeDefined();

    expect(screen.getByText('Reproducciones Totales')).toBeDefined();
    expect(screen.getByText('Oyentes Únicos')).toBeDefined();
    expect(screen.getByText('Guardados en Biblioteca')).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText('14,250')).toBeDefined();
      expect(screen.getByText('8,900')).toBeDefined();
      expect(screen.getByText('1,240')).toBeDefined();
    });
  });

  test('switches time-window filter tab on user click', async () => {
    render(<PerformanceDashboardView releaseId={releaseId} />);

    const dropWeekBtn = screen.getByRole('button', { name: 'Drop Week' });
    fireEvent.click(dropWeekBtn);

    await waitFor(() => {
      expect(dropWeekBtn.className).toContain('bg-background');
    });
  });

  test('renders top geographic distribution when metrics exist', async () => {
    render(<PerformanceDashboardView releaseId={releaseId} />);

    await waitFor(() => {
      expect(screen.getByText('Top Países por Escuchas')).toBeDefined();
      expect(screen.getByText('MX')).toBeDefined();
      expect(screen.getByText('CO')).toBeDefined();
      expect(screen.getByText('ES')).toBeDefined();
    });
  });
});
