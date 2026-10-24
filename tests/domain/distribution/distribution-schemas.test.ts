/**
 * @file distribution-schemas.test.ts
 * @layer Domain Test
 * @description Unit tests for distribution Zod schemas and validation rules (HU-4.3, HU-4.1, HU-4.2 / SPEC-04-01).
 *              Verifies platform enums, health statuses, budget constraints ($20–$100), and entity schemas.
 */

import { describe, test, expect } from 'vitest';
import {
  SocialPlatformSchema,
  HealthStatusSchema,
  BudgetUsdSchema,
  SocialConnectionSchema,
  ScheduledPostSchema,
  AdCampaignSchema,
  MediaHandshakePayloadSchema,
} from '../../../apps/web/src/lib/pipelines/distribution/distribution-schemas';

describe('Domain: distribution-schemas (HU-4.3 / SPEC-04-01)', () => {
  const validUuid = '11111111-1111-4111-8111-111111111111';
  const validSha256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

  test('@spec REQ-HU-4.3-01: validates all 7 supported social and advertising platforms', () => {
    const validPlatforms = [
      'INSTAGRAM',
      'TIKTOK',
      'TWITTER_X',
      'YOUTUBE',
      'FACEBOOK',
      'META_ADS',
      'TIKTOK_ADS',
    ];

    for (const p of validPlatforms) {
      expect(SocialPlatformSchema.parse(p)).toBe(p);
    }

    expect(() => SocialPlatformSchema.parse('LINKEDIN')).toThrow();
  });

  test('@spec REQ-HU-4.3-02: validates health status enum transitions', () => {
    expect(HealthStatusSchema.parse('CONNECTED')).toBe('CONNECTED');
    expect(HealthStatusSchema.parse('EXPIRED')).toBe('EXPIRED');
    expect(HealthStatusSchema.parse('DISCONNECTED')).toBe('DISCONNECTED');
    expect(() => HealthStatusSchema.parse('UNKNOWN')).toThrow();
  });

  test('@spec REQ-HU-4.2-01: enforces strict microcampaign budget boundaries between $20.00 and $100.00 USD', () => {
    // Valid boundaries
    expect(BudgetUsdSchema.parse(20)).toBe(20);
    expect(BudgetUsdSchema.parse(50)).toBe(50);
    expect(BudgetUsdSchema.parse(100)).toBe(100);

    // Below minimum
    expect(() => BudgetUsdSchema.parse(19.99)).toThrow(/mínimo/);
    expect(() => BudgetUsdSchema.parse(0)).toThrow(/mínimo/);

    // Above maximum
    expect(() => BudgetUsdSchema.parse(100.01)).toThrow(/máximo/);
    expect(() => BudgetUsdSchema.parse(500)).toThrow(/máximo/);
  });

  test('@spec REQ-HU-4.3-03: validates full SocialConnection entity schema', () => {
    const connection = {
      id: validUuid,
      labelId: '22222222-2222-4222-8222-222222222222',
      platform: 'INSTAGRAM',
      accountName: '@solarisrecords',
      accountId: 'ig-acc-12345',
      healthStatus: 'CONNECTED',
    };

    const parsed = SocialConnectionSchema.parse(connection);
    expect(parsed.id).toBe(validUuid);
    expect(parsed.healthStatus).toBe('CONNECTED');
  });

  test('@spec REQ-HU-4.1-01: validates ScheduledPost schema with ISO-8601 UTC date and SHA-256 hash', () => {
    const post = {
      id: validUuid,
      releaseId: '33333333-3333-4333-8333-333333333333',
      platform: 'TWITTER_X',
      postText: '¡Ya disponible nuestro nuevo sencillo! Escúchalo en Spotify.',
      scheduledTime: '2026-11-20T14:00:00.000Z',
      mediaUrl: 'https://r2.postiz.com/assets/artwork.png',
      mediaHash: validSha256,
      status: 'QUEUED',
    };

    const parsed = ScheduledPostSchema.parse(post);
    expect(parsed.id).toBe(validUuid);
    expect(parsed.mediaHash).toBe(validSha256);
    expect(parsed.status).toBe('QUEUED');
  });

  test('@spec REQ-HU-4.2-02: validates AdCampaign schema with URL validation and budget constraints', () => {
    const campaign = {
      id: validUuid,
      releaseId: '33333333-3333-4333-8333-333333333333',
      platform: 'META_ADS',
      budgetUsd: 75.0,
      destinationUrl: 'https://distrokid.com/hyperfollow/artist/single',
      targetAudience: 'Fans de synthwave e indie electrónico en LATAM',
      startDate: '2026-11-15T00:00:00.000Z',
      endDate: '2026-11-22T00:00:00.000Z',
      status: 'DRAFT',
    };

    const parsed = AdCampaignSchema.parse(campaign);
    expect(parsed.budgetUsd).toBe(75.0);
    expect(parsed.platform).toBe('META_ADS');
  });

  test('@spec REQ-HU-4.1-02: validates MediaHandshakePayloadSchema with pre-signed url and expiration', () => {
    const handshake = {
      contentHash: validSha256,
      fileName: 'single-cover-3000px.png',
      mimeType: 'image/png',
      fileSizeBytes: 4194304,
      preSignedUrl: 'https://storage.cloudflare.com/r2/upload?signature=xyz',
      expiresAt: '2026-11-20T15:00:00.000Z',
    };

    const parsed = MediaHandshakePayloadSchema.parse(handshake);
    expect(parsed.contentHash).toBe(validSha256);
    expect(parsed.fileSizeBytes).toBe(4194304);
  });
});
