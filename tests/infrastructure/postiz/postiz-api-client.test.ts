/**
 * @file postiz-api-client.test.ts
 * @layer Infrastructure Test
 * @description Unit tests for createPostizApiClient and assertSafePublicUrl (HU-4.5 / SPEC-04-05).
 *              Verifies anti-SSRF protection, safe URL whitelisting, schedule dispatch, and service health checks.
 */

import { describe, test, expect } from 'vitest';
import {
  assertSafePublicUrl,
  createPostizApiClient,
  PostizScheduleRequest,
} from '../../../apps/web/src/lib/infrastructure/postiz/postiz-api-client';

describe('PostizApiClient & Anti-SSRF Guardrails (HU-4.5 / SPEC-04-05)', () => {
  describe('assertSafePublicUrl', () => {
    test('accepts valid public HTTPS and HTTP URLs', () => {
      expect(assertSafePublicUrl('https://api.postiz.com/v1/posts')).toBe(true);
      expect(assertSafePublicUrl('https://cdn.example.com/audio/master.wav')).toBe(true);
      expect(assertSafePublicUrl('http://my-storage.r2.cloudflarestorage.com/image.png')).toBe(true);
    });

    test('rejects loopback and localhost addresses', () => {
      expect(assertSafePublicUrl('http://localhost:3000')).toBe(false);
      expect(assertSafePublicUrl('http://127.0.0.1:8080/secret')).toBe(false);
      expect(assertSafePublicUrl('http://[::1]/admin')).toBe(false);
      expect(assertSafePublicUrl('http://0.0.0.0:4000')).toBe(false);
    });

    test('rejects private IPv4 networks (RFC 1918)', () => {
      expect(assertSafePublicUrl('http://10.0.0.1/internal')).toBe(false);
      expect(assertSafePublicUrl('http://192.168.1.1/router')).toBe(false);
      expect(assertSafePublicUrl('http://172.16.0.5/api')).toBe(false);
      expect(assertSafePublicUrl('http://172.31.255.254/status')).toBe(false);
    });

    test('rejects AWS/GCP cloud metadata IP (169.254.169.254)', () => {
      expect(assertSafePublicUrl('http://169.254.169.254/latest/meta-data')).toBe(false);
    });

    test('rejects non-http protocols and malformed strings', () => {
      expect(assertSafePublicUrl('ftp://ftp.example.com/file')).toBe(false);
      expect(assertSafePublicUrl('file:///etc/passwd')).toBe(false);
      expect(assertSafePublicUrl('javascript:alert(1)')).toBe(false);
      expect(assertSafePublicUrl('invalid-url-string')).toBe(false);
    });
  });

  describe('createPostizApiClient', () => {
    test('creates client with default configuration', () => {
      const client = createPostizApiClient();
      expect(client).toBeDefined();
      expect(typeof client.schedulePost).toBe('function');
      expect(typeof client.listChannels).toBe('function');
      expect(typeof client.checkServiceHealth).toBe('function');
    });

    test('throws security error if initialized with unsafe baseUrl', () => {
      expect(() =>
        createPostizApiClient({
          baseUrl: 'http://127.0.0.1:8080',
        })
      ).toThrow('Security Violation: Unsafe Postiz API baseUrl: http://127.0.0.1:8080');
    });

    test('schedules post and returns queued response', async () => {
      const client = createPostizApiClient({
        baseUrl: 'https://api.postiz.com',
        apiKey: 'test_api_key_123',
      });

      const request: PostizScheduleRequest = {
        idempotencyKey: 'idem-test-999',
        platform: 'INSTAGRAM',
        content: 'New Single Drops Tomorrow! Pre-save now.',
        scheduledAt: '2026-11-15T18:00:00.000Z',
        mediaUrls: ['https://cdn.example.com/reel.mp4'],
      };

      const response = await client.schedulePost(request);
      expect(response.postId).toBe('postiz-idem-test-999');
      expect(response.status).toBe('QUEUED');
      expect(response.scheduledAt).toBe('2026-11-15T18:00:00.000Z');
    });

    test('rejects scheduling if mediaUrls contain SSRF targets', async () => {
      const client = createPostizApiClient();

      const request: PostizScheduleRequest = {
        idempotencyKey: 'idem-test-evil',
        platform: 'INSTAGRAM',
        content: 'Test',
        scheduledAt: '2026-11-15T18:00:00.000Z',
        mediaUrls: ['http://169.254.169.254/metadata'],
      };

      await expect(client.schedulePost(request)).rejects.toThrow(
        'Security Violation: Potentially unsafe media URL in schedule request'
      );
    });

    test('reports DEGRADED when API key is missing and HEALTHY when configured', async () => {
      const clientNoKey = createPostizApiClient();
      const healthNoKey = await clientNoKey.checkServiceHealth();
      expect(healthNoKey.status).toBe('DEGRADED');

      const clientWithKey = createPostizApiClient({ apiKey: 'postiz_sk_live_12345' });
      const healthWithKey = await clientWithKey.checkServiceHealth();
      expect(healthWithKey.status).toBe('HEALTHY');
      expect(healthWithKey.latencyMs).toBe(42);
    });
  });
});
