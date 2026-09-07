/**
 * @file apps/web/src/lib/pipelines/agent/brand-interview-orchestrator.ts
 * @layer Layer 3: Pipelines / Agent Domain
 * @description Domain orchestrator managing Socratic brand interview progression and sensitive tool dispatch via guardrails.
 */

import { GuardrailInterceptor } from "./guardrails/guardrail-interceptor";
import type { ToolDefinition, ToolExecutionContext } from "./tools/tool-contract";

export type DimensionName = "sound" | "vision" | "narrative";

export interface InterviewProgression {
  dimensionsCovered: DimensionName[];
  isReadyForSynthesis: boolean;
}

/**
 * Orchestrator guiding the Socratic Brand Interview process and executing safe/sensitive tool calls.
 */
export class BrandInterviewOrchestrator {
  private readonly coveredDimensions: Set<DimensionName> = new Set();
  private readonly toolMap: Map<string, ToolDefinition<any, any>>;

  /**
   * Initializes the brand interview orchestrator with guardrails and operational tools.
   *
   * @param interceptor - Guardrail interceptor enforcing human confirmation on sensitive actions.
   * @param tools - Collection or record of brand operational tools.
   * @param artistId - Target artist identifier to synthesize and update.
   */
  constructor(
    private readonly interceptor: GuardrailInterceptor,
    tools: ToolDefinition<any, any>[] | Record<string, ToolDefinition<any, any>>,
    private readonly artistId: string
  ) {
    // Step 1: Index tools for O(1) lookup
    this.toolMap = new Map();
    if (Array.isArray(tools)) {
      for (const t of tools) {
        this.toolMap.set(t.name, t);
      }
    } else {
      for (const [name, t] of Object.entries(tools)) {
        this.toolMap.set(name, t);
      }
    }
  }

  /**
   * Evaluates user responses to detect conceptual exploration across the 3 brand dimensions.
   *
   * @param userMessage - Latest message text entered by the artist.
   * @returns Current interview progression status and synthesis readiness flag.
   */
  processTurn(userMessage: string): InterviewProgression {
    // Step 1: Normalize user message text
    const text = userMessage.toLowerCase();

    // Step 2: Check sound keywords
    const soundKeywords = [
      "sonido", "bajo", "sintetizador", "tempo", "guitarra", "batería",
      "reverb", "melodía", "acústico", "distorsión", "ritmo", "armonía",
      "samples", "beat", "textura sonora"
    ];
    if (soundKeywords.some((k) => text.includes(k))) {
      this.coveredDimensions.add("sound");
    }

    // Step 3: Check vision keywords
    const visionKeywords = [
      "visión", "visual", "color", "paleta", "cine", "iluminación",
      "vestuario", "estética", "brutalista", "minimalista", "neon",
      "portada", "fotografía", "textura", "luz"
    ];
    if (visionKeywords.some((k) => text.includes(k))) {
      this.coveredDimensions.add("vision");
    }

    // Step 4: Check narrative keywords
    const narrativeKeywords = [
      "narrativa", "letra", "historia", "concepto", "mensaje", "valor",
      "emoción", "tono", "existencial", "significado", "tema", "aislamiento",
      "identidad", "filosofía"
    ];
    if (narrativeKeywords.some((k) => text.includes(k))) {
      this.coveredDimensions.add("narrative");
    }

    // Step 5: Check if all 3 dimensions have been explored
    const isReadyForSynthesis = this.coveredDimensions.size >= 3;

    // Step 6: Return progression snapshot
    return {
      dimensionsCovered: Array.from(this.coveredDimensions),
      isReadyForSynthesis,
    };
  }

  /**
   * Synthesizes brand identity parameters and dispatches the sensitive tool call through guardrails.
   *
   * @param profileParams - Structured artist profile parameters to apply.
   * @param confirmationMessage - Human-readable explanation shown in GuardrailModal.
   * @returns Execution result promise resolving once human confirms or rejects.
   */
  async synthesizeAndDispatch(
    profileParams: Record<string, unknown>,
    confirmationMessage: string
  ): Promise<{ success: boolean; result?: unknown; error?: string }> {
    // Step 1: Resolve the actualizar_marca_artista tool definition
    const tool = this.toolMap.get("actualizar_marca_artista");
    if (!tool) {
      throw new Error("Tool actualizar_marca_artista is not registered in orchestrator.");
    }

    // Step 2: Ensure artistId is set
    const mergedParams = {
      artistId: this.artistId,
      ...profileParams,
    };

    // Step 3: Delegate execution to the GuardrailInterceptor (Human-in-the-Loop)
    const context: ToolExecutionContext = {
      sessionContext: confirmationMessage ? { confirmationMessage } : undefined,
    };
    return this.interceptor.executeWithGuardrails(
      tool,
      mergedParams,
      context
    );
  }
}
