/**
 * @file apps/web/src/lib/infrastructure/db/unit-of-work.ts
 * @layer Infrastructure (Layer 4)
 * @description Unit of work pattern for atomic transaction management in SQLite.
 *
 * Security & Architectural Invariants:
 * Guarantees that aggregate mutations and Outbox event enqueuing commit or roll back together atomically.
 */

import { DatabaseSync } from "node:sqlite";

/**
 * Manages atomic transactions using SQLite savepoints or transactions.
 */
export class SqliteUnitOfWork {
  private readonly db: DatabaseSync;

  constructor(db: DatabaseSync) {
    this.db = db;
  }

  /**
   * Executes an operation inside an atomic SQLite transaction.
   * Rolls back completely if an error occurs.
   *
   * @param operation - Work unit function receiving the active database connection
   * @returns Result of the operation
   */
  public executeTransaction<T>(operation: (db: DatabaseSync) => T): T {
    // Step 1: Begin transaction
    this.db.exec("BEGIN TRANSACTION;");

    try {
      // Step 2: Execute transactional logic
      const result = operation(this.db);

      // Step 3: Commit transaction
      this.db.exec("COMMIT;");
      return result;
    } catch (error) {
      // Step 4: Rollback transaction on failure
      this.db.exec("ROLLBACK;");
      throw error;
    }
  }
}
