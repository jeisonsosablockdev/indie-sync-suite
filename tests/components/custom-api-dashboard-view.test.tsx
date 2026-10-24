/**
 * @file custom-api-dashboard-view.test.tsx
 * @layer Presentation Test
 * @description UI component tests for CustomApiDashboardView (HU-5.3 / SPEC-05-06).
 *              Verifies endpoint connection input, dynamic widget inference rendering,
 *              and dashboard persistence.
 */

// @vitest-environment jsdom

import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CustomApiDashboardView } from '../../apps/web/src/components/analytics/custom-api-dashboard-view';

describe('Presentation: CustomApiDashboardView (SPEC-05-06)', () => {
  test('renders initial input bar with Modo Avanzado badge', () => {
    render(<CustomApiDashboardView />);

    expect(screen.getByText('Conexión a Endpoint REST Externo')).toBeDefined();
    expect(screen.getByText('Modo Avanzado')).toBeDefined();
    expect(screen.getByPlaceholderText('https://api.tu-servicio.com/v1/metrics')).toBeDefined();
    expect(screen.getByText('Conectar e Inferir')).toBeDefined();
  });

  test('connects to endpoint, infers widgets and displays them in grid', async () => {
    render(<CustomApiDashboardView initialEndpointUrl="https://api.example.com/v1/data" />);

    const submitBtn = screen.getByText('Conectar e Inferir');
    fireEvent.click(submitBtn);

    // Inferred widgets should be rendered
    await waitFor(() => {
      expect(screen.getByText('Total Listeners')).toBeDefined();
      expect(screen.getByText('Followers Count')).toBeDefined();
      expect(screen.getByText('Serie: weeklyEngagement')).toBeDefined();
    });

    expect(screen.getByText('Guardar Panel')).toBeDefined();
  });

  test('saves dashboard and triggers callback', async () => {
    const onSaved = vi.fn();
    render(
      <CustomApiDashboardView
        initialEndpointUrl="https://api.example.com/v1/data"
        onDashboardSaved={onSaved}
      />
    );

    const submitBtn = screen.getByText('Conectar e Inferir');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Guardar Panel')).toBeDefined();
    });

    const saveBtn = screen.getByText('Guardar Panel');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalled();
      expect(screen.getByText('¡Guardado!')).toBeDefined();
    });
  });
});
