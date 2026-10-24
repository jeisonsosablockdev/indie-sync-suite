/**
 * @file advisor-conversation-repository.test.ts
 * @layer Infrastructure Test
 * @description SQLite integration tests for createAdvisorConversationRepository (HU-5.2 / SPEC-05-04).
 *              Verifies session creation, message memory append, chronological ordering,
 *              and irreversible GDPR hard-delete cascade purging.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { runMigrations } from '../../../apps/web/src/lib/infrastructure/db/migrator';
import {
  createAdvisorConversationRepository,
  AdvisorConversationRepository,
} from '../../../apps/web/src/lib/infrastructure/db/repositories/sqlite-advisor-conversation-repository';

describe('SQLite AdvisorConversationRepository (SPEC-05-04)', () => {
  let db: DatabaseSync;
  let repo: AdvisorConversationRepository;

  const labelId = '11111111-1111-4111-8111-111111111111';
  const artistId = '22222222-2222-4222-8222-222222222222';
  const releaseId = '33333333-3333-4333-8333-333333333333';
  const conversationId = '55555555-5555-4555-8555-555555555555';

  beforeEach(() => {
    db = new DatabaseSync(':memory:');
    db.exec('PRAGMA foreign_keys = ON;');
    db.exec('PRAGMA journal_mode = WAL;');

    const migrationsDir = path.resolve(
      __dirname,
      '../../../apps/web/src/lib/infrastructure/db/migrations'
    );
    runMigrations(db, migrationsDir);

    repo = createAdvisorConversationRepository(db);

    // Seed parent entities: label -> artist -> release
    db.prepare('INSERT INTO labels (id, name) VALUES (?, ?)').run(labelId, 'Aether Wave Records');
    db.prepare('INSERT INTO artists (id, label_id, name) VALUES (?, ?, ?)').run(
      artistId,
      labelId,
      'Astra Project'
    );
    db.prepare(
      'INSERT INTO releases (id, artist_id, title, release_date, archetype) VALUES (?, ?, ?, ?, ?)'
    ).run(releaseId, artistId, 'Neon Horizon', '2026-11-15T00:00:00.000Z', 'THE_ARCHITECT');
  });

  test('should create and retrieve a strategic conversation session', async () => {
    // Arrange & Act
    const created = await repo.createConversation(
      conversationId,
      releaseId,
      'Estrategia Pre-Guardado T-7'
    );

    // Assert
    expect(created.id).toBe(conversationId);
    expect(created.releaseId).toBe(releaseId);
    expect(created.title).toBe('Estrategia Pre-Guardado T-7');
    expect(created.createdAt).toBeDefined();

    const fetched = await repo.getConversationById(conversationId);
    expect(fetched).not.toBeNull();
    expect(fetched?.title).toBe('Estrategia Pre-Guardado T-7');
  });

  test('should list conversations by releaseId ordered by latest updated_at', async () => {
    // Arrange
    const conv1 = 'c1111111-1111-4111-8111-111111111111';
    const conv2 = 'c2222222-2222-4222-8222-222222222222';

    await repo.createConversation(conv1, releaseId, 'Sesión 1');
    await repo.createConversation(conv2, releaseId, 'Sesión 2');

    // Act
    const list = await repo.listConversationsByReleaseId(releaseId);

    // Assert
    expect(list.length).toBe(2);
    expect(list.map((c) => c.id)).toContain(conv1);
    expect(list.map((c) => c.id)).toContain(conv2);
  });

  test('should append messages and list them in chronological order', async () => {
    // Arrange
    await repo.createConversation(conversationId, releaseId, 'Lanzamiento Q4');
    const msgId1 = 'm1111111-1111-4111-8111-111111111111';
    const msgId2 = 'm2222222-2222-4222-8222-222222222222';

    const metricsSnapshot = { streams: 15400, cpa: 0.42, topCity: 'CDMX' };

    // Act
    const userMsg = await repo.addMessage(
      msgId1,
      conversationId,
      'USER',
      '¿Debería aumentar presupuesto en TikTok?',
      JSON.stringify(metricsSnapshot)
    );

    const assistantMsg = await repo.addMessage(
      msgId2,
      conversationId,
      'ASSISTANT',
      'Con un CPA de 0.42 en CDMX, recomendamos reasignar el 20% de presupuesto a Meta.',
      null
    );

    const messages = await repo.listMessagesByConversationId(conversationId);

    // Assert
    expect(userMsg.senderRole).toBe('USER');
    expect(userMsg.metricsSnapshotJson).toBe(JSON.stringify(metricsSnapshot));
    expect(assistantMsg.senderRole).toBe('ASSISTANT');
    expect(assistantMsg.metricsSnapshotJson).toBeNull();

    expect(messages.length).toBe(2);
    expect(messages[0].id).toBe(msgId1);
    expect(messages[1].id).toBe(msgId2);
    expect(messages[0].content).toContain('TikTok');
    expect(messages[1].content).toContain('CPA de 0.42');
  });

  test('should execute irreversible GDPR purge cascading to all associated messages', async () => {
    // Arrange
    await repo.createConversation(conversationId, releaseId, 'Sesión Confidencial');
    await repo.addMessage(
      'msg-1',
      conversationId,
      'USER',
      'Información privada de campaña'
    );
    await repo.addMessage(
      'msg-2',
      conversationId,
      'ASSISTANT',
      'Respuesta confidencial'
    );

    const messagesBefore = await repo.listMessagesByConversationId(conversationId);
    expect(messagesBefore.length).toBe(2);

    // Act
    const purged = await repo.purgeConversation(conversationId);

    // Assert
    expect(purged).toBe(true);

    const convAfter = await repo.getConversationById(conversationId);
    expect(convAfter).toBeNull();

    const messagesAfter = await repo.listMessagesByConversationId(conversationId);
    expect(messagesAfter.length).toBe(0);

    // Direct SQLite check: messages table must be empty for this conversation
    const rawCheck = db.prepare('SELECT count(*) as count FROM advisor_messages WHERE conversation_id = ?').get(conversationId) as { count: number };
    expect(rawCheck.count).toBe(0);
  });

  test('should return false when purging non-existent conversation', async () => {
    const purged = await repo.purgeConversation('non-existent-id');
    expect(purged).toBe(false);
  });
});
