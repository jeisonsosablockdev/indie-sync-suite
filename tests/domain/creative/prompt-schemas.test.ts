/**
 * @file prompt-schemas.test.ts
 * @layer Domain Test
 * @description Comprehensive unit test suite for Master Prompts and Platform Presets Zod schemas.
 *              Enforces strict AAA pattern, boundary checking, and zero tautologies per tdd-primal.
 */

import { describe, it, expect } from 'vitest';
import {
  PlatformPresetSchema,
  PromptBreakdownSchema,
  MasterPromptSchema,
  FormattedPromptOutputSchema,
} from '../../../apps/web/src/lib/pipelines/creative/prompt-schemas';

describe('Domain: Creative Prompt Schemas (HU-3.6 / SPEC-03-01)', () => {
  describe('PlatformPresetSchema (@spec REQ-HU-3.6-01)', () => {
    it('accepts valid platform presets', () => {
      // Arrange & Act
      const midjourney = PlatformPresetSchema.safeParse('MIDJOURNEY_V6');
      const flux = PlatformPresetSchema.safeParse('FLUX_SD');
      const runway = PlatformPresetSchema.safeParse('RUNWAY_KLING');
      const raw = PlatformPresetSchema.safeParse('RAW_TEXT');

      // Assert: Unconditional assertions
      expect(midjourney.success).toBe(true);
      expect(flux.success).toBe(true);
      expect(runway.success).toBe(true);
      expect(raw.success).toBe(true);
    });

    it('rejects invalid or unknown platform presets', () => {
      // Arrange & Act
      const invalid = PlatformPresetSchema.safeParse('DALLE_3_UNKNOWN');

      // Assert
      expect(invalid.success).toBe(false);
      expect(invalid.error?.issues[0].code).toBe('invalid_value');
    });
  });

  describe('PromptBreakdownSchema (@spec REQ-HU-3.6-02)', () => {
    it('validates a complete prompt breakdown with all parameters', () => {
      // Arrange
      const breakdown = {
        subject: 'Cyberpunk neon guitarist playing under rain',
        style: 'Synthwave retro-futuristic concept art',
        lighting: 'Neon reflections, dark moody atmosphere',
        camera: 'Shot on 35mm lens, f/1.4 shallow depth of field',
        palette: ['#FF0055', '#00FFFF', '#121212'],
        negativeDirectives: ['deformed', 'blurry', 'watermark'],
      };

      // Act: Direct parse ensuring no conditional guard bypassing
      const data = PromptBreakdownSchema.parse(breakdown);

      // Assert: Verify all properties explicitly
      expect(data.subject).toBe(breakdown.subject);
      expect(data.style).toBe(breakdown.style);
      expect(data.lighting).toBe(breakdown.lighting);
      expect(data.camera).toBe(breakdown.camera);
      expect(data.palette).toEqual(breakdown.palette);
      expect(data.negativeDirectives).toEqual(breakdown.negativeDirectives);
    });

    it('provides default fallback directives when optional fields are omitted', () => {
      // Arrange
      const minimal = {
        subject: 'A solitary pianist on a misty cliff',
        style: 'Minimalist oil painting',
      };

      // Act
      const data = PromptBreakdownSchema.parse(minimal);

      // Assert: Verify all defaulted properties
      expect(data.subject).toBe(minimal.subject);
      expect(data.style).toBe(minimal.style);
      expect(data.lighting).toBe('cinematic natural lighting');
      expect(data.camera).toBe('shot on 35mm lens, f/1.8 aperture, sharp focus');
      expect(data.palette).toEqual([]);
      expect(data.negativeDirectives).toEqual([
        'deformed',
        'low resolution',
        'watermark',
        'unrealistic anatomy',
        'blurry',
      ]);
    });

    it('fails when subject or style are empty strings', () => {
      // Arrange
      const emptySubject = { subject: '', style: 'Photography' };
      const emptyStyle = { subject: 'Drummer', style: '' };

      // Act & Assert
      expect(PromptBreakdownSchema.safeParse(emptySubject).success).toBe(false);
      expect(PromptBreakdownSchema.safeParse(emptyStyle).success).toBe(false);
    });
  });

  describe('MasterPromptSchema (@spec REQ-HU-3.6-03)', () => {
    it('validates a persisted master prompt with valid UUIDs and defaults', () => {
      // Arrange
      const input = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        releaseId: '987fcdeb-51a2-43f7-9876-543210987654',
        promptText: 'Epic orchestral symphony album cover with golden rays',
        subject: 'Orchestral hall with golden glow',
      };

      // Act
      const data = MasterPromptSchema.parse(input);

      // Assert
      expect(data.id).toBe(input.id);
      expect(data.releaseId).toBe(input.releaseId);
      expect(data.version).toBe(1);
      expect(data.platformPreset).toBe('MIDJOURNEY_V6');
      expect(data.aspectRatio).toBe('SQUARE_1_1');
    });

    it('rejects invalid UUIDs for both prompt id and release id', () => {
      // Arrange: Test invalid prompt ID
      const invalidPromptId = {
        id: 'not-a-valid-uuid',
        releaseId: '987fcdeb-51a2-43f7-9876-543210987654',
        promptText: 'Valid prompt text',
        subject: 'Valid subject',
      };

      // Arrange: Test invalid release ID
      const invalidReleaseId = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        releaseId: 'not-a-valid-release-uuid',
        promptText: 'Valid prompt text',
        subject: 'Valid subject',
      };

      // Act & Assert: Mutants killed on both fields
      const resPromptId = MasterPromptSchema.safeParse(invalidPromptId);
      expect(resPromptId.success).toBe(false);
      expect(resPromptId.error?.issues[0].path).toContain('id');

      const resReleaseId = MasterPromptSchema.safeParse(invalidReleaseId);
      expect(resReleaseId.success).toBe(false);
      expect(resReleaseId.error?.issues[0].path).toContain('releaseId');
    });

    it('rejects prompt text shorter than 3 characters', () => {
      // Arrange
      const shortPrompt = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        releaseId: '987fcdeb-51a2-43f7-9876-543210987654',
        promptText: 'hi',
        subject: 'Test',
      };

      // Act & Assert
      expect(MasterPromptSchema.safeParse(shortPrompt).success).toBe(false);
    });
  });

  describe('FormattedPromptOutputSchema (@spec REQ-HU-3.6-04)', () => {
    it('validates clean clipboard export payload', () => {
      // Arrange
      const output = {
        platformPreset: 'MIDJOURNEY_V6',
        compiledText: 'Jazz trumpeter in smoky club --ar 1:1 --v 6.0 --style raw',
        aspectRatioFlag: '--ar 1:1',
        negativePrompt: 'blurry, text, watermark',
        estimatedTokens: 18,
      };

      // Act
      const data = FormattedPromptOutputSchema.parse(output);

      // Assert
      expect(data.estimatedTokens).toBe(18);
      expect(data.aspectRatioFlag).toBe('--ar 1:1');
      expect(data.platformPreset).toBe('MIDJOURNEY_V6');
      expect(data.compiledText).toBe(output.compiledText);
    });

    it('rejects negative token estimations', () => {
      // Arrange
      const invalidTokens = {
        platformPreset: 'RAW_TEXT',
        compiledText: 'Test prompt',
        aspectRatioFlag: '--ar 1:1',
        estimatedTokens: -5,
      };

      // Act & Assert
      expect(FormattedPromptOutputSchema.safeParse(invalidTokens).success).toBe(false);
    });
  });
});
