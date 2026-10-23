/**
 * @file apps/web/src/lib/pipelines/agent/prompts/socratic-interview-prompt.ts
 * @layer Layer 3: Pipelines / Agent Prompts
 * @description Socratic brand interview prompt and contextual system prompt builder for music identity synthesis.
 */

import type { ArtistProfile } from "../../brand-vault/brand-types";

/**
 * System prompt defining the Socratic Brand Interview persona and strict conversational constraints.
 */
export const SOCRATIC_BRAND_SYSTEM_PROMPT = `
Eres el Director Creativo de Indie-Sync Suite. Tu misión es entrevistar al artista para destilar su identidad de marca única.

REGLAS DE ORO:
1. Haz UNA SOLA pregunta reflexiva a la vez. No abraces al usuario con listas de preguntas ni cuestionarios largos.
2. Indaga profundamente en tres dimensiones cardinales:
   - Sonido: influencias sonoras, texturas, tempo, instrumentación y atmósfera.
   - Visión: paletas cromáticas, cinematografía, iluminación, texturas visuales y vestuario.
   - Narrativa: valores, conflicto temático, tono de voz, mensaje existencial y arquetipo.
3. Si el usuario duda o da respuestas breves, sugiere dos caminos estéticos alternativos basados en su subgénero musical.
4. Cuando el usuario exprese satisfacción o las tres dimensiones estén exploradas, sintetiza el Brand Vault final e invoca la herramienta actualizar_marca_artista con los parámetros JSON requeridos.
5. Principio de autenticidad: No alucinar datos. Sin clichés vacíos de marketing corporativo. Cada decisión debe ser fiel a la visión underground o independiente del creador.
`.trim();

/**
 * Builds the complete system prompt injecting any pre-existing brand context into the prompt.
 *
 * @param existingContext - Optional partial artist profile already persisted in SQLite.
 * @returns Fully composed system prompt string ready for LLM instantiation.
 */
export function buildSocraticBrandPrompt(
  existingContext?: Partial<ArtistProfile>
): string {
  // Step 1: Start with the immutable Socratic base system prompt
  let prompt = SOCRATIC_BRAND_SYSTEM_PROMPT;

  // Step 2: Check if existing brand context is available
  if (existingContext && Object.keys(existingContext).length > 0) {
    const contextLines: string[] = [];

    if (existingContext.name) {
      contextLines.push(`- Nombre del Artista: ${existingContext.name}`);
    }
    if (existingContext.genre) {
      contextLines.push(`- Género / Subgénero: ${existingContext.genre}`);
    }
    if (existingContext.bio) {
      contextLines.push(`- Bio actual: ${existingContext.bio}`);
    }
    if (existingContext.colorPalette && existingContext.colorPalette.length > 0) {
      contextLines.push(`- Paleta de Color: ${existingContext.colorPalette.join(", ")}`);
    }
    if (existingContext.toneOfVoice) {
      contextLines.push(`- Tono de Voz: ${existingContext.toneOfVoice}`);
    }

    if (contextLines.length > 0) {
      // Step 3: Append context section with instructions not to re-ask known details
      prompt += `\n\nContexto de Marca Existente:\n${contextLines.join("\n")}\n\nUtiliza este contexto previo como punto de partida y no vuelvas a preguntar información que ya está definida a menos que el artista solicite modificarla.`;
    }
  }

  // Step 4: Return synthesized prompt
  return prompt;
}
