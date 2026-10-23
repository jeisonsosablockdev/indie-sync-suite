/**
 * @file guardrail-modal.test.tsx
 * @layer Presentation Test
 * @description Component tests for GuardrailModal human confirmation dialog with JSON diff inspection.
 */

// @vitest-environment jsdom

import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GuardrailModal } from '../../apps/web/src/components/assistant/guardrail-modal';

describe('GuardrailModal Component', () => {
  test('does not render when no pending action exists', () => {
    const { container } = render(<GuardrailModal action={null} />);
    expect(container.firstChild).toBeNull();
  });

  test('renders tool name, explanation, and structured JSON parameters', () => {
    const mockAction = {
      id: 'action-123',
      toolName: 'actualizar_marca_artista',
      confirmationMessage: 'El agente solicita sobrescribir la paleta del artista.',
      params: {
        artistId: 'uuid-1234',
        colorPalette: ['#18181B', '#EC4899'],
        genre: 'Synthpop',
      },
      createdAt: Date.now(),
    };

    render(<GuardrailModal action={mockAction} />);

    expect(screen.getByText('Confirmación de Acción Requerida')).toBeDefined();
    expect(screen.getByText('SENSITIVE')).toBeDefined();
    expect(screen.getByText('actualizar_marca_artista')).toBeDefined();
    expect(
      screen.getByText('El agente solicita sobrescribir la paleta del artista.')
    ).toBeDefined();

    // Verify structured JSON parameter diff
    expect(screen.getByText(/"artistId": "uuid-1234"/)).toBeDefined();
    expect(screen.getByText(/"genre": "Synthpop"/)).toBeDefined();
  });

  test('calls onApprove handler when user clicks "Aprobar y Ejecutar"', async () => {
    const onApprove = vi.fn().mockResolvedValue(undefined);
    const mockAction = {
      id: 'action-approve-test',
      toolName: 'crear_artista',
      confirmationMessage: 'Crear nuevo artista',
      params: { name: 'Luna' },
      createdAt: Date.now(),
    };

    render(<GuardrailModal action={mockAction} onApprove={onApprove} />);

    const approveBtn = screen.getByText('Aprobar y Ejecutar');
    fireEvent.click(approveBtn);

    expect(onApprove).toHaveBeenCalledWith('action-approve-test');
  });

  test('calls onReject handler when user clicks "Rechazar Acción"', async () => {
    const onReject = vi.fn().mockResolvedValue(undefined);
    const mockAction = {
      id: 'action-reject-test',
      toolName: 'eliminar_artista',
      confirmationMessage: 'Eliminar artista',
      params: { id: 'x' },
      createdAt: Date.now(),
    };

    render(<GuardrailModal action={mockAction} onReject={onReject} />);

    const rejectBtn = screen.getByText('Rechazar Acción');
    fireEvent.click(rejectBtn);

    expect(onReject).toHaveBeenCalledWith('action-reject-test');
  });
});
