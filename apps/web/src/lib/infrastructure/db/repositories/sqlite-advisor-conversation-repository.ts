/**
 * @file sqlite-advisor-conversation-repository.ts
 * @layer Infrastructure
 * @description SQLite repository for Strategic Advisor conversations, message memory,
 *              and irreversible hard-delete purges (GDPR compliant). Pure functional factory pattern, zero classes.
 */

import { DatabaseSync } from 'node:sqlite';

export type MessageRole = 'USER' | 'ASSISTANT';

export interface AdvisorConversationRecord {
  id: string;
  releaseId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdvisorMessageRecord {
  id: string;
  conversationId: string;
  senderRole: MessageRole;
  content: string;
  metricsSnapshotJson?: string | null;
  createdAt: string;
}

export interface AdvisorConversationRepository {
  createConversation: (id: string, releaseId: string, title: string) => Promise<AdvisorConversationRecord>;
  getConversationById: (id: string) => Promise<AdvisorConversationRecord | null>;
  listConversationsByReleaseId: (releaseId: string) => Promise<AdvisorConversationRecord[]>;
  addMessage: (
    id: string,
    conversationId: string,
    senderRole: MessageRole,
    content: string,
    metricsSnapshotJson?: string | null
  ) => Promise<AdvisorMessageRecord>;
  listMessagesByConversationId: (conversationId: string) => Promise<AdvisorMessageRecord[]>;
  purgeConversation: (conversationId: string) => Promise<boolean>;
}

interface SqliteConversationRow {
  id: string;
  release_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface SqliteMessageRow {
  id: string;
  conversation_id: string;
  sender_role: MessageRole;
  content: string;
  metrics_snapshot_json: string | null;
  created_at: string;
}

function mapConversationRow(row: SqliteConversationRow): AdvisorConversationRecord {
  return {
    id: row.id,
    releaseId: row.release_id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMessageRow(row: SqliteMessageRow): AdvisorMessageRecord {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderRole: row.sender_role,
    content: row.content,
    metricsSnapshotJson: row.metrics_snapshot_json,
    createdAt: row.created_at,
  };
}

/**
 * Functional factory instantiating the SQLite Advisor Conversation Repository.
 *
 * @param db - Native DatabaseSync instance
 * @returns Fully typed AdvisorConversationRepository implementation
 */
export function createAdvisorConversationRepository(db: DatabaseSync): AdvisorConversationRepository {
  return {
    createConversation: async (
      id: string,
      releaseId: string,
      title: string
    ): Promise<AdvisorConversationRecord> => {
      // Step 1: Insert conversation session
      const stmt = db.prepare(`
        INSERT INTO advisor_conversations (id, release_id, title, created_at, updated_at)
        VALUES (?, ?, ?, datetime('now'), datetime('now'))
      `);
      stmt.run(id, releaseId, title);

      // Step 2: Fetch and return created conversation
      const selectStmt = db.prepare(`
        SELECT id, release_id, title, created_at, updated_at
        FROM advisor_conversations
        WHERE id = ?
      `);
      const row = selectStmt.get(id) as unknown as SqliteConversationRow | undefined;
      if (!row) {
        throw new Error(`Failed to create advisor conversation with id: ${id}`);
      }
      return mapConversationRow(row);
    },

    getConversationById: async (id: string): Promise<AdvisorConversationRecord | null> => {
      // Step 1: Query conversation by id
      const stmt = db.prepare(`
        SELECT id, release_id, title, created_at, updated_at
        FROM advisor_conversations
        WHERE id = ?
      `);
      const row = stmt.get(id) as unknown as SqliteConversationRow | undefined;
      if (!row) return null;
      return mapConversationRow(row);
    },

    listConversationsByReleaseId: async (releaseId: string): Promise<AdvisorConversationRecord[]> => {
      // Step 1: Query conversations ordered by latest activity
      const stmt = db.prepare(`
        SELECT id, release_id, title, created_at, updated_at
        FROM advisor_conversations
        WHERE release_id = ?
        ORDER BY updated_at DESC
      `);
      const rows = stmt.all(releaseId) as unknown as SqliteConversationRow[];
      return rows.map(mapConversationRow);
    },

    addMessage: async (
      id: string,
      conversationId: string,
      senderRole: MessageRole,
      content: string,
      metricsSnapshotJson?: string | null
    ): Promise<AdvisorMessageRecord> => {
      // Step 1: Insert message record
      const stmt = db.prepare(`
        INSERT INTO advisor_messages (
          id, conversation_id, sender_role, content, metrics_snapshot_json, created_at
        ) VALUES (
          ?, ?, ?, ?, ?, datetime('now')
        )
      `);
      stmt.run(id, conversationId, senderRole, content, metricsSnapshotJson ?? null);

      // Step 2: Touch conversation updated_at
      db.prepare(`
        UPDATE advisor_conversations
        SET updated_at = datetime('now')
        WHERE id = ?
      `).run(conversationId);

      // Step 3: Fetch and return message record
      const selectStmt = db.prepare(`
        SELECT id, conversation_id, sender_role, content, metrics_snapshot_json, created_at
        FROM advisor_messages
        WHERE id = ?
      `);
      const row = selectStmt.get(id) as unknown as SqliteMessageRow | undefined;
      if (!row) {
        throw new Error(`Failed to insert advisor message with id: ${id}`);
      }
      return mapMessageRow(row);
    },

    listMessagesByConversationId: async (conversationId: string): Promise<AdvisorMessageRecord[]> => {
      // Step 1: Query messages in chronological sequence
      const stmt = db.prepare(`
        SELECT id, conversation_id, sender_role, content, metrics_snapshot_json, created_at
        FROM advisor_messages
        WHERE conversation_id = ?
        ORDER BY created_at ASC
      `);
      const rows = stmt.all(conversationId) as unknown as SqliteMessageRow[];
      return rows.map(mapMessageRow);
    },

    purgeConversation: async (conversationId: string): Promise<boolean> => {
      // Step 1: Irreversible hard delete cascade
      const stmt = db.prepare(`DELETE FROM advisor_conversations WHERE id = ?`);
      const result = stmt.run(conversationId);
      return Number(result.changes) > 0;
    },
  };
}
