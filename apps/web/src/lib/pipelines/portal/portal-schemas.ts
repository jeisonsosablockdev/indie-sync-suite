/**
 * @file portal-schemas.ts
 * @layer Domain
 * @description Invariant Zod contracts and TypeScript definitions for Artist Portal sessions,
 *              Magic Link tokens, deliverable reviews, open API keys, and MCP audit logs. Zero network I/O, zero classes.
 */

import { z } from 'zod';

// ==============================================================================
// Step 1: Magic Link & Portal Schemas
// ==============================================================================

export const MagicLinkTokenPayloadSchema = z.object({
  sessionId: z.string().uuid(),
  releaseId: z.string().uuid(),
  artistId: z.string().uuid(),
  exp: z.number().int().positive(),
});
export type MagicLinkTokenPayload = z.infer<typeof MagicLinkTokenPayloadSchema>;

export const ArtistPortalSessionSchema = z.object({
  id: z.string().uuid(),
  releaseId: z.string().uuid(),
  artistId: z.string().uuid(),
  tokenHash: z.string().min(16),
  expiresAt: z.string().datetime(),
  revokedAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime().optional(),
});
export type ArtistPortalSession = z.infer<typeof ArtistPortalSessionSchema>;

export const PortalReviewDecisionSchema = z.enum(['APPROVED', 'CHANGES_REQUESTED']);
export type PortalReviewDecision = z.infer<typeof PortalReviewDecisionSchema>;

export const PortalDeliverableReviewSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  deliverableId: z.string().uuid(),
  decision: PortalReviewDecisionSchema,
  feedbackText: z.string().optional(),
  createdAt: z.string().datetime().optional(),
});
export type PortalDeliverableReview = z.infer<typeof PortalDeliverableReviewSchema>;

// ==============================================================================
// Step 2: Open API Key Schemas
// ==============================================================================

export const ApiKeyScopeSchema = z.enum([
  'READ_RELEASES',
  'WRITE_TASKS',
  'READ_METRICS',
  'FULL_ACCESS',
]);
export type ApiKeyScope = z.infer<typeof ApiKeyScopeSchema>;

export const ExternalApiKeySchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(2),
  keyPrefix: z.string().startsWith('iss_live_'),
  keyHash: z.string().min(32),
  scopes: z.array(ApiKeyScopeSchema).min(1),
  lastUsedAt: z.string().nullable().optional(),
  revokedAt: z.string().nullable().optional(),
  createdAt: z.string().optional(),
});
export type ExternalApiKey = z.infer<typeof ExternalApiKeySchema>;

// ==============================================================================
// Step 3: MCP Protocol Audit Schemas
// ==============================================================================

export const McpAuditLogSchema = z.object({
  id: z.string().uuid(),
  method: z.string().min(1),
  paramsJson: z.string().nullable().optional(),
  clientInfo: z.string().optional(),
  status: z.enum(['SUCCESS', 'ERROR']),
  errorMessage: z.string().optional(),
  createdAt: z.string().optional(),
});
export type McpAuditLog = z.infer<typeof McpAuditLogSchema>;
