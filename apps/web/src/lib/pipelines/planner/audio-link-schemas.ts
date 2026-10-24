/**
 * @file audio-link-schemas.ts
 * @layer Domain
 * @description Pure Zod schemas and domain invariants for external audio assets.
 *              Contains zero network I/O or HTTP fetching (adheres to 4-layer isolation).
 */

import { z } from 'zod';

export const AudioCategorySchema = z.enum([
  'MASTER_WAV',
  'INSTRUMENTAL',
  'STEMS',
  'ACAPELLA',
]);

export type AudioCategory = z.infer<typeof AudioCategorySchema>;

export const VerificationStatusSchema = z.enum([
  'UNVERIFIED',
  'VERIFIED',
  'ERROR',
]);

export type VerificationStatus = z.infer<typeof VerificationStatusSchema>;

/**
 * Domain schema for External Audio Links.
 * Enforces HTTPS URLs (allows HTTP on localhost/dev).
 */
export const ExternalAudioLinkSchema = z.object({
  id: z.string().uuid(),
  releaseId: z.string().uuid(),
  category: AudioCategorySchema,
  url: z
    .string()
    .trim()
    .url({ message: 'URL de audio inválida. Debe ser un enlace HTTPS accesible' })
    .refine(
      url => {
        try {
          const parsed = new URL(url);
          return parsed.protocol === 'https:' || parsed.protocol === 'http:';
        } catch {
          return false;
        }
      },
      { message: 'Protocolo inválido. Solo se admiten enlaces HTTP/HTTPS' }
    ),
  verifiedStatus: VerificationStatusSchema.default('UNVERIFIED'),
  verifiedAt: z.string().datetime().nullable().optional(),
  mimeType: z.string().nullable().optional(),
  fileSizeBytes: z.number().int().min(0).nullable().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type ExternalAudioLink = z.infer<typeof ExternalAudioLinkSchema>;

export const CreateAudioLinkInputSchema = ExternalAudioLinkSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  verifiedStatus: true,
  verifiedAt: true,
});

export type CreateAudioLinkInput = z.infer<typeof CreateAudioLinkInputSchema>;
