/**
 * @file creative-prompt-builder.ts
 * @layer Domain
 * @description Pure functional builder that compiles 3-level brand context into deterministic,
 *              structured visual prompts. Zero network I/O, 100% agnostic to UI, zero classes.
 */

import { PromptBreakdown } from './prompt-schemas';

/**
 * 3-Level Brand Context required to build anchored visual prompts.
 */
export interface CreativeBrandContext {
  // Level 1: Label Ethos
  labelName?: string;
  labelTone?: string;

  // Level 2: Artist Identity
  artistName: string;
  genre: string;
  visualIdentity?: string;
  colorPalette?: string[];

  // Level 3: Release Concept
  releaseTitle: string;
  narrative: string;
  lyricTheme: string;
  soundMood: string;
}

/**
 * Compiles 3-level brand context into a structured visual PromptBreakdown.
 *
 * @param context - The 3-level brand and release context
 * @returns Pure structured PromptBreakdown
 */
export function buildCreativePrompt(context: CreativeBrandContext): PromptBreakdown {
  // Step 1: Synthesize visual subject from release title and narrative
  const subject = `Music cover art representing "${context.releaseTitle}" by ${context.artistName}, evoking ${context.soundMood}. Narrative essence: ${context.narrative}`;

  // Step 2: Determine aesthetic style anchored in artist genre and visual identity
  const style = context.visualIdentity
    ? `${context.genre} aesthetic with ${context.visualIdentity}`
    : `${context.genre} album cover photography, artistic conceptual composition`;

  // Step 3: Establish lighting and camera parameters
  const lighting = 'dramatic cinematic lighting with balanced chiaroscuro highlights';
  const camera = 'shot on 35mm film camera, Hasselblad depth of field, 8k resolution, fine art photography';

  // Step 4: Extract color palette accents
  const palette = context.colorPalette && context.colorPalette.length > 0
    ? context.colorPalette
    : ['#1A1A1A', '#E5E5E5'];

  // Step 5: Construct negative exclusion directives
  const negativeDirectives = [
    'deformed',
    'low resolution',
    'blurry',
    'extra limbs',
    'cluttered background',
    'watermark',
    'generic stock photo',
  ];

  return {
    subject,
    style,
    lighting,
    camera,
    palette,
    negativeDirectives,
  };
}

/**
 * Collapses a PromptBreakdown structure into a single coherent prompt string.
 *
 * @param breakdown - Structured prompt elements
 * @returns Canonical prompt string
 */
export function compilePromptToString(breakdown: PromptBreakdown): string {
  // Step 1: Collect prompt segments
  const segments: string[] = [
    breakdown.subject,
    breakdown.style,
    breakdown.lighting,
    breakdown.camera,
  ];

  // Step 2: Append color palette if available
  if (breakdown.palette.length > 0) {
    segments.push(`color tones: ${breakdown.palette.join(', ')}`);
  }

  // Step 3: Join into single descriptive string
  return segments.filter(Boolean).join(', ');
}
