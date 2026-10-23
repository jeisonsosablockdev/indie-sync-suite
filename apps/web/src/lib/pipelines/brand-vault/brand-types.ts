/**
 * @file brand-types.ts
 * @layer Domain
 * @description Strongly-typed Brand Vault interfaces and mutation inputs derived from Zod schemas.
 */

import { z } from 'zod';
import {
  LabelProfileSchema,
  ArtistProfileSchema,
  TypographySchema,
  SocialLinksSchema,
} from './brand-schemas';

export type Typography = z.infer<typeof TypographySchema>;
export type SocialLinks = z.infer<typeof SocialLinksSchema>;
export type LabelProfile = z.infer<typeof LabelProfileSchema>;
export type ArtistProfile = z.infer<typeof ArtistProfileSchema>;

export type CreateLabelInput = z.input<typeof LabelProfileSchema>;
export type UpdateLabelInput = Partial<Omit<CreateLabelInput, 'id' | 'createdAt'>>;

export type CreateArtistInput = z.input<typeof ArtistProfileSchema>;
export type UpdateArtistInput = Partial<Omit<CreateArtistInput, 'id' | 'labelId' | 'createdAt'>>;
