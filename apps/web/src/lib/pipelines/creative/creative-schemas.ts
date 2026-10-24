/**
 * @file creative-schemas.ts
 * @layer Domain
 * @description Invariant Zod schemas and TypeScript types for creative asset dimensions
 *              (1:1 3000px, 9:16 1080x1920px, 16:9 1920x1080px), formats, statuses, and cryptographic integrity.
 */

import { z } from 'zod';

// ==============================================================================
// Step 1: Core Domain Enums
// ==============================================================================

/**
 * Supported deliverable asset formats across DSPs and social channels.
 */
export const AssetFormatSchema = z.enum([
  'COVER_1_1',
  'STORY_9_16',
  'BANNER_16_9',
  'SOCIAL_COPY',
]);
export type AssetFormat = z.infer<typeof AssetFormatSchema>;

/**
 * Geometric aspect ratios for multimodal image and video pipelines.
 */
export const AspectRatioSchema = z.enum([
  'SQUARE_1_1',
  'PORTRAIT_9_16',
  'LANDSCAPE_16_9',
  'NA',
]);
export type AspectRatio = z.infer<typeof AspectRatioSchema>;

/**
 * Lifecycle triage statuses for creative deliverables.
 */
export const AssetStatusSchema = z.enum([
  'DRAFT',
  'APPROVED',
  'REJECTED',
  'DISCARDED',
]);
export type AssetStatus = z.infer<typeof AssetStatusSchema>;

// ==============================================================================
// Step 2: Dimension Specifications & DSP Presets
// ==============================================================================

export const DimensionSpecSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  aspectRatio: AspectRatioSchema,
});
export type DimensionSpec = z.infer<typeof DimensionSpecSchema>;

/**
 * Official dimension constants per DSP and social platform specifications.
 */
export const CANONICAL_DIMENSIONS: Record<Exclude<AssetFormat, 'SOCIAL_COPY'>, DimensionSpec> = {
  COVER_1_1: {
    width: 3000,
    height: 3000,
    aspectRatio: 'SQUARE_1_1',
  },
  STORY_9_16: {
    width: 1080,
    height: 1920,
    aspectRatio: 'PORTRAIT_9_16',
  },
  BANNER_16_9: {
    width: 1920,
    height: 1080,
    aspectRatio: 'LANDSCAPE_16_9',
  },
};

// ==============================================================================
// Step 3: Creative Asset Entity Schema
// ==============================================================================

/**
 * Strict schema validating creative assets with cryptographic SHA-256 hash.
 */
export const CreativeAssetSchema = z.object({
  id: z.string().uuid('Asset ID debe ser un UUID válido'),
  releaseId: z.string().uuid('Release ID debe ser un UUID válido'),
  batchId: z.string().uuid().nullable().optional(),
  deliverableId: z.string().uuid().nullable().optional(),
  promptId: z.string().uuid().nullable().optional(),
  format: AssetFormatSchema,
  aspectRatio: AspectRatioSchema,
  width: z.number().int().positive('Ancho debe ser mayor a 0'),
  height: z.number().int().positive('Alto debe ser mayor a 0'),
  storagePath: z.string().min(1, 'Ruta de almacenamiento es obligatoria'),
  contentHash: z
    .string()
    .regex(/^[a-f0-9]{64}$/i, 'Hash de integridad SHA-256 debe tener 64 caracteres hexadecimales'),
  mimeType: z.string().min(1, 'Mime type es obligatorio'),
  fileSizeBytes: z.number().int().nonnegative('El tamaño del archivo no puede ser negativo'),
  status: AssetStatusSchema.default('DRAFT'),
  metadataJson: z.string().nullable().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type CreativeAsset = z.infer<typeof CreativeAssetSchema>;
