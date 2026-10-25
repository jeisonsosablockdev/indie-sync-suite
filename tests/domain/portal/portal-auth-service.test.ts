/**
 * @file portal-auth-service.test.ts
 * @layer Domain Test
 * @description Unit tests for Magic Link HMAC-SHA256 signing, verification, and token hashing (HU-6.5 / SPEC-06-01).
 *              Verifies compact URL-safe formatting, tampering prevention, and expiration enforcement.
 */

import { describe, test, expect } from 'vitest';
import {
  hashToken,
  signMagicLinkPayload,
  verifyMagicLinkToken,
} from '../../../apps/web/src/lib/pipelines/portal/portal-auth-service';
import { MagicLinkTokenPayload } from '../../../apps/web/src/lib/pipelines/portal/portal-schemas';

describe('Domain: PortalAuthService (SPEC-06-01)', () => {
  const secret = 'super-secret-hmac-key-for-testing-12345';
  const nowEpoch = Math.floor(Date.now() / 1000);

  const samplePayload: MagicLinkTokenPayload = {
    sessionId: '11111111-1111-4111-8111-111111111111',
    releaseId: '22222222-2222-4222-8222-222222222222',
    artistId: '33333333-3333-4333-8333-333333333333',
    exp: nowEpoch + 3600, // Expires in 1 hour
  };

  describe('hashToken', () => {
    test('hashes token deterministically into 64-char hex string', () => {
      const hash1 = hashToken('sample-magic-token-xyz');
      const hash2 = hashToken('sample-magic-token-xyz');

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });

    test('produces distinct hashes for distinct tokens', () => {
      expect(hashToken('token-a')).not.toBe(hashToken('token-b'));
    });
  });

  describe('signMagicLinkPayload & verifyMagicLinkToken', () => {
    test('signs payload and verifies valid unexpired token successfully', () => {
      const signedToken = signMagicLinkPayload(samplePayload, secret);

      expect(signedToken).toContain('.');
      const [payloadPart, sigPart] = signedToken.split('.');
      expect(payloadPart).toBeDefined();
      expect(sigPart).toBeDefined();

      const verified = verifyMagicLinkToken(signedToken, secret);
      expect(verified).not.toBeNull();
      expect(verified?.sessionId).toBe(samplePayload.sessionId);
      expect(verified?.releaseId).toBe(samplePayload.releaseId);
      expect(verified?.artistId).toBe(samplePayload.artistId);
      expect(verified?.exp).toBe(samplePayload.exp);
    });

    test('rejects token signed with different secret', () => {
      const signedToken = signMagicLinkPayload(samplePayload, secret);
      const verified = verifyMagicLinkToken(signedToken, 'wrong-secret-key');

      expect(verified).toBeNull();
    });

    test('rejects tampered token payload', () => {
      const signedToken = signMagicLinkPayload(samplePayload, secret);
      const [payloadPart, sigPart] = signedToken.split('.');

      // Tamper base64url payload
      const tamperedPayload = Buffer.from(
        JSON.stringify({ ...samplePayload, artistId: '44444444-4444-4444-8444-444444444444' })
      ).toString('base64url');

      const tamperedToken = `${tamperedPayload}.${sigPart}`;
      expect(verifyMagicLinkToken(tamperedToken, secret)).toBeNull();
    });

    test('rejects expired token', () => {
      const expiredPayload: MagicLinkTokenPayload = {
        ...samplePayload,
        exp: nowEpoch - 60, // Expired 1 minute ago
      };

      const signedToken = signMagicLinkPayload(expiredPayload, secret);
      expect(verifyMagicLinkToken(signedToken, secret)).toBeNull();
    });

    test('rejects malformed token strings', () => {
      expect(verifyMagicLinkToken('invalid-token-no-dots', secret)).toBeNull();
      expect(verifyMagicLinkToken('too.many.dots.in.token', secret)).toBeNull();
      expect(verifyMagicLinkToken('', secret)).toBeNull();
    });
  });
});
