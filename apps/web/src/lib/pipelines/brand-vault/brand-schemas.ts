/**
 * @file brand-schemas.ts
 * @layer Domain
 * @description Invariant Zod schemas and validation rules for Brand Vault entities (Labels & Artists).
 */

import { z } from 'zod';

/**
 * Strict hexadecimal color code schema with auto-trimming and normalization.
 * Accepts 3 or 6 hex digits with leading hash (e.g. #FFF, #1A1A1A).
 */
export const HexColorSchema = z
  .string()
  .trim()
  .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, {
    message: 'Color hexadecimal inválido. Formato esperado: #RGB o #RRGGBB (ej. #1A1A1A)',
  })
  .transform(val => val.toUpperCase());

/**
 * Typography definition schema declaring primary/secondary fonts and allowed weights.
 */
export const TypographySchema = z.object({
  primary: z.string().min(1, 'La tipografía primaria es obligatoria'),
  secondary: z.string().optional(),
  weights: z.array(z.number().int().min(100).max(900)).default([400, 700]),
});

/**
 * Social and DSP streaming links schema for artists and labels.
 */
export const SocialLinksSchema = z.object({
  spotify: z.string().url('URL de Spotify inválida').optional().or(z.literal('')),
  appleMusic: z.string().url('URL de Apple Music inválida').optional().or(z.literal('')),
  instagram: z.string().url('URL de Instagram inválida').optional().or(z.literal('')),
  youtube: z.string().url('URL de YouTube inválida').optional().or(z.literal('')),
  website: z.string().url('URL de sitio web inválida').optional().or(z.literal('')),
});

/**
 * Label profile schema representing the record label or publishing collective.
 */
export const LabelProfileSchema = z.object({
  id: z.string().uuid('ID de sello debe ser UUID v4'),
  name: z.string().min(1, 'El nombre del sello es obligatorio').max(120),
  legalName: z.string().max(160).optional(),
  bio: z.string().max(2000, 'La biografía no puede exceder 2000 caracteres').default(''),
  colorPalette: z
    .array(HexColorSchema)
    .min(1, 'La paleta debe incluir al menos 1 color primario')
    .max(6, 'La paleta admite un máximo de 6 colores')
    .default(['#0F172A', '#38BDF8']),
  typography: TypographySchema.default({
    primary: 'Inter',
    secondary: 'Roboto',
    weights: [400, 700],
  }),
  toneOfVoice: z.string().max(1000).default(''),
  socialLinks: SocialLinksSchema.default({}),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

/**
 * Artist profile schema representing musical creators nested within a Label.
 */
export const ArtistProfileSchema = z.object({
  id: z.string().uuid('ID de artista debe ser UUID v4'),
  labelId: z.string().uuid('ID de sello asignado debe ser UUID v4'),
  name: z.string().min(1, 'El nombre del artista es obligatorio').max(120),
  bio: z.string().max(2000, 'La biografía no puede exceder 2000 caracteres').default(''),
  genre: z.string().min(1, 'El género musical principal es obligatorio').max(60),
  subgenres: z.array(z.string().max(40)).default([]),
  colorPalette: z
    .array(HexColorSchema)
    .min(1, 'La paleta debe incluir al menos 1 color primario')
    .max(6, 'La paleta admite un máximo de 6 colores')
    .default(['#18181B', '#6366F1']),
  typography: TypographySchema.default({
    primary: 'Inter',
    secondary: 'Geist',
    weights: [400, 700],
  }),
  toneOfVoice: z.string().max(1000).default(''),
  socialLinks: SocialLinksSchema.default({}),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type Typography = z.infer<typeof TypographySchema>;
export type SocialLinks = z.infer<typeof SocialLinksSchema>;
export type LabelProfile = z.infer<typeof LabelProfileSchema>;
export type ArtistProfile = z.infer<typeof ArtistProfileSchema>;

export type CreateLabelInput = z.input<typeof LabelProfileSchema>;
export type UpdateLabelInput = Partial<Omit<CreateLabelInput, 'id' | 'createdAt'>>;

export type CreateArtistInput = z.input<typeof ArtistProfileSchema>;
export type UpdateArtistInput = Partial<Omit<CreateArtistInput, 'id' | 'labelId' | 'createdAt'>>;
