/**
 * @file brand-interview-orchestrator.test.ts
 * @layer Domain Test
 * @description Unit tests for BrandInterviewOrchestrator managing interview progression and synthesis dispatch.
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { BrandInterviewOrchestrator } from "../../../apps/web/src/lib/pipelines/agent/brand-interview-orchestrator";
import { GuardrailInterceptor } from "../../../apps/web/src/lib/pipelines/agent/guardrails/guardrail-interceptor";
import { createBrandTools } from "../../../apps/web/src/lib/pipelines/agent/tools/brand-tools";

describe("BrandInterviewOrchestrator (SPEC-06)", () => {
  const validArtistId = "11111111-2222-4333-8444-555555555555";
  let mockArtistRepo: any;
  let mockLabelRepo: any;
  let mockActionLogRepo: any;
  let interceptor: GuardrailInterceptor;
  let orchestrator: BrandInterviewOrchestrator;

  beforeEach(() => {
    mockArtistRepo = {
      findById: vi.fn(),
      create: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue({ id: validArtistId, name: "Test Artist" }),
    };
    mockLabelRepo = {
      findById: vi.fn(),
      create: vi.fn().mockResolvedValue(undefined),
    };
    mockActionLogRepo = {
      recordRequest: vi.fn().mockResolvedValue(undefined),
      updateStatus: vi.fn().mockResolvedValue(undefined),
    };

    interceptor = new GuardrailInterceptor(mockActionLogRepo);
    const tools = createBrandTools(mockArtistRepo, mockLabelRepo);
    orchestrator = new BrandInterviewOrchestrator(interceptor, tools, validArtistId);
  });

  test("tracks dimension progression as user discusses sound, vision, and narrative", () => {
    const p1 = orchestrator.processTurn("Mi sonido tiene bajos profundos y sintetizadores analógicos oscuros.");
    expect(p1.dimensionsCovered).toContain("sound");

    const p2 = orchestrator.processTurn("Visualmente quiero una estética brutalista con colores negro y cian (#06B6D4).");
    expect(p2.dimensionsCovered).toContain("vision");

    const p3 = orchestrator.processTurn("Nuestra narrativa habla del aislamiento en ciudades hiperconectadas.");
    expect(p3.dimensionsCovered).toContain("narrative");
    expect(p3.isReadyForSynthesis).toBe(true);
  });

  test("synthesizeAndDispatch calls actualizar_marca_artista through GuardrailInterceptor", async () => {
    const profileParams = {
      artistId: validArtistId,
      genre: "Darkwave",
      bio: "Proyecto solista de darkwave electrónico.",
      colorPalette: ["#000000", "#06B6D4"],
    };

    let capturedActionId: string | null = null;
    interceptor.onPendingChange(() => {
      const pending = interceptor.getPending();
      if (pending.length > 0) {
        capturedActionId = pending[0].id;
      }
    });

    const executionPromise = orchestrator.synthesizeAndDispatch(
      profileParams,
      "Sintetizar y guardar perfil de artista en SQLite"
    );

    expect(capturedActionId).toBeTruthy();

    // Human approves the guardrail action
    await interceptor.approve(capturedActionId!);

    const result = await executionPromise;
    expect(result.success).toBe(true);
    expect(mockArtistRepo.update).toHaveBeenCalled();
  });
});
