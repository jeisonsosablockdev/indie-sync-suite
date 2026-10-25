/**
 * @file api-keys-manager.test.tsx
 * @layer Presentation Test
 * @description UI component tests for ApiKeysManager (HU-6.2 / SPEC-06-02).
 *              Verifies key generation modal, scope selection, one-time plaintext reveal,
 *              copy action, and key revocation.
 */

// @vitest-environment jsdom

import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ApiKeysManager } from '../../apps/web/src/components/api-gateway/api-keys-manager';

describe('Presentation: ApiKeysManager (SPEC-06-02)', () => {
  // Mock clipboard writeText
  const writeTextMock = vi.fn().mockResolvedValue(undefined);
  Object.assign(navigator, {
    clipboard: {
      writeText: writeTextMock,
    },
  });

  test('renders header, description and existing active keys', async () => {
    render(<ApiKeysManager />);

    expect(screen.getByText('Gestión de API Keys REST')).toBeDefined();
    expect(screen.getByText('Generar Nueva Llave')).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText('ChatGPT Actions Client')).toBeDefined();
      expect(screen.getByText('Activa')).toBeDefined();
    });
  });

  test('opens creation modal, selects scopes and creates a new API key', async () => {
    render(<ApiKeysManager />);

    const openBtn = screen.getByText('Generar Nueva Llave');
    fireEvent.click(openBtn);

    expect(screen.getByText('Nueva Clave de Acceso')).toBeDefined();

    const input = screen.getByPlaceholderText('ej. ChatGPT Desktop Action');
    fireEvent.change(input, { target: { value: 'Claude Desktop Integration' } });

    // Click scope checkbox
    const writeScope = screen.getByText('Escritura de Tareas');
    fireEvent.click(writeScope);

    const submitBtn = screen.getByText('Generar Llave');
    fireEvent.click(submitBtn);

    // One-time reveal card should appear
    await waitFor(() => {
      expect(screen.getByText('Llave Creada: Claude Desktop Integration')).toBeDefined();
      expect(
        screen.getByText(
          'Por seguridad, esta llave solo se mostrará una vez. Guárdala en tu gestor de secretos.'
        )
      ).toBeDefined();
    });
  });

  test('copies newly issued key to clipboard', async () => {
    render(<ApiKeysManager />);

    const openBtn = screen.getByText('Generar Nueva Llave');
    fireEvent.click(openBtn);

    const input = screen.getByPlaceholderText('ej. ChatGPT Desktop Action');
    fireEvent.change(input, { target: { value: 'Copied Key' } });

    const submitBtn = screen.getByText('Generar Llave');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByTitle('Copiar llave')).toBeDefined();
    });

    const copyBtn = screen.getByTitle('Copiar llave');
    fireEvent.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalled();
  });

  test('revokes an active API key immediately', async () => {
    render(<ApiKeysManager />);

    await waitFor(() => {
      expect(screen.getByTitle('Revocar inmediatamente')).toBeDefined();
    });

    const revokeBtn = screen.getByTitle('Revocar inmediatamente');
    fireEvent.click(revokeBtn);

    await waitFor(() => {
      expect(screen.getByText('Revocada')).toBeDefined();
    });
  });
});
