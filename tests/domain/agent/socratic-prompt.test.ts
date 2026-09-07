/**
 * @file socratic-prompt.test.ts
 * @layer Domain Test
 * @description Unit tests for Socratic Brand Interview system prompt, golden rules, and context builder.
 */

import { describe, test, expect } from "vitest";
import {
  SOCRATIC_BRAND_SYSTEM_PROMPT,
  buildSocraticBrandPrompt,
} from "../../../apps/web/src/lib/pipelines/agent/prompts/socratic-interview-prompt";

describe("Socratic Brand Interview Prompt (SPEC-06)", () => {
  describe("SOCRATIC_BRAND_SYSTEM_PROMPT Golden Rules", () => {
    test("mandates single question per turn (Rule 1)", () => {
      expect(SOCRATIC_BRAND_SYSTEM_PROMPT).toContain("UNA SOLA");
      expect(SOCRATIC_BRAND_SYSTEM_PROMPT.toLowerCase()).toMatch(/pregunta.*a la vez/);
    });

    test("mandates exploration across 3 dimensions: Sonido, Visión, Narrativa (Rule 2)", () => {
      expect(SOCRATIC_BRAND_SYSTEM_PROMPT).toContain("Sonido");
      expect(SOCRATIC_BRAND_SYSTEM_PROMPT).toContain("Visión");
      expect(SOCRATIC_BRAND_SYSTEM_PROMPT).toContain("Narrativa");
    });

    test("mandates offering two paths if user is indecisive (Rule 3)", () => {
      expect(SOCRATIC_BRAND_SYSTEM_PROMPT.toLowerCase()).toMatch(/dos caminos|sugerir dos/);
    });

    test("mandates synthesis and invocation of actualizar_marca_artista tool (Rule 4)", () => {
      expect(SOCRATIC_BRAND_SYSTEM_PROMPT).toContain("actualizar_marca_artista");
      expect(SOCRATIC_BRAND_SYSTEM_PROMPT.toLowerCase()).toMatch(/sintetiza|brand vault/);
    });

    test("prohibits hallucinations and empty generic marketing copy", () => {
      expect(SOCRATIC_BRAND_SYSTEM_PROMPT.toLowerCase()).toMatch(/no alucinar|autenticidad|sin clichés|cliché/);
    });
  });

  describe("buildSocraticBrandPrompt Context Builder", () => {
    test("returns base prompt when no existing context is provided", () => {
      const prompt = buildSocraticBrandPrompt();
      expect(prompt).toContain(SOCRATIC_BRAND_SYSTEM_PROMPT);
      expect(prompt).not.toContain("Contexto de Marca Existente");
    });

    test("injects existing artist brand context into the prompt when provided", () => {
      const prompt = buildSocraticBrandPrompt({
        name: "Solaris Duo",
        genre: "Synthwave",
        bio: "Dúo retrofuturista de sintetizadores analógicos.",
        colorPalette: ["#0F172A", "#06B6D4"],
      });

      expect(prompt).toContain(SOCRATIC_BRAND_SYSTEM_PROMPT);
      expect(prompt).toContain("Contexto de Marca Existente:");
      expect(prompt).toContain("Solaris Duo");
      expect(prompt).toContain("Synthwave");
      expect(prompt).toContain("#06B6D4");
      expect(prompt).toContain("Dúo retrofuturista");
    });
  });
});
