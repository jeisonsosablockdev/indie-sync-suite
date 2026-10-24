/**
 * @file prompt-schemas.ts
 * @layer Domain
 * @description Invariant Zod schemas and TypeScript types for Creative Master Prompts,
 *              modular prompt breakdown, platform presets, and compilation rules.
 */

import { z } from 'zod';
import { AspectRatioSchema } from './creative-schemas';

// ==============================================================================
// Step 1: Platform Presets
// ==============================================================================

/**
 * Supported generative AI rendering platform syntaxes.
 */
export const PlatformPresetSchema = z.enum([
  'MIDJOURNEY_V6',
  'FLUX_SD',
  'RUNWAY_KLING',
  'RAW_TEXT',
]);
export type PlatformPreset = z.infer<typeof PlatformPresetSchema>;

// ==============================================================================
// Step 2: Modular Prompt Breakdown
// ==============================================================================

/**
 * Structured modular components that compose an artistic master prompt.
 */
export const PromptBreakdownSchema = z.object({
  subject: z.string().min(1, 'El sujeto visual principal es obligatorio'),
  style: z.string().min(1, 'El estilo artístico o estético es obligatorio'),
  lighting: z.string().default('cinematic natural lighting'),
  camera: z.string().default('shot on 35mm lens, f/1.8 aperture, sharp focus'),
  palette: z.array(z.string()).default([]),
  negativeDirectives: z.array(z.string()).default([
    'deformed',
    'low resolution',
    'watermark',
    'unrealistic anatomy',
    'blurry',
  ]),
});
export type PromptBreakdown = z.infer<typeof PromptBreakdownSchema>;

// ==============================================================================
// Step 3: Master Prompt Entity Schema
// ==============================================================================

/**
 * Strict schema validating persistent master prompt definitions.
 */
export const MasterPromptSchema = z.object({
  id: z.string().uuid('Prompt ID debe ser un UUID válido'),
  releaseId: z.string().uuid('Release ID debe ser un UUID válido'),
  promptText: z.string().min(3, 'El prompt no puede estar vacío'),
  negativePrompt: z.string().nullable().optional(),
  platformPreset: PlatformPresetSchema.default('MIDJOURNEY_V6'),
  aspectRatio: AspectRatioSchema.default('SQUARE_1_1'),
  version: z.number().int().positive().default(1),
  subject: z.string().min(1, 'El sujeto es obligatorio'),
  palette: z.string().nullable().optional(),
  lighting: z.string().nullable().optional(),
  camera: z.string().nullable().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});
export type MasterPrompt = z.infer<typeof MasterPromptSchema>;

/**
 * Formatted prompt output ready for user clipboard and platform execution.
 */
export const FormattedPromptOutputSchema = z.object({
  platformPreset: PlatformPresetSchema,
  compiledText: z.string(),
  aspectRatioFlag: z.string(),
  negativePrompt: z.string().optional(),
  estimatedTokens: z.number().int().nonnegative(),
});
export type FormattedPromptOutput = z.infer<typeof FormattedPromptOutputSchema>;
