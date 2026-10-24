/**
 * @file release-concept-schemas.test.ts
 * @layer Domain Test
 * @description Unit tests for Release Concept (Contexto Nivel 3) Zod validation schemas and invariants.
 *              Strict TDD AAA structure and anti-tautology compliance.
 */

import { describe, test, expect } from 'vitest';
import {
  IsrcSchema,
  UpcSchema,
  ReleaseConceptSchema,
} from '../../../apps/web/src/lib/pipelines/planner/planner-schemas';

describe('Release Concept Schemas & Domain Invariants (SPEC-2.1.1.1)', () => {
  describe('IsrcSchema (ISO 3901)', () => {
    test('@spec SPEC-2.1.1.1: accepts valid hyphenated ISRC and normalizes to unhyphenated uppercase', () => {
      // Arrange
      const input = 'us-s1z-26-00001';

      // Act
      const result = IsrcSchema.parse(input);

      // Assert
      expect(result).toBe('USS1Z2600001');
    });

    test('@spec SPEC-2.1.1.1: accepts valid unhyphenated 12-char ISRC', () => {
      // Arrange
      const input = 'USS1Z2600001';

      // Act
      const result = IsrcSchema.parse(input);

      // Assert
      expect(result).toBe('USS1Z2600001');
    });

    test('@spec SPEC-2.1.1.1: accepts empty string or undefined as optional', () => {
      // Arrange & Act & Assert
      expect(IsrcSchema.parse('')).toBe('');
      expect(IsrcSchema.parse(undefined)).toBeUndefined();
    });

    test('@spec SPEC-2.1.1.1: rejects ISRC with invalid character format', () => {
      // Arrange: Country code cannot be digits, year must be digits
      const invalidChars = '12-ABC-XY-00001';

      // Act & Assert
      expect(() => IsrcSchema.parse(invalidChars)).toThrowError(/ISRC inválido/);
    });

    test('@spec SPEC-2.1.1.1: rejects ISRC with incorrect length', () => {
      // Arrange: Too short or too long
      const tooShort = 'US-S1Z-26-0001';
      const tooLong = 'US-S1Z-26-000001';

      // Act & Assert
      expect(() => IsrcSchema.parse(tooShort)).toThrowError();
      expect(() => IsrcSchema.parse(tooLong)).toThrowError();
    });
  });

  describe('UpcSchema (Universal Product Code)', () => {
    test('@spec SPEC-2.1.1.1: accepts valid 12-digit numeric UPC', () => {
      // Arrange
      const input = '012345678905';

      // Act
      const result = UpcSchema.parse(input);

      // Assert
      expect(result).toBe('012345678905');
    });

    test('@spec SPEC-2.1.1.1: accepts empty string or undefined as optional', () => {
      // Arrange & Act & Assert
      expect(UpcSchema.parse('')).toBe('');
      expect(UpcSchema.parse(undefined)).toBeUndefined();
    });

    test('@spec SPEC-2.1.1.1: rejects UPC containing alphabetical characters', () => {
      // Arrange
      const invalid = '01234567890A';

      // Act & Assert
      expect(() => UpcSchema.parse(invalid)).toThrowError(/Código UPC inválido/);
    });

    test('@spec SPEC-2.1.1.1: rejects UPC with invalid length (not 12 digits)', () => {
      // Arrange
      const shortUpc = '01234567890';
      const longUpc = '0123456789012';

      // Act & Assert
      expect(() => UpcSchema.parse(shortUpc)).toThrowError();
      expect(() => UpcSchema.parse(longUpc)).toThrowError();
    });
  });

  describe('ReleaseConceptSchema (Contexto Nivel 3)', () => {
    const validConcept = {
      id: 'a0000000-0000-4000-8000-000000000001',
      releaseId: 'b0000000-0000-4000-8000-000000000001',
      narrative: 'Exploración nostálgica del aislamiento nocturno en una metrópoli futurista.',
      lyricTheme: 'Desconexión emocional y redención urbana.',
      soundMood: 'Synthwave analógico oscuro, reverberaciones espaciosas, cajas 808 comprimidas.',
      isrc: 'US-S1Z-26-00001',
      upc: '123456789012',
      targetDate: '2026-11-20T00:00:00.000Z',
      budgetUsd: 1500.0,
      snapshotFrozen: false,
    };

    test('@spec SPEC-2.1.1.1: validates fully compliant ReleaseConcept object', () => {
      // Arrange & Act
      const parsed = ReleaseConceptSchema.parse(validConcept);

      // Assert
      expect(parsed.id).toBe(validConcept.id);
      expect(parsed.releaseId).toBe(validConcept.releaseId);
      expect(parsed.narrative).toBe(validConcept.narrative);
      expect(parsed.isrc).toBe('USS1Z2600001');
      expect(parsed.budgetUsd).toBe(1500.0);
      expect(parsed.snapshotFrozen).toBe(false);
    });

    test('@spec SPEC-2.1.1.1: rejects negative budget', () => {
      // Arrange
      const invalid = { ...validConcept, budgetUsd: -50.0 };

      // Act & Assert
      expect(() => ReleaseConceptSchema.parse(invalid)).toThrowError(/El presupuesto no puede ser negativo/);
    });

    test('@spec SPEC-2.1.1.1: rejects narrative with less than 5 characters', () => {
      // Arrange
      const invalid = { ...validConcept, narrative: 'Hola' };

      // Act & Assert
      expect(() => ReleaseConceptSchema.parse(invalid)).toThrowError(/al menos 5 caracteres/);
    });

    test('@spec SPEC-2.1.1.1: rejects non-ISO-8601 targetDate', () => {
      // Arrange
      const invalid = { ...validConcept, targetDate: '2026/11/20' };

      // Act & Assert
      expect(() => ReleaseConceptSchema.parse(invalid)).toThrowError(/cadena ISO-8601 válida en UTC/);
    });
  });
});
