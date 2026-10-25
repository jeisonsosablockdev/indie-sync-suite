/**
 * @file security-policy-engine.test.ts
 * @layer Domain Test
 * @description Unit tests for security hardening engine (HU-6.4 / SPEC-06-04).
 *              Verifies XSS/HTML input sanitization, sliding window rate limiting,
 *              CORS origin verification, and safe URI schemes.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import {
  sanitizeInputText,
  isAllowedOrigin,
  isSafeUriScheme,
  createRateLimiter,
} from '../../../apps/web/src/lib/pipelines/hardening/security-policy-engine';

describe('Domain: SecurityPolicyEngine (SPEC-06-04)', () => {
  describe('sanitizeInputText', () => {
    test('strips malicious script blocks and angle brackets', () => {
      const malicious = '<script>alert("xss")</script>Por favor cambiar portada';
      expect(sanitizeInputText(malicious)).toBe('Por favor cambiar portada');

      const tags = '<b>Aprobado</b> y <img src=x onerror=alert(1)> listo';
      expect(sanitizeInputText(tags)).toBe('bAprobado/b y img src=x onerror=alert(1) listo');
    });

    test('returns clean text unmodified and handles edge cases', () => {
      expect(sanitizeInputText('Texto normal de feedback')).toBe('Texto normal de feedback');
      expect(sanitizeInputText('')).toBe('');
      expect(sanitizeInputText(null as unknown as string)).toBe('');
    });
  });

  describe('isAllowedOrigin', () => {
    test('permits any origin when wildcard is present in whitelist', () => {
      expect(isAllowedOrigin('https://arbitrary-site.com', ['*'])).toBe(true);
    });

    test('permits exact matches in whitelist', () => {
      const whitelist = ['https://app.indiesync.io', 'https://portal.indiesync.io'];
      expect(isAllowedOrigin('https://app.indiesync.io', whitelist)).toBe(true);
      expect(isAllowedOrigin('https://portal.indiesync.io', whitelist)).toBe(true);
    });

    test('rejects unlisted or mismatched origins', () => {
      const whitelist = ['https://app.indiesync.io'];
      expect(isAllowedOrigin('https://malicious-site.com', whitelist)).toBe(false);
      expect(isAllowedOrigin('http://app.indiesync.io', whitelist)).toBe(false); // HTTP vs HTTPS
    });
  });

  describe('isSafeUriScheme', () => {
    test('approves authorized URI schemes', () => {
      expect(isSafeUriScheme('https://cdn.example.com/audio.mp3')).toBe(true);
      expect(isSafeUriScheme('http://local-dev.test/api')).toBe(true);
      expect(isSafeUriScheme('brand://vault/active')).toBe(true);
      expect(isSafeUriScheme('releases://active')).toBe(true);
      expect(isSafeUriScheme('metrics://summary/latest')).toBe(true);
    });

    test('rejects unsafe and dangerous URI schemes', () => {
      expect(isSafeUriScheme('javascript:alert(1)')).toBe(false);
      expect(isSafeUriScheme('file:///etc/shadow')).toBe(false);
      expect(isSafeUriScheme('data:text/html;base64,PHNjcmlwdD4=')).toBe(false);
      expect(isSafeUriScheme('ftp://ftp.example.com')).toBe(false);
      expect(isSafeUriScheme('')).toBe(false);
      expect(isSafeUriScheme(null as unknown as string)).toBe(false);
    });
  });

  describe('createRateLimiter', () => {
    test('allows requests within max threshold and tracks remaining count', () => {
      const limiter = createRateLimiter(3, 10000); // 3 reqs per 10s

      const r1 = limiter.checkLimit('client-ip-1');
      expect(r1.allowed).toBe(true);
      expect(r1.remaining).toBe(2);

      const r2 = limiter.checkLimit('client-ip-1');
      expect(r2.allowed).toBe(true);
      expect(r2.remaining).toBe(1);

      const r3 = limiter.checkLimit('client-ip-1');
      expect(r3.allowed).toBe(true);
      expect(r3.remaining).toBe(0);

      // Exceed threshold
      const r4 = limiter.checkLimit('client-ip-1');
      expect(r4.allowed).toBe(false);
      expect(r4.remaining).toBe(0);
      expect(r4.resetTimeMs).toBeGreaterThan(0);
    });

    test('isolates rate limits between distinct client identifiers', () => {
      const limiter = createRateLimiter(1, 10000);

      expect(limiter.checkLimit('client-A').allowed).toBe(true);
      expect(limiter.checkLimit('client-A').allowed).toBe(false);

      // Client B should still be allowed
      expect(limiter.checkLimit('client-B').allowed).toBe(true);
    });

    test('resets rate limit logs completely', () => {
      const limiter = createRateLimiter(1, 10000);
      limiter.checkLimit('client-X');
      expect(limiter.checkLimit('client-X').allowed).toBe(false);

      limiter.reset();
      expect(limiter.checkLimit('client-X').allowed).toBe(true);
    });
  });
});
