/**
 * @file strategic-advisor-chat.test.tsx
 * @layer Presentation Test
 * @description UI component tests for StrategicAdvisorChat (HU-5.2 / SPEC-05-04).
 *              Verifies empty state, conversational dialogue flow, session reset,
 *              and irreversible GDPR hard-delete confirmation dialog.
 */

// @vitest-environment jsdom

import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StrategicAdvisorChat } from '../../apps/web/src/components/analytics/strategic-advisor-chat';

describe('Presentation: StrategicAdvisorChat (SPEC-05-04)', () => {
  const releaseId = '33333333-3333-4333-8333-333333333333';

  // Mock scrollIntoView which is not implemented in jsdom
  window.HTMLElement.prototype.scrollIntoView = vi.fn();

  test('renders initial empty state with privacy guarantee and empty prompt placeholder', () => {
    render(<StrategicAdvisorChat releaseId={releaseId} />);

    expect(screen.getByText('Asesor Estratégico AI')).toBeDefined();
    expect(screen.getByText('Memoria 100% local en SQLite')).toBeDefined();
    expect(screen.getByText('Tu Asesor de Campaña está listo')).toBeDefined();
    expect(screen.getByPlaceholderText('Escribe una consulta estratégica sobre tu lanzamiento...')).toBeDefined();

    // Purge button should be disabled when there are no messages
    const purgeBtn = screen.getByTitle('Purga irreversible (GDPR)');
    expect((purgeBtn as HTMLButtonElement).disabled).toBe(true);
  });

  test('sends user message and renders conversational response', async () => {
    render(
      <StrategicAdvisorChat
        releaseId={releaseId}
        metricsSnapshot={{ totalStreams: 12000, cpa: 0.35 }}
      />
    );

    const input = screen.getByPlaceholderText('Escribe una consulta estratégica sobre tu lanzamiento...');
    const submitBtn = screen.getByTitle('Enviar consulta');

    fireEvent.change(input, { target: { value: '¿Cómo optimizo mi campaña en Meta?' } });
    fireEvent.click(submitBtn);

    // User message should appear immediately
    expect(screen.getByText('¿Cómo optimizo mi campaña en Meta?')).toBeDefined();

    // Assistant response should appear after simulated reasoning
    await waitFor(
      () => {
        expect(
          screen.getByText((content) =>
            content.includes('Análisis estratégico: Con base en tus métricas actuales')
          )
        ).toBeDefined();
      },
      { timeout: 2000 }
    );
  });

  test('opens GDPR confirmation dialog and executes hard delete purge', async () => {
    render(<StrategicAdvisorChat releaseId={releaseId} />);

    const input = screen.getByPlaceholderText('Escribe una consulta estratégica sobre tu lanzamiento...');
    const submitBtn = screen.getByTitle('Enviar consulta');

    fireEvent.change(input, { target: { value: 'Pregunta confidencial' } });
    fireEvent.click(submitBtn);

    expect(screen.getByText('Pregunta confidencial')).toBeDefined();

    // Purge button should now be enabled
    const purgeBtn = screen.getByTitle('Purga irreversible (GDPR)');
    expect((purgeBtn as HTMLButtonElement).disabled).toBe(false);

    // Click purge button -> opens confirmation banner
    fireEvent.click(purgeBtn);
    expect(
      screen.getByText('¿Confirmas la eliminación permanente e irreversible de esta conversación?')
    ).toBeDefined();

    // Click "Confirmar Purga"
    const confirmBtn = screen.getByText('Confirmar Purga');
    fireEvent.click(confirmBtn);

    // Messages should be cleared and initial empty state restored
    await waitFor(() => {
      expect(screen.queryByText('Pregunta confidencial')).toBeNull();
      expect(screen.getByText('Tu Asesor de Campaña está listo')).toBeDefined();
    });
  });

  test('starts a new conversation session when clicking Nueva Consulta', async () => {
    render(<StrategicAdvisorChat releaseId={releaseId} />);

    const input = screen.getByPlaceholderText('Escribe una consulta estratégica sobre tu lanzamiento...');
    const submitBtn = screen.getByTitle('Enviar consulta');

    fireEvent.change(input, { target: { value: 'Primera sesión de análisis' } });
    fireEvent.click(submitBtn);

    expect(screen.getByText('Primera sesión de análisis')).toBeDefined();

    // Click Nueva Consulta
    const newSessionBtn = screen.getByTitle('Nueva sesión');
    fireEvent.click(newSessionBtn);

    // Messages cleared
    expect(screen.queryByText('Primera sesión de análisis')).toBeNull();
    expect(screen.getByText('Tu Asesor de Campaña está listo')).toBeDefined();
  });
});
