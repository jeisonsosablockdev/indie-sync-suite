/**
 * @file distribution-tools.test.ts
 * @layer Domain Test
 * @description Unit tests for createDistributionTools and schemas (HU-6.1 v4 / SPEC-04-06).
 *              Verifies tool contracts, Zod parameter validation, risk levels (SAFE Tier 1 vs SENSITIVE Tier 2),
 *              and confirmation message generators.
 */

import { describe, test, expect, vi } from 'vitest';
import {
  createDistributionTools,
  DISTRIBUTION_TOOLS_DEFINITIONS,
  ProgramarPublicacionSchema,
  LanzarCampanaPautaSchema,
  ConsultarCalendarioPostsSchema,
} from '../../../apps/web/src/lib/pipelines/distribution/tools/distribution-tools';
import { SocialPlatform } from '../../../apps/web/src/lib/pipelines/distribution/distribution-schemas';

describe('Distribution AI Agent Tools (HU-6.1 v4 / SPEC-04-06)', () => {
  const validReleaseId = '11111111-1111-4111-8111-111111111111';

  test('validates metadata registry definitions and risk tiers', () => {
    expect(DISTRIBUTION_TOOLS_DEFINITIONS).toHaveLength(3);

    const programar = DISTRIBUTION_TOOLS_DEFINITIONS.find((t) => t.name === 'programar_publicacion')!;
    const pauta = DISTRIBUTION_TOOLS_DEFINITIONS.find((t) => t.name === 'lanzar_campana_pauta')!;
    const calendario = DISTRIBUTION_TOOLS_DEFINITIONS.find((t) => t.name === 'consultar_calendario_posts')!;

    expect(programar.riskTier).toBe(1);
    expect(pauta.riskTier).toBe(2);
    expect(calendario.riskTier).toBe(1);
  });

  describe('programar_publicacion tool', () => {
    test('has SAFE risk level and executes port successfully with valid parameters', async () => {
      const schedulePostMock = vi.fn().mockResolvedValue({ success: true, postId: 'post-1' });
      const tools = createDistributionTools({
        schedulePost: schedulePostMock,
        launchAdCampaign: vi.fn(),
        getScheduledPosts: vi.fn(),
      });

      expect(tools.programarPublicacion.riskLevel).toBe('SAFE');

      const params = {
        releaseId: validReleaseId,
        platforms: ['INSTAGRAM', 'TIKTOK'] as SocialPlatform[],
        postText: 'Neon Horizon dropping this Friday! #newmusic',
        scheduledTime: '2026-11-15T18:00:00.000Z',
      };

      const result = await tools.programarPublicacion.execute(params);
      expect(result).toEqual({ success: true, postId: 'post-1' });
      expect(schedulePostMock).toHaveBeenCalledWith(params);
    });

    test('rejects execution when parameters violate Zod schema', async () => {
      const tools = createDistributionTools({
        schedulePost: vi.fn(),
        launchAdCampaign: vi.fn(),
        getScheduledPosts: vi.fn(),
      });

      // Empty platforms
      await expect(
        tools.programarPublicacion.execute({
          releaseId: validReleaseId,
          platforms: [],
          postText: 'Hello',
          scheduledTime: '2026-11-15T18:00:00.000Z',
        })
      ).rejects.toThrow();

      // Invalid UUID
      await expect(
        tools.programarPublicacion.execute({
          releaseId: 'invalid-uuid',
          platforms: ['INSTAGRAM'],
          postText: 'Hello',
          scheduledTime: '2026-11-15T18:00:00.000Z',
        })
      ).rejects.toThrow('ID de release debe ser un UUID válido');
    });
  });

  describe('lanzar_campana_pauta tool (Tier 2 Guardrail)', () => {
    test('has SENSITIVE risk level and generates confirmation message', () => {
      const tools = createDistributionTools({
        schedulePost: vi.fn(),
        launchAdCampaign: vi.fn(),
        getScheduledPosts: vi.fn(),
      });

      expect(tools.lanzarCampanaPauta.riskLevel).toBe('SENSITIVE');
      expect(tools.lanzarCampanaPauta.requiresConfirmationMessage).toBeDefined();

      const msg = tools.lanzarCampanaPauta.requiresConfirmationMessage!({
        releaseId: validReleaseId,
        platform: 'META_ADS',
        budgetUsd: 50.0,
        destinationUrl: 'https://distrokid.com/1',
        targetAudience: 'Indie fans',
        durationDays: 7,
      });

      expect(msg).toContain('META_ADS');
      expect(msg).toContain('$50.00 USD');
      expect(msg).toContain('7 días');
    });

    test('executes port with valid parameters within $20–$100 USD', async () => {
      const launchMock = vi.fn().mockResolvedValue({ campaignId: 'camp-99', status: 'ACTIVE' });
      const tools = createDistributionTools({
        schedulePost: vi.fn(),
        launchAdCampaign: launchMock,
        getScheduledPosts: vi.fn(),
      });

      const params = {
        releaseId: validReleaseId,
        platform: 'TIKTOK_ADS' as const,
        budgetUsd: 35.0,
        destinationUrl: 'https://distrokid.com/hyperfollow/astra/neon',
        targetAudience: 'Electronic music enthusiasts',
        durationDays: 5,
      };

      const result = await tools.lanzarCampanaPauta.execute(params);
      expect(result).toEqual({ campaignId: 'camp-99', status: 'ACTIVE' });
      expect(launchMock).toHaveBeenCalledWith(params);
    });

    test('rejects execution when budget is outside $20–$100 USD', async () => {
      const tools = createDistributionTools({
        schedulePost: vi.fn(),
        launchAdCampaign: vi.fn(),
        getScheduledPosts: vi.fn(),
      });

      // Below 20
      await expect(
        tools.lanzarCampanaPauta.execute({
          releaseId: validReleaseId,
          platform: 'META_ADS',
          budgetUsd: 15.0,
          destinationUrl: 'https://distrokid.com/1',
          targetAudience: 'Test',
        })
      ).rejects.toThrow();

      // Above 100
      await expect(
        tools.lanzarCampanaPauta.execute({
          releaseId: validReleaseId,
          platform: 'META_ADS',
          budgetUsd: 120.0,
          destinationUrl: 'https://distrokid.com/1',
          targetAudience: 'Test',
        })
      ).rejects.toThrow();
    });
  });

  describe('consultar_calendario_posts tool', () => {
    test('has SAFE risk level and executes port querying scheduled posts', async () => {
      const getPostsMock = vi.fn().mockResolvedValue([{ id: 'post-1' }, { id: 'post-2' }]);
      const tools = createDistributionTools({
        schedulePost: vi.fn(),
        launchAdCampaign: vi.fn(),
        getScheduledPosts: getPostsMock,
      });

      expect(tools.consultarCalendarioPosts.riskLevel).toBe('SAFE');

      const result = await tools.consultarCalendarioPosts.execute({
        releaseId: validReleaseId,
      });

      expect(result).toEqual([{ id: 'post-1' }, { id: 'post-2' }]);
      expect(getPostsMock).toHaveBeenCalledWith({ releaseId: validReleaseId });
    });
  });
});
