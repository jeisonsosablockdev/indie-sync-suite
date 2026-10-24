/**
 * @file creative-tool-badge.test.tsx
 * @layer Presentation Test
 * @description UI component tests for CreativeToolBadge (HU-6.1 v3 / SPEC-03-07).
 *              Verifies risk tier badges (Tier 1 safe vs Tier 2 guardrail), status states, and authorization actions.
 */

// @vitest-environment jsdom

import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CreativeToolBadge } from '../../apps/web/src/components/assistant/creative-tool-badge';

describe('Presentation: CreativeToolBadge (HU-6.1 v3 / SPEC-03-07)', () => {
  test('@spec REQ-HU-3.7-08: renders tool badge with Tier 2 (Guardrail) for generar_portada', () => {
    // Act
    render(
      <CreativeToolBadge
        toolName="generar_portada"
        status="REQUESTED"
        paramsSummary="aspectRatio: SQUARE_1_1"
      />
    );

    // Assert
    expect(screen.getByText('Generar Portada (Lote)')).toBeDefined();
    expect(screen.getByText(/Tier 2 \(Guardrail\)/)).toBeDefined();
    expect(screen.getByText('Solicitada')).toBeDefined();
    expect(screen.getByText(/aspectRatio: SQUARE_1_1/)).toBeDefined();
  });

  test('@spec REQ-HU-3.7-09: renders tool badge with Tier 1 (Safe) for copiar_prompt', () => {
    // Act
    render(
      <CreativeToolBadge
        toolName="copiar_prompt"
        status="EXECUTED"
        paramsSummary="platformPreset: MIDJOURNEY_V6"
      />
    );

    // Assert
    expect(screen.getByText('Compilar Prompt Maestro')).toBeDefined();
    expect(screen.getByText(/Tier 1 \(Safe\)/)).toBeDefined();
    expect(screen.getByText('Completada')).toBeDefined();
  });

  test('@spec REQ-HU-3.7-10: renders authorization button on CONFIRMING status and triggers confirmation callback', () => {
    // Arrange
    const onConfirmGuardrail = vi.fn();
    render(
      <CreativeToolBadge
        toolName="actualizar_prompt"
        status="CONFIRMING"
        onConfirmGuardrail={onConfirmGuardrail}
      />
    );

    // Assert
    expect(screen.getByText('Requiere Autorización')).toBeDefined();
    const authBtn = screen.getByRole('button', { name: /Autorizar Ejecución/i });
    expect(authBtn).toBeDefined();

    // Act
    fireEvent.click(authBtn);

    // Assert
    expect(onConfirmGuardrail).toHaveBeenCalledTimes(1);
  });

  test('@spec REQ-HU-3.7-11: renders error message when tool status is FAILED', () => {
    // Act
    render(
      <CreativeToolBadge
        toolName="generar_copy"
        status="FAILED"
        error="Fallo en la inferencia del modelo LLM"
      />
    );

    // Assert
    expect(screen.getByText('Fallida')).toBeDefined();
    expect(screen.getByText('Fallo en la inferencia del modelo LLM')).toBeDefined();
  });
});
