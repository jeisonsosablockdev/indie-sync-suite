/**
 * @file apps/web/src/lib/infrastructure/db/migrator.ts
 * @layer Infrastructure (Layer 4)
 * @description Lightweight, sequential DDL migration runner for SQLite.
 *
 * Architectural Invariant:
 * Pure SQL migrations without external heavy ORMs. Executes idempotently within an isolated transaction.
 */

import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

/**
 * Migration runner responsible for applying DDL migrations to SQLite.
 */
export class SqliteMigrator {
  private readonly db: DatabaseSync;
  private readonly migrationsDir: string;

  /**
   * Initializes the migrator.
   * @param db - Active DatabaseSync connection
   * @param migrationsDir - Optional custom directory containing SQL migration files
   */
  constructor(db: DatabaseSync, migrationsDir?: string) {
    // Step 1: Assign database and resolve migrations directory
    this.db = db;
    this.migrationsDir = migrationsDir ?? path.resolve(__dirname, "migrations");
  }

  /**
   * Ensures the migrations tracking table exists.
   */
  private ensureMigrationsTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
  }

  /**
   * Applies all pending migrations in alphabetical order.
   * @returns Array of newly applied migration file names
   */
  public runMigrations(): string[] {
    // Step 2: Initialize tracking table
    this.ensureMigrationsTable();

    // Step 3: Read available migration files
    if (!fs.existsSync(this.migrationsDir)) {
      return [];
    }

    const files = fs
      .readdirSync(this.migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    const appliedQuery = this.db.prepare("SELECT name FROM _migrations");
    const appliedRows = appliedQuery.all() as { name: string }[];
    const appliedSet = new Set(appliedRows.map((r) => r.name));

    const newlyApplied: string[] = [];

    // Step 4: Apply pending migrations sequentially
    for (const file of files) {
      if (!appliedSet.has(file)) {
        const filePath = path.join(this.migrationsDir, file);
        const sqlContent = fs.readFileSync(filePath, "utf-8");

        // Step 5: Execute migration and record history
        this.db.exec(sqlContent);
        this.db.prepare("INSERT INTO _migrations (name) VALUES (?)").run(file);
        newlyApplied.push(file);
      }
    }

    return newlyApplied;
  }
}

/**
 * Convenience helper function to run migrations on a DatabaseSync instance.
 *
 * @param db - DatabaseSync instance
 * @param migrationsDir - Optional custom migrations directory
 * @returns Array of newly applied migration file names
 */
export function runMigrations(db: DatabaseSync, migrationsDir?: string): string[] {
  return new SqliteMigrator(db, migrationsDir).runMigrations();
}
