/**
 * @file portal-schemas.test.ts
 * @layer Domain Test
 * @description Unit tests for Zod schemas in Épica 6: MagicLinkTokenPayloadSchema,
 *              ArtistPortalSessionSchema, PortalDeliverableReviewSchema, ExternalApiKeySchema,
 *              and McpAuditLogSchema.
 */

import { describe, test, expect } from 'vitest';
import {
  MagicLinkTokenPayloadSchema,
  ArtistPortalSessionSchema,
  PortalDeliverableReviewSchema,
  ApiKeyScopeSchema,
  ExternalApiKeySchema,
  McpAuditLogSchema,
} from '../../../apps/web/src/lib/pipelines/portal/portal-schemas';

describe('Domain: PortalSchemas (SPEC-06-01 to SPEC-06-04)', () => {
  const uuid1 = '11111111-1111-4111-8111-111111111111';
  const uuid2 = '22222222-2222-4222-8222-222222222222';
  const uuid3 = '33333333-3333-4333-8333-333333333333';

  test('validates MagicLinkTokenPayloadSchema', () => {
    const valid = {
      sessionId: uuid1,
      releaseId: uuid2,
      artistId: uuid3,
      exp: 1770000000,
    };
    expect(MagicLinkTokenPayloadSchema.parse(valid)).toEqual(valid);

    expect(() =>
      MagicLinkTokenPayloadSchema.parse({
        sessionId: 'not-a-uuid',
        releaseId: uuid2,
        artistId: uuid3,
        exp: 1770000000,
      })
    ).toThrow();
  });

  test('validates ArtistPortalSessionSchema', () => {
    const valid = {
      id: uuid1,
      releaseId: uuid2,
      artistId: uuid3,
      tokenHash: 'a'.repeat(32),
      expiresAt: '2026-11-01T00:00:00.000Z',
    };
    expect(ArtistPortalSessionSchema.parse(valid)).toMatchObject(valid);
  });

  test('validates PortalDeliverableReviewSchema with valid decisions', () => {
    const approved = {
      id: uuid1,
      sessionId: uuid2,
      deliverableId: uuid3,
      decision: 'APPROVED',
      feedbackText: 'Todo perfecto',
    };
    expect(PortalDeliverableReviewSchema.parse(approved)).toMatchObject(approved);

    const changes = {
      id: uuid1,
      sessionId: uuid2,
      deliverableId: uuid3,
      decision: 'CHANGES_REQUESTED',
    };
    expect(PortalDeliverableReviewSchema.parse(changes)).toMatchObject(changes);

    expect(() =>
      PortalDeliverableReviewSchema.parse({
        ...approved,
        decision: 'INVALID_DECISION',
      })
    ).toThrow();
  });

  test('validates ApiKeyScopeSchema and ExternalApiKeySchema', () => {
    expect(ApiKeyScopeSchema.parse('READ_RELEASES')).toBe('READ_RELEASES');
    expect(ApiKeyScopeSchema.parse('WRITE_TASKS')).toBe('WRITE_TASKS');
    expect(ApiKeyScopeSchema.parse('READ_METRICS')).toBe('READ_METRICS');
    expect(ApiKeyScopeSchema.parse('FULL_ACCESS')).toBe('FULL_ACCESS');

    const validKey = {
      id: uuid1,
      label: 'Cursor Copilot',
      keyPrefix: 'iss_live_abc12345',
      keyHash: 'b'.repeat(32),
      scopes: ['READ_RELEASES', 'WRITE_TASKS'],
    };
    expect(ExternalApiKeySchema.parse(validKey)).toMatchObject(validKey);

    // Invalid prefix
    expect(() =>
      ExternalApiKeySchema.parse({
        ...validKey,
        keyPrefix: 'invalid_prefix',
      })
    ).toThrow();
  });

  test('validates McpAuditLogSchema', () => {
    const validLog = {
      id: uuid1,
      method: 'tools/call',
      paramsJson: '{"name":"mcp_crear_tarea"}',
      clientInfo: 'Claude Desktop v2',
      status: 'SUCCESS' as const,
    };
    expect(McpAuditLogSchema.parse(validLog)).toMatchObject(validLog);

    expect(() =>
      McpAuditLogSchema.parse({
        ...validLog,
        status: 'PENDING', // Not in ('SUCCESS', 'ERROR')
      })
    ).toThrow();
  });
});
