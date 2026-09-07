/**
 * @file brand-schemas.test.ts
 * @layer Domain Test
 * @description Unit tests for Brand Vault Zod validation schemas and invariants.
 */

import { describe, test, expect } from 'vitest';
import {
  HexColorSchema,
  TypographySchema,
  SocialLinksSchema,
  ArtistProfileSchema,
  LabelProfileSchema,
} from '../../../apps/web/src/lib/pipelines/brand-vault/brand-schemas';

describe('Brand Vault Schemas & Domain Invariants', () => {
  describe('HexColorSchema', () => {
    test('accepts valid 6-digit hex color and normalizes to uppercase', () => {
      expect(HexColorSchema.parse('#1a2b3c')).toBe('#1A2B3C');
      expect(HexColorSchema.parse('#ffffff')).toBe('#FFFFFF');
    });

    test('accepts valid 3-digit shorthand hex color and normalizes', () => {
      expect(HexColorSchema.parse('#fff')).toBe('#FFF');
      expect(HexColorSchema.parse('#000')).toBe('#000');
    });

    test('rejects colors without leading hash', () => {
      expect(() => HexColorSchema.parse('1A2B3C')).toThrow();
    });

    test('rejects non-hex characters', () => {
      expect(() => HexColorSchema.parse('#ZZZZZZ')).toThrow();
      expect(() => HexColorSchema.parse('#12345G')).toThrow();
    });

    test('rejects invalid length hex strings', () => {
      expect(() => HexColorSchema.parse('#12')).toThrow();
      expect(() => HexColorSchema.parse('#1234567')).toThrow();
    });
  });

  describe('ArtistProfileSchema', () => {
    const validArtist = {
      id: 'a0000000-0000-4000-8000-000000000001',
      labelId: 'b0000000-0000-4000-8000-000000000001',
      name: 'Starlight Collective',
      genre: 'Electronic',
      colorPalette: ['#0F172A', '#38BDF8'],
    };

    test('validates valid artist profile with default fallbacks', () => {
      const parsed = ArtistProfileSchema.parse(validArtist);
      expect(parsed.name).toBe('Starlight Collective');
      expect(parsed.genre).toBe('Electronic');
      expect(parsed.bio).toBe('');
      expect(parsed.subgenres).toEqual([]);
      expect(parsed.typography.primary).toBe('Inter');
    });

    test('rejects palette with more than 6 colors', () => {
      const excessiveColors = {
        ...validArtist,
        colorPalette: ['#001', '#002', '#003', '#004', '#005', '#006', '#007'],
      };
      expect(() => ArtistProfileSchema.parse(excessiveColors)).toThrow(
        'La paleta admite un máximo de 6 colores'
      );
    });

    test('rejects empty name or invalid uuid', () => {
      expect(() =>
        ArtistProfileSchema.parse({ ...validArtist, name: '' })
      ).toThrow();
      expect(() =>
        ArtistProfileSchema.parse({ ...validArtist, id: 'invalid-id' })
      ).toThrow();
    });
  });

  describe('LabelProfileSchema', () => {
    test('validates record label profile', () => {
      const label = {
        id: 'c0000000-0000-4000-8000-000000000001',
        name: 'Astral Wave Records',
        colorPalette: ['#111827', '#F43F5E'],
      };
      const parsed = LabelProfileSchema.parse(label);
      expect(parsed.name).toBe('Astral Wave Records');
      expect(parsed.colorPalette).toEqual(['#111827', '#F43F5E']);
    });
  });
});
