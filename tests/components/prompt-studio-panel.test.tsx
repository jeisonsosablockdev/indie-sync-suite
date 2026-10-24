/**
 * @file prompt-studio-panel.test.tsx
 * @layer Presentation Test
 * @description UI unit tests for PromptStudioPanel component (HU-3.6 / SPEC-03-01).
 *              Verifies modular controls, platform preset selection, and 1-click clipboard copying.
 */

// @vitest-environment jsdom

import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PromptStudioPanel } from '../../apps/web/src/components/creative/prompt-studio-panel';

describe('PromptStudioPanel UI Component (HU-3.6 / SPEC-03-01)', () => {
  const releaseId = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(() => {
    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });
  });

  test('@spec REQ-HU-3.6-18: renders Prompt Studio header and modular breakdown inputs', () => {
    // Arrange & Act
    render(<PromptStudioPanel releaseId={releaseId} />);

    // Assert
    expect(screen.getByText('Prompt Studio & Text-Only Workflow')).toBeDefined();
    expect(screen.getByText('Sujeto Visual Central')).toBeDefined();
    expect(screen.getByText('Estilo Artístico y Estética')).toBeDefined();
    expect(screen.getByText('Iluminación y Atmósfera')).toBeDefined();
    expect(screen.getByText('Cámara y Composición Óptica')).toBeDefined();
  });

  test('@spec REQ-HU-3.6-19: renders all 4 platform preset buttons and Midjourney is active by default', () => {
    // Arrange & Act
    render(<PromptStudioPanel releaseId={releaseId} />);

    // Assert
    expect(screen.getByText('Midjourney v6')).toBeDefined();
    expect(screen.getByText('Flux.1 / SD')).toBeDefined();
    expect(screen.getByText('Runway / Kling')).toBeDefined();
    expect(screen.getByText('Texto Plano')).toBeDefined();

    // Verify Midjourney output contains --ar and --v flags
    const formattedDisplay = screen.getByTestId('formatted-prompt-output');
    expect(formattedDisplay.textContent).toContain('--ar 1:1');
    expect(formattedDisplay.textContent).toContain('--v 6.0');
  });

  test('@spec REQ-HU-3.6-20: switching preset to Flux.1 / SD switches formatting syntax', () => {
    // Arrange
    render(<PromptStudioPanel releaseId={releaseId} />);

    // Act
    const fluxButton = screen.getByText('Flux.1 / SD');
    fireEvent.click(fluxButton);

    // Assert: Midjourney flags are removed
    const formattedDisplay = screen.getByTestId('formatted-prompt-output');
    expect(formattedDisplay.textContent).not.toContain('--v 6.0');
    expect(formattedDisplay.textContent).not.toContain('--ar');
  });

  test('@spec REQ-HU-3.6-21: editing subject updates live compiled prompt', () => {
    // Arrange
    render(<PromptStudioPanel releaseId={releaseId} />);
    const subjectLabel = screen.getByText('Sujeto Visual Central');
    const subjectInput = subjectLabel.nextElementSibling as HTMLTextAreaElement;

    // Act
    fireEvent.change(subjectInput, {
      target: { value: 'Futuristic synthwave hovering sports car' },
    });

    // Assert
    const formattedDisplay = screen.getByTestId('formatted-prompt-output');
    expect(formattedDisplay.textContent).toContain('Futuristic synthwave hovering sports car');
  });

  test('@spec REQ-HU-3.6-22: clicking copy button invokes navigator.clipboard with exact compiled text and displays confirmation badge', async () => {
    // Arrange
    render(<PromptStudioPanel releaseId={releaseId} />);
    const copyButton = screen.getByText('Copiar 1-Clic');
    const formattedDisplay = screen.getByTestId('formatted-prompt-output');
    const expectedPayload = formattedDisplay.textContent;

    // Act
    fireEvent.click(copyButton);

    // Assert: Kills Mutant 3 by asserting exact payload match
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expectedPayload);
      expect(screen.getByText('¡Copiado!')).toBeDefined();
    });
  });

  test('@spec REQ-HU-3.6-23: clicking generate batch triggers callback with exact compiled prompt text', () => {
    // Arrange
    const onGenerateBatch = vi.fn();
    render(<PromptStudioPanel releaseId={releaseId} onGenerateBatch={onGenerateBatch} />);
    const formattedDisplay = screen.getByTestId('formatted-prompt-output');
    const expectedPayload = formattedDisplay.textContent;

    // Act
    const generateButton = screen.getByText('Generar Variantes');
    fireEvent.click(generateButton);

    // Assert: Kills Mutant 4 by asserting exact payload match
    expect(onGenerateBatch).toHaveBeenCalledTimes(1);
    expect(onGenerateBatch).toHaveBeenCalledWith(expectedPayload);
  });
});
