/**
 * @file safe-fetch-client.test.ts
 * @layer Infrastructure Test
 * @description Integration tests for SafeFetchClient with Anti-SSRF URL validation (SPEC-05-06).
 *              Verifies rejection of loopback, RFC 1918 private subnets, cloud metadata (169.254.169.254),
 *              and valid execution against public endpoints.
 */

import { describe, test, expect, vi } from 'vitest';
import {
  assertSafeEndpointUrl,
  createSafeFetchClient,
} from '../../../apps/web/src/lib/infrastructure/api/safe-fetch-client';

describe('Infrastructure: SafeFetchClient Anti-SSRF (SPEC-05-06)', () => {
  describe('assertSafeEndpointUrl', () => {
    test('approves safe public HTTPS URLs', () => {
      expect(assertSafeEndpointUrl('https://api.spotify.com/v1/tracks')).toBe(true);
      expect(assertSafeEndpointUrl('https://graph.facebook.com/v19.0/act_123/insights')).toBe(true);
      expect(assertSafeEndpointUrl('https://my-artist-site.io/stats.json')).toBe(true);
    });

    test('approves safe public HTTP URLs', () => {
      expect(assertSafeEndpointUrl('http://public-telemetry.example.org/api/metrics')).toBe(true);
    });

    test('rejects non-http protocols', () => {
      expect(assertSafeEndpointUrl('ftp://ftp.example.com/data.json')).toBe(false);
      expect(assertSafeEndpointUrl('file:///etc/passwd')).toBe(false);
      expect(assertSafeEndpointUrl('javascript:alert(1)')).toBe(false);
      expect(assertSafeEndpointUrl('invalid-url-string')).toBe(false);
    });

    test('rejects loopback and local hostnames', () => {
      expect(assertSafeEndpointUrl('http://localhost:3000/metrics')).toBe(false);
      expect(assertSafeEndpointUrl('https://localhost/api')).toBe(false);
      expect(assertSafeEndpointUrl('http://127.0.0.1:8080/data')).toBe(false);
      expect(assertSafeEndpointUrl('http://0.0.0.0/test')).toBe(false);
      expect(assertSafeEndpointUrl('http://[::1]:8080/metrics')).toBe(false);
    });

    test('rejects private IPv4 subnets (RFC 1918)', () => {
      // 10.0.0.0/8
      expect(assertSafeEndpointUrl('http://10.0.0.1/status')).toBe(false);
      expect(assertSafeEndpointUrl('https://10.254.12.5/admin')).toBe(false);

      // 192.168.0.0/16
      expect(assertSafeEndpointUrl('http://192.168.1.1/router')).toBe(false);
      expect(assertSafeEndpointUrl('https://192.168.100.24/metrics')).toBe(false);

      // 172.16.0.0/12
      expect(assertSafeEndpointUrl('http://172.16.0.5/api')).toBe(false);
      expect(assertSafeEndpointUrl('http://172.31.255.255/api')).toBe(false);
      // But 172.32.0.1 is public
      expect(assertSafeEndpointUrl('https://172.32.0.1/api')).toBe(true);
    });

    test('rejects cloud instance metadata IP (169.254.169.254)', () => {
      expect(assertSafeEndpointUrl('http://169.254.169.254/latest/meta-data/')).toBe(false);
    });
  });

  describe('createSafeFetchClient factory', () => {
    test('throws security error when attempting to fetch from prohibited endpoint', async () => {
      const client = createSafeFetchClient();

      await expect(
        client.fetchJson('http://127.0.0.1:8000/internal-metrics')
      ).rejects.toThrow(/Security Violation/i);
    });

    test('successfully fetches and parses JSON on public safe endpoint', async () => {
      const client = createSafeFetchClient();
      const mockData = { totalStreams: 10400 };

      // Mock global fetch
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as unknown as Response);

      try {
        const result = await client.fetchJson('https://api.example.com/v1/metrics');
        expect(result).toEqual(mockData);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    test('handles HTTP error responses from public endpoints', async () => {
      const client = createSafeFetchClient();

      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as unknown as Response);

      try {
        await expect(
          client.fetchJson('https://api.example.com/v1/unknown')
        ).rejects.toThrow(/HTTP Error 404/i);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });
});
