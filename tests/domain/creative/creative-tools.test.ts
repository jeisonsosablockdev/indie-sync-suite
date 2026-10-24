/**
 * @file creative-tools.test.ts
 * @layer Domain Test
 * @description Unit tests for creative-tools and schemas (HU-6.1 v3 / SPEC-03-07).
 *              Verifies tool contracts, parameter Zod validation, risk tiers (Tier 1 safe vs Tier 2 sensitive), and port routing.
 */

import { describe, test, expect, vi } from 'vitest';
import {
  createCreativeTools,
  CREATIVE_TOOLS_DEFINITIONS,
  GenerarPortadaSchema,
  GenerarCopySchema,
  CopiarPromptSchema,
  ActualizarPromptSchema,
  ListarActivosAprobadosSchema,
  CreativeToolsPorts,
} from '../../../apps/web/src/lib/pipelines/creative/tools/creative-tools';

describe('Domain: creative-tools (HU-6.1 v3 / SPEC-03-07)', () => {
  const validUuid = '11111111-1111-4111-8111-111111111111';

  const mockPorts: CreativeToolsPorts = {
    generateCoverBatch: vi.fn().mockResolvedValue({ batchId: 'batch-123', status: 'PENDING' }),
    generateCopy: vi.fn().mockResolvedValue({ copy: '¡Ya disponible!' }),
    copyPrompt: vi.fn().mockResolvedValue({ promptText: '/imagine prompt: cosmic' }),
    updatePrompt: vi.fn().mockResolvedValue({ success: true }),
    listApprovedAssets: vi.fn().mockResolvedValue({ assets: [] }),
  };

  test('@spec REQ-HU-3.7-01: exposes all 5 tool definitions with proper metadata and risk tiers', () => {
    // Assert
    expect(CREATIVE_TOOLS_DEFINITIONS).toHaveLength(5);

    const portada = CREATIVE_TOOLS_DEFINITIONS.find((t) => t.name === 'generar_portada');
    expect(portada?.riskTier).toBe(2);

    const copy = CREATIVE_TOOLS_DEFINITIONS.find((t) => t.name === 'generar_copy');
    expect(copy?.riskTier).toBe(1);

    const copiarPrompt = CREATIVE_TOOLS_DEFINITIONS.find((t) => t.name === 'copiar_prompt');
    expect(copiarPrompt?.riskTier).toBe(1);

    const actualizarPrompt = CREATIVE_TOOLS_DEFINITIONS.find((t) => t.name === 'actualizar_prompt');
    expect(actualizarPrompt?.riskTier).toBe(2);

    const listar = CREATIVE_TOOLS_DEFINITIONS.find((t) => t.name === 'listar_activos_aprobados');
    expect(listar?.riskTier).toBe(1);
  });

  test('@spec REQ-HU-3.7-02: generar_portada validates UUID, defaults ratio to SQUARE_1_1, and executes port', async () => {
    // Arrange
    const tools = createCreativeTools(mockPorts);

    // Act
    const result = await tools.generarPortada.execute({
      releaseId: validUuid,
    });

    // Assert
    expect(tools.generarPortada.riskLevel).toBe('SENSITIVE');
    expect(tools.generarPortada.requiresConfirmationMessage).toBeDefined();
    expect(
      tools.generarPortada.requiresConfirmationMessage?.({
        releaseId: validUuid,
        aspectRatio: 'SQUARE_1_1',
      })
    ).toContain(validUuid);
    expect(mockPorts.generateCoverBatch).toHaveBeenCalledWith({
      releaseId: validUuid,
      aspectRatio: 'SQUARE_1_1',
    });
    expect(result).toEqual({ batchId: 'batch-123', status: 'PENDING' });
  });

  test('@spec REQ-HU-3.7-03: generar_copy validates phase and platform enums with SAFE risk level', async () => {
    // Arrange
    const tools = createCreativeTools(mockPorts);

    // Act
    await tools.generarCopy.execute({
      releaseId: validUuid,
      phase: 'T_ZERO',
      platform: 'INSTAGRAM',
    });

    // Assert
    expect(tools.generarCopy.riskLevel).toBe('SAFE');
    expect(mockPorts.generateCopy).toHaveBeenCalledWith({
      releaseId: validUuid,
      phase: 'T_ZERO',
      platform: 'INSTAGRAM',
    });
  });

  test('@spec REQ-HU-3.7-04: copiar_prompt defaults to MIDJOURNEY_V6 and executes port', async () => {
    // Arrange
    const tools = createCreativeTools(mockPorts);

    // Act
    await tools.copiarPrompt.execute({
      promptId: validUuid,
    });

    // Assert
    expect(tools.copiarPrompt.riskLevel).toBe('SAFE');
    expect(mockPorts.copyPrompt).toHaveBeenCalledWith({
      promptId: validUuid,
      platformPreset: 'MIDJOURNEY_V6',
    });
  });

  test('@spec REQ-HU-3.7-05: actualizar_prompt enforces confirmation guardrail and requires valid subject and prompt text', async () => {
    // Arrange
    const tools = createCreativeTools(mockPorts);

    // Act
    await tools.actualizarPrompt.execute({
      promptId: validUuid,
      subject: 'Retro neon synthesizer',
      promptText: 'Cinematic wide shot of synthwave city',
    });

    // Assert
    expect(tools.actualizarPrompt.riskLevel).toBe('SENSITIVE');
    expect(
      tools.actualizarPrompt.requiresConfirmationMessage?.({
        promptId: validUuid,
        subject: 'Synth',
        promptText: 'Long prompt',
      })
    ).toContain(validUuid);
    expect(mockPorts.updatePrompt).toHaveBeenCalled();
  });

  test('@spec REQ-HU-3.7-06: listar_activos_aprobados queries release approved deliverables', async () => {
    // Arrange
    const tools = createCreativeTools(mockPorts);

    // Act
    await tools.listarActivosAprobados.execute({
      releaseId: validUuid,
      format: 'COVER_1_1',
    });

    // Assert
    expect(tools.listarActivosAprobados.riskLevel).toBe('SAFE');
    expect(mockPorts.listApprovedAssets).toHaveBeenCalledWith({
      releaseId: validUuid,
      format: 'COVER_1_1',
    });
  });

  test('@spec REQ-HU-3.7-07: rejects invalid parameters with ZodError', () => {
    // Invalid UUID
    expect(() =>
      GenerarPortadaSchema.parse({
        releaseId: 'invalid-id',
      })
    ).toThrow();

    // Invalid phase enum
    expect(() =>
      GenerarCopySchema.parse({
        releaseId: validUuid,
        phase: 'INVALID_PHASE',
        platform: 'INSTAGRAM',
      })
    ).toThrow();

    // Short prompt text in ActualizarPrompt
    expect(() =>
      ActualizarPromptSchema.parse({
        promptId: validUuid,
        subject: 'Title',
        promptText: 'tiny',
      })
    ).toThrow();
  });
});
