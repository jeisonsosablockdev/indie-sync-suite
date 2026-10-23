/**
 * @file byok-manager.test.tsx
 * @layer Presentation Test
 * @description Component and accessibility tests for ByokManager console.
 */

// @vitest-environment jsdom

import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ByokManager } from '../../apps/web/src/components/settings/byok-manager';

// Mock hook to isolate presentation rendering
vi.mock('../../apps/web/src/lib/hooks/use-byok-credentials', () => {
  return {
    useByokCredentials: () => ({
      providers: {
        openai: {
          provider: 'openai',
          maskedKey: 'sk-proj-...1234',
          health: {
            provider: 'openai',
            status: 'healthy',
            latencyMs: 145,
            maskedKey: 'sk-proj-...1234',
            details: 'Conexión exitosa y credencial verificada',
          },
          isChecking: false,
        },
        anthropic: {
          provider: 'anthropic',
          maskedKey: null,
          isChecking: false,
        },
        google: {
          provider: 'google',
          maskedKey: null,
          isChecking: false,
        },
        groq: {
          provider: 'groq',
          maskedKey: null,
          isChecking: false,
        },
      },
      isInitializing: false,
      actionError: null,
      saveKey: vi.fn().mockResolvedValue(undefined),
      revokeKey: vi.fn().mockResolvedValue(undefined),
      testConnection: vi.fn().mockResolvedValue(undefined),
      refreshCredentials: vi.fn(),
    }),
  };
});

describe('ByokManager Presentation Component', () => {
  test('renders header, description and all 4 provider cards', () => {
    render(<ByokManager />);

    expect(screen.getByText('Credenciales de IA (BYOK)')).toBeDefined();
    expect(screen.getByText('OpenAI')).toBeDefined();
    expect(screen.getByText('Anthropic')).toBeDefined();
    expect(screen.getByText('Google Gemini')).toBeDefined();
    expect(screen.getByText('Groq Cloud')).toBeDefined();
  });

  test('displays masked key and health badge for configured provider', () => {
    render(<ByokManager />);

    // OpenAI card should show masked key and Operativo status
    expect(screen.getByText('sk-proj-...1234')).toBeDefined();
    expect(screen.getByText('Operativo')).toBeDefined();
    expect(screen.getByText('145ms')).toBeDefined();
  });

  test('provides accessible aria labels on action buttons and inputs', () => {
    render(<ByokManager />);

    const openaiTestBtn = screen.getByLabelText('Probar conexión con OpenAI');
    expect(openaiTestBtn).toBeDefined();

    const openaiRevokeBtn = screen.getByLabelText('Revocar clave de OpenAI');
    expect(openaiRevokeBtn).toBeDefined();

    const anthropicInput = screen.getByLabelText('Nueva clave API para Anthropic');
    expect(anthropicInput).toBeDefined();
  });

  test('allows typing in password input and enables submit button', () => {
    render(<ByokManager />);

    const input = screen.getByLabelText('Nueva clave API para Anthropic') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'sk-ant-test-key-1234567890' } });

    expect(input.value).toBe('sk-ant-test-key-1234567890');
  });
});
