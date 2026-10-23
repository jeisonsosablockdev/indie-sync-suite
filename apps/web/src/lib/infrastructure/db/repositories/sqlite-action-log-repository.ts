/**
 * @file sqlite-action-log-repository.ts
 * @layer Infrastructure
 * @description Immutable audit log persistence repository in SQLite for agent tool executions.
 */

import { DatabaseSync } from 'node:sqlite';
import { ToolRiskLevel } from '../../../pipelines/agent/tools/tool-contract';

export type ActionStatus = 'REQUESTED' | 'CONFIRMED' | 'REJECTED' | 'EXECUTED' | 'FAILED';

export interface ActionLogRecord {
  id: string;
  toolName: string;
  paramsSnapshot: Record<string, any>;
  riskLevel: ToolRiskLevel;
  status: ActionStatus;
  confirmedBy?: string;
  resultSnapshot?: any;
  errorMessage?: string;
  createdAt: string;
  executedAt?: string;
}

export class SqliteActionLogRepository {
  private db: DatabaseSync;

  /**
   * Initializes SqliteActionLogRepository with a native DatabaseSync connection.
   *
   * @param db - DatabaseSync instance
   */
  constructor(db: DatabaseSync) {
    this.db = db;
  }

  /**
   * Records a new tool invocation in the action audit log.
   *
   * @param record - Initial ActionLogRecord
   */
  async recordRequest(record: Omit<ActionLogRecord, 'createdAt'> & { createdAt?: string }): Promise<void> {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO action_log (
        id, tool_name, params_snapshot, risk_level, status, confirmed_by, result_snapshot, error_message, created_at, executed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      record.id,
      record.toolName,
      JSON.stringify(record.paramsSnapshot),
      record.riskLevel,
      record.status,
      record.confirmedBy || null,
      record.resultSnapshot ? JSON.stringify(record.resultSnapshot) : null,
      record.errorMessage || null,
      record.createdAt || now,
      record.executedAt || null
    );
  }

  /**
   * Updates state transition and execution metadata for a logged action.
   *
   * @param id - Action log UUID
   * @param status - Target ActionStatus
   * @param options - Additional metadata (confirmation, result, error)
   */
  async updateStatus(
    id: string,
    status: ActionStatus,
    options: {
      confirmedBy?: string;
      resultSnapshot?: any;
      errorMessage?: string;
    } = {}
  ): Promise<void> {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      UPDATE action_log SET
        status = ?,
        confirmed_by = COALESCE(?, confirmed_by),
        result_snapshot = COALESCE(?, result_snapshot),
        error_message = COALESCE(?, error_message),
        executed_at = ?
      WHERE id = ?
    `);

    stmt.run(
      status,
      options.confirmedBy || null,
      options.resultSnapshot ? JSON.stringify(options.resultSnapshot) : null,
      options.errorMessage || null,
      now,
      id
    );
  }

  /**
   * Retrieves an audit log record by ID.
   *
   * @param id - Log UUID
   * @returns ActionLogRecord or null
   */
  async findById(id: string): Promise<ActionLogRecord | null> {
    const stmt = this.db.prepare('SELECT * FROM action_log WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;

    return {
      id: row.id,
      toolName: row.tool_name,
      paramsSnapshot: JSON.parse(row.params_snapshot),
      riskLevel: row.risk_level as ToolRiskLevel,
      status: row.status as ActionStatus,
      confirmedBy: row.confirmed_by || undefined,
      resultSnapshot: row.result_snapshot ? JSON.parse(row.result_snapshot) : undefined,
      errorMessage: row.error_message || undefined,
      createdAt: row.created_at,
      executedAt: row.executed_at || undefined,
    };
  }

  /**
   * Lists recent audit log records ordered chronologically.
   *
   * @param limit - Max records to return (defaults to 50)
   * @returns Array of ActionLogRecord objects
   */
  async findAll(limit: number = 50): Promise<ActionLogRecord[]> {
    const stmt = this.db.prepare('SELECT * FROM action_log ORDER BY created_at DESC LIMIT ?');
    const rows = stmt.all(limit) as any[];

    return rows.map(row => ({
      id: row.id,
      toolName: row.tool_name,
      paramsSnapshot: JSON.parse(row.params_snapshot),
      riskLevel: row.risk_level as ToolRiskLevel,
      status: row.status as ActionStatus,
      confirmedBy: row.confirmed_by || undefined,
      resultSnapshot: row.result_snapshot ? JSON.parse(row.result_snapshot) : undefined,
      errorMessage: row.error_message || undefined,
      createdAt: row.created_at,
      executedAt: row.executed_at || undefined,
    }));
  }
}
