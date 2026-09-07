/**
 * @file health-checker.test.ts
 * @layer Infrastructure Test
 * @description Unit tests for HTTP metadata health checker, timeout aborts, and auth header redaction.
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  checkProviderHealth,
  sanitizeLog,
  PROVIDER_HEALTH_CONFIGS,
} from '../../../apps/web/src/lib/infrastructure/security/health-checker';

describe('Health Checker & Provider Diagnostics', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('sanitizeLog', () => {
    test('redacts raw API keys and auth headers from log messages', () => {
      const secret = 'sk-proj-super-secret-key-to-redact';
      const rawLog = `Error connecting with Bearer ${secret} and standalone key ${secret} at Authorization header`;
      const sanitized = sanitizeLog(rawLog, secret);

      expect(sanitized).not.toContain(secret);
      expect(sanitized).toContain('[REDACTED_KEY]');
      expect(sanitized).toContain('Bearer [REDACTED]');
    });

    test('redacts x-goog-api-key headers', () => {
      const log = 'Request failed: x-goog-api-key: AIzaSySecretKey12345';
      const sanitized = sanitizeLog(log);
      expect(sanitized).not.toContain('AIzaSySecretKey12345');
      expect(sanitized).toContain('x-goog-api-key: [REDACTED]');
    });
  });

  describe('checkProviderHealth HTTP Probing', () => {
    test('returns "healthy" on 200 OK response with latency calculation', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
      } as any);

      const result = await checkProviderHealth('openai', 'sk-proj-12345678901234567890');

      expect(result.status).toBe('healthy');
      expect(result.maskedKey).toBe('sk-proj-...7890');
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
      expect(result.provider).toBe('openai');
    });

    test('returns "low_quota" when rate limit remaining header is 0', async () => {
      const headers = new Headers();
      headers.set('x-ratelimit-remaining', '0');

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers,
      } as any);

      const result = await checkProviderHealth('openai', 'sk-proj-12345678901234567890');
      expect(result.status).toBe('low_quota');
      expect(result.details).toContain('Cuota de peticiones casi agotada');
    });

    test('returns "invalid_key" on 401 Unauthorized', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        headers: new Headers(),
      } as any);

      const result = await checkProviderHealth('anthropic', 'sk-ant-12345678901234567890');
      expect(result.status).toBe('invalid_key');
      expect(result.maskedKey).toBe('sk-ant-...7890');
    });

    test('returns "low_quota" on 429 Too Many Requests', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Headers(),
      } as any);

      const result = await checkProviderHealth('groq', 'gsk_12345678901234567890');
      expect(result.status).toBe('low_quota');
      expect(result.details).toContain('HTTP 429');
    });

    test('strictly enforces header authentication for Google Gemini without URL query params', async () => {
      let capturedUrl = '';
      let capturedHeaders: any = {};

      global.fetch = vi.fn().mockImplementation((url, init) => {
        capturedUrl = url.toString();
        capturedHeaders = init.headers;
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers(),
        });
      });

      const geminiKey = 'AIzaSy12345678901234567890';
      await checkProviderHealth('google', geminiKey);

      // Invariant: Gemini MUST NOT pass ?key= in the URL
      expect(capturedUrl).not.toContain('?key=');
      expect(capturedUrl).not.toContain(geminiKey);
      expect(capturedHeaders['x-goog-api-key']).toBe(geminiKey);
    });

    test('strictly enforces anthropic-version header for Anthropic models endpoint', async () => {
      let capturedHeaders: any = {};

      global.fetch = vi.fn().mockImplementation((_url, init) => {
        capturedHeaders = init.headers;
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers(),
        });
      });

      const key = 'sk-ant-12345678901234567890';
      await checkProviderHealth('anthropic', key);

      expect(capturedHeaders['anthropic-version']).toBe('2023-06-01');
      expect(capturedHeaders['x-api-key']).toBe(key);
    });

    test('handles connection timeout gracefully returning "unreachable"', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';

      global.fetch = vi.fn().mockRejectedValue(abortError);

      const result = await checkProviderHealth('openai', 'sk-proj-12345678901234567890', 50);
      expect(result.status).toBe('unreachable');
      expect(result.details).toContain('Timeout');
    });
  });
});
