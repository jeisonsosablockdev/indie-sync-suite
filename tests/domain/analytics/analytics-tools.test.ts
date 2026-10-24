/**
 * @file analytics-tools.test.ts
 * @layer Domain Test
 * @description Unit tests for AI Assistant analytics tools and contracts (HU-5.3 & HU-6.1 v5 / SPEC-05-06).
 *              Verifies parameter schemas, risk levels (Tier 1 Safe vs Tier 2 Guardrail),
 *              and tool execution against ports.
 */

import { describe, test, expect, vi } from 'vitest';
import {
  createAnalyticsTools,
  AnalyticsToolsPorts,
  ANALYTICS_TOOLS_DEFINITIONS,
  ConsultarMetricasRendimientoSchema,
  AnalizarEficienciaPautaSchema,
  GenerarPanelCustomSchema,
} from '../../../apps/web/src/lib/pipelines/analytics/tools/analytics-tools';

describe('Domain: AnalyticsTools (SPEC-05-06)', () => {
  const releaseId = '33333333-3333-4333-8333-333333333333';

  describe('Schemas & Metadata', () => {
    test('defines correct metadata and risk levels for all 3 analytics tools', () => {
      expect(ANALYTICS_TOOLS_DEFINITIONS.length).toBe(3);

      const metricsMeta = ANALYTICS_TOOLS_DEFINITIONS.find(
        (t) => t.name === 'consultar_metricas_rendimiento'
      );
      expect(metricsMeta?.riskTier).toBe(1);

      const adMeta = ANALYTICS_TOOLS_DEFINITIONS.find((t) => t.name === 'analizar_eficiencia_pauta');
      expect(adMeta?.riskTier).toBe(1);

      const panelMeta = ANALYTICS_TOOLS_DEFINITIONS.find((t) => t.name === 'generar_panel_custom');
      expect(panelMeta?.riskTier).toBe(2);
    });

    test('validates ConsultarMetricasRendimientoSchema correctly', () => {
      const valid = { releaseId, timeWindow: 'DROP_WEEK' as const };
      expect(ConsultarMetricasRendimientoSchema.parse(valid)).toEqual(valid);

      expect(() =>
        ConsultarMetricasRendimientoSchema.parse({ releaseId: 'not-a-uuid' })
      ).toThrow();
    });

    test('validates AnalizarEficienciaPautaSchema correctly', () => {
      const valid = {
        releaseId,
        totalSpendUsd: 120.5,
        conversions: 350,
        totalClicks: 1400,
      };
      expect(AnalizarEficienciaPautaSchema.parse(valid)).toEqual(valid);

      // Negative values should fail
      expect(() =>
        AnalizarEficienciaPautaSchema.parse({
          releaseId,
          totalSpendUsd: -10,
          conversions: 10,
          totalClicks: 10,
        })
      ).toThrow();
    });

    test('validates GenerarPanelCustomSchema correctly', () => {
      const valid = {
        name: 'Panel Spotify',
        endpointUrl: 'https://api.spotify.com/v1/artists/123/stats',
        refreshIntervalSeconds: 120,
      };
      expect(GenerarPanelCustomSchema.parse(valid)).toEqual(valid);

      // Invalid URL should fail
      expect(() =>
        GenerarPanelCustomSchema.parse({
          name: 'Panel',
          endpointUrl: 'invalid-url',
        })
      ).toThrow();
    });
  });

  describe('createAnalyticsTools execution', () => {
    test('executes consultar_metricas_rendimiento as SAFE Tier 1 tool', async () => {
      const mockResult = { totalStreams: 50000, listeners: 12000 };
      const ports: AnalyticsToolsPorts = {
        getPerformanceMetrics: vi.fn().mockResolvedValue(mockResult),
        analyzeAdEfficiency: vi.fn(),
        createCustomDashboard: vi.fn(),
      };

      const tools = createAnalyticsTools(ports);
      expect(tools.consultarMetricasRendimiento.riskLevel).toBe('SAFE');

      const result = await tools.consultarMetricasRendimiento.execute({
        releaseId,
        timeWindow: 'ALL_TIME',
      });

      expect(result).toEqual(mockResult);
      expect(ports.getPerformanceMetrics).toHaveBeenCalledWith({
        releaseId,
        timeWindow: 'ALL_TIME',
      });
    });

    test('executes analizar_eficiencia_pauta as SAFE Tier 1 tool', async () => {
      const mockResult = { cpa: 0.35, cpc: 0.08, rating: 'EXCELLENT' };
      const ports: AnalyticsToolsPorts = {
        getPerformanceMetrics: vi.fn(),
        analyzeAdEfficiency: vi.fn().mockResolvedValue(mockResult),
        createCustomDashboard: vi.fn(),
      };

      const tools = createAnalyticsTools(ports);
      expect(tools.analizarEficienciaPauta.riskLevel).toBe('SAFE');

      const result = await tools.analizarEficienciaPauta.execute({
        releaseId,
        totalSpendUsd: 70,
        conversions: 200,
        totalClicks: 800,
      });

      expect(result).toEqual(mockResult);
      expect(ports.analyzeAdEfficiency).toHaveBeenCalledWith({
        releaseId,
        totalSpendUsd: 70,
        conversions: 200,
        totalClicks: 800,
      });
    });

    test('executes generar_panel_custom as SENSITIVE Tier 2 tool with confirmation message', async () => {
      const mockResult = { dashboardId: 'd-123', status: 'CREATED' };
      const ports: AnalyticsToolsPorts = {
        getPerformanceMetrics: vi.fn(),
        analyzeAdEfficiency: vi.fn(),
        createCustomDashboard: vi.fn().mockResolvedValue(mockResult),
      };

      const tools = createAnalyticsTools(ports);
      expect(tools.generarPanelCustom.riskLevel).toBe('SENSITIVE');

      // Check confirmation guardrail message
      const confirmationMsg = tools.generarPanelCustom.requiresConfirmationMessage?.({
        name: 'Panel TikTok',
        endpointUrl: 'https://api.tiktok.com/v1/metrics',
        refreshIntervalSeconds: 60,
      });

      expect(confirmationMsg).toContain('Panel TikTok');
      expect(confirmationMsg).toContain('https://api.tiktok.com/v1/metrics');
      expect(confirmationMsg).toContain('60s');

      const result = await tools.generarPanelCustom.execute({
        name: 'Panel TikTok',
        endpointUrl: 'https://api.tiktok.com/v1/metrics',
        refreshIntervalSeconds: 60,
      });

      expect(result).toEqual(mockResult);
      expect(ports.createCustomDashboard).toHaveBeenCalledWith({
        name: 'Panel TikTok',
        endpointUrl: 'https://api.tiktok.com/v1/metrics',
        refreshIntervalSeconds: 60,
      });
    });
  });
});
