/**
 * @file creative-schemas.test.ts
 * @layer Domain Test
 * @description Comprehensive unit tests for creative schemas, official dimensions (3000px, 9:16, 16:9),
 *              and cryptographic SHA-256 hash validation (HU-3.1 / SPEC-03-02).
 */

import { describe, it, expect } from 'vitest';
import {
  AssetFormatSchema,
  AspectRatioSchema,
  AssetStatusSchema,
  CANONICAL_DIMENSIONS,
  CreativeAssetSchema,
} from '../../../apps/web/src/lib/pipelines/creative/creative-schemas';

describe('Domain: Creative Schemas & Dimensions (HU-3.1 / SPEC-03-02)', () => {
  describe('Canonical Dimensions Invariants (@spec REQ-HU-3.1-01)', () => {
    it('enforces exact DSP cover art dimensions 1:1 at 3000x3000px', () => {
      // Arrange & Act
      const cover = CANONICAL_DIMENSIONS.COVER_1_1;

      // Assert
      expect(cover.width).toBe(3000);
      expect(cover.height).toBe(3000);
      expect(cover.aspectRatio).toBe('SQUARE_1_1');
    });

    it('enforces exact canvas/story dimensions 9:16 at 1080x1920px', () => {
      // Arrange & Act
      const story = CANONICAL_DIMENSIONS.STORY_9_16;

      // Assert
      expect(story.width).toBe(1080);
      expect(story.height).toBe(1920);
      expect(story.aspectRatio).toBe('PORTRAIT_9_16');
    });

    it('enforces exact header/banner dimensions 16:9 at 1920x1080px', () => {
      // Arrange & Act
      const banner = CANONICAL_DIMENSIONS.BANNER_16_9;

      // Assert
      expect(banner.width).toBe(1920);
      expect(banner.height).toBe(1080);
      expect(banner.aspectRatio).toBe('LANDSCAPE_16_9');
    });
  });

  describe('AssetFormatSchema & AspectRatioSchema (@spec REQ-HU-3.1-02)', () => {
    it('validates supported formats and aspect ratios', () => {
      // Act & Assert
      expect(AssetFormatSchema.parse('COVER_1_1')).toBe('COVER_1_1');
      expect(AssetFormatSchema.parse('STORY_9_16')).toBe('STORY_9_16');
      expect(AssetFormatSchema.parse('BANNER_16_9')).toBe('BANNER_16_9');
      expect(AssetFormatSchema.parse('SOCIAL_COPY')).toBe('SOCIAL_COPY');

      expect(AspectRatioSchema.parse('SQUARE_1_1')).toBe('SQUARE_1_1');
      expect(AspectRatioSchema.parse('PORTRAIT_9_16')).toBe('PORTRAIT_9_16');
      expect(AspectRatioSchema.parse('LANDSCAPE_16_9')).toBe('LANDSCAPE_16_9');
      expect(AspectRatioSchema.parse('NA')).toBe('NA');
    });

    it('rejects unsupported asset formats', () => {
      // Act & Assert
      expect(AssetFormatSchema.safeParse('THUMBNAIL_4_3').success).toBe(false);
    });
  });

  describe('CreativeAssetSchema Cryptographic Integrity (@spec REQ-HU-3.1-03)', () => {
    const validAsset = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      releaseId: '987fcdeb-51a2-43f7-9876-543210987654',
      format: 'COVER_1_1',
      aspectRatio: 'SQUARE_1_1',
      width: 3000,
      height: 3000,
      fileSizeBytes: 204800,
      storagePath: 'assets/987fcdeb/cover_3000.png',
      contentHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      mimeType: 'image/png',
      status: 'APPROVED',
    };

    it('validates a complete creative asset entity with 64-char SHA-256 hash', () => {
      // Act
      const parsed = CreativeAssetSchema.parse(validAsset);

      // Assert
      expect(parsed.id).toBe(validAsset.id);
      expect(parsed.width).toBe(3000);
      expect(parsed.height).toBe(3000);
      expect(parsed.contentHash).toBe(validAsset.contentHash);
      expect(parsed.status).toBe('APPROVED');
    });

    it('rejects invalid or truncated SHA-256 content hashes', () => {
      // Arrange
      const shortHash = { ...validAsset, contentHash: 'abc123' };
      const nonHexHash = {
        ...validAsset,
        contentHash: 'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
      };

      // Act & Assert
      expect(CreativeAssetSchema.safeParse(shortHash).success).toBe(false);
      expect(CreativeAssetSchema.safeParse(nonHexHash).success).toBe(false);
    });

    it('rejects non-positive dimensions', () => {
      // Arrange
      const zeroWidth = { ...validAsset, width: 0 };
      const negativeHeight = { ...validAsset, height: -100 };

      // Act & Assert
      expect(CreativeAssetSchema.safeParse(zeroWidth).success).toBe(false);
      expect(CreativeAssetSchema.safeParse(negativeHeight).success).toBe(false);
    });
  });
});
