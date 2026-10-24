/**
 * @file distribution-schemas.ts
 * @layer Domain
 * @description Invariant Zod schemas and TypeScript types for connected social accounts,
 *              scheduled posts, programmatic ad micro-campaigns, and media handshake envelopes. Zero network I/O, zero classes.
 */

import { z } from 'zod';

// ==============================================================================
// Step 1: Enums & Value Objects
// ==============================================================================

export const SocialPlatformSchema = z.enum([
  'INSTAGRAM',
  'TIKTOK',
  'TWITTER_X',
  'YOUTUBE',
  'FACEBOOK',
  'META_ADS',
  'TIKTOK_ADS',
]);
export type SocialPlatform = z.infer<typeof SocialPlatformSchema>;

export const HealthStatusSchema = z.enum(['CONNECTED', 'EXPIRED', 'DISCONNECTED']);
export type HealthStatus = z.infer<typeof HealthStatusSchema>;

export const PostStatusSchema = z.enum(['DRAFT', 'QUEUED', 'PUBLISHED', 'FAILED']);
export type PostStatus = z.infer<typeof PostStatusSchema>;

export const AdPlatformSchema = z.enum(['META_ADS', 'TIKTOK_ADS']);
export type AdPlatform = z.infer<typeof AdPlatformSchema>;

export const AdCampaignStatusSchema = z.enum([
  'DRAFT',
  'PENDING_APPROVAL',
  'ACTIVE',
  'COMPLETED',
  'FAILED',
]);
export type AdCampaignStatus = z.infer<typeof AdCampaignStatusSchema>;

// Invariant: Budget must be strictly between $20.00 and $100.00 USD
export const BudgetUsdSchema = z
  .number()
  .min(20, 'El presupuesto mínimo para pauta programática es de $20.00 USD')
  .max(100, 'El presupuesto máximo por microcampaña es de $100.00 USD');

// ==============================================================================
// Step 2: Entity Schemas
// ==============================================================================

export const SocialConnectionSchema = z.object({
  id: z.string().uuid('Connection ID debe ser un UUID válido'),
  labelId: z.string().uuid('Label ID debe ser un UUID válido'),
  platform: SocialPlatformSchema,
  accountName: z.string().min(1, 'El nombre de la cuenta es obligatorio'),
  accountId: z.string().min(1, 'El ID de la cuenta externa es obligatorio'),
  healthStatus: HealthStatusSchema.default('CONNECTED'),
  accessTokenEncrypted: z.string().nullable().optional(),
  tokenExpiresAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});
export type SocialConnection = z.infer<typeof SocialConnectionSchema>;

export const ScheduledPostSchema = z.object({
  id: z.string().uuid('Post ID debe ser un UUID válido'),
  releaseId: z.string().uuid('Release ID debe ser un UUID válido'),
  assetId: z.string().uuid().nullable().optional(),
  platform: SocialPlatformSchema,
  postText: z.string().min(1, 'El texto del post no puede estar vacío'),
  scheduledTime: z.string().datetime({ message: 'La fecha programada debe ser ISO-8601 UTC' }),
  mediaUrl: z.string().url().nullable().optional(),
  mediaHash: z.string().regex(/^[a-f0-9]{64}$/i, 'Hash SHA-256 de 64 caracteres').nullable().optional(),
  postizPostId: z.string().nullable().optional(),
  status: PostStatusSchema.default('DRAFT'),
  errorMessage: z.string().nullable().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});
export type ScheduledPost = z.infer<typeof ScheduledPostSchema>;

export const AdCampaignSchema = z.object({
  id: z.string().uuid('Campaign ID debe ser un UUID válido'),
  releaseId: z.string().uuid('Release ID debe ser un UUID válido'),
  platform: AdPlatformSchema,
  budgetUsd: BudgetUsdSchema,
  destinationUrl: z.string().url('URL de destino debe ser un enlace web válido'),
  targetAudience: z.string().min(3, 'La descripción de audiencia debe tener al menos 3 caracteres'),
  startDate: z.string().datetime({ message: 'Fecha de inicio debe ser ISO-8601 UTC' }),
  endDate: z.string().datetime({ message: 'Fecha de fin debe ser ISO-8601 UTC' }),
  status: AdCampaignStatusSchema.default('DRAFT'),
  externalCampaignId: z.string().nullable().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});
export type AdCampaign = z.infer<typeof AdCampaignSchema>;

export const MediaHandshakePayloadSchema = z.object({
  contentHash: z.string().regex(/^[a-f0-9]{64}$/i),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  fileSizeBytes: z.number().int().positive(),
  preSignedUrl: z.string().url(),
  expiresAt: z.string().datetime(),
});
export type MediaHandshakePayload = z.infer<typeof MediaHandshakePayloadSchema>;
