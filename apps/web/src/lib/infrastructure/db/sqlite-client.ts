/**
 * @file apps/web/src/lib/infrastructure/db/sqlite-client.ts
 * @layer Infrastructure (Layer 4)
 * @description Native SQLite client manager leveraging node:sqlite standard library with WAL mode and resilient concurrency.
 *
 * Security & Architectural Invariants:
 * - Foreign key enforcement: PRAGMA foreign_keys = ON;
 * - Concurrency control: PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;
 * - Isolated from Layer 1 (Presentation) - never imported directly from React components.
 */

import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

export interface SqliteClientConfig {
  databasePath?: string;
  isMemory?: boolean;
}

/**
 * Manages the connection lifecycle and pragmas for SQLite.
 */
export class SqliteClient {
  private db: DatabaseSync | null = null;
  private readonly config: SqliteClientConfig;

  /**
   * Initializes SQLite client configuration.
   * @param config - Connection options (file path or in-memory)
   */
  constructor(config: SqliteClientConfig = {}) {
    // Step 1: Assign default configuration
    this.config = {
      isMemory: config.isMemory ?? false,
      databasePath: config.databasePath ?? path.resolve(process.cwd(), ".data/indie_suite.db"),
    };
  }

  /**
   * Retrieves or initializes the underlying DatabaseSync instance.
   * @returns Active DatabaseSync connection with enforced pragmas
   */
  public getDatabase(): DatabaseSync {
    // Step 2: Lazy initialization check
    if (!this.db) {
      this.connect();
    }
    return this.db!;
  }

  /**
   * Establishes database connection and applies mandatory pragmas.
   */
  public connect(): void {
    // Step 3: Determine storage mode
    if (this.config.isMemory) {
      this.db = new DatabaseSync(":memory:");
    } else {
      const dbDir = path.dirname(this.config.databasePath!);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
      this.db = new DatabaseSync(this.config.databasePath!);
    }

    // Step 4: Apply mandatory architectural and concurrency pragmas
    this.db.exec("PRAGMA foreign_keys = ON;");
    this.db.exec("PRAGMA busy_timeout = 5000;");

    // Note: WAL mode only applies to disk-backed databases
    if (!this.config.isMemory) {
      this.db.exec("PRAGMA journal_mode = WAL;");
    }
  }

  /**
   * Closes active database connection.
   */
  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
