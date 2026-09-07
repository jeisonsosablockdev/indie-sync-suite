---
type: RFC
title: STORY-001-01 Esquema Relacional SQLite Core y Outbox Queue
description: RFC Story — Arquitectura relacional local, DDL de entidades, integridad referencial y tabla outbox para sincronización eventual
tags: [rfc, story, sqlite, database, outbox, offline-first, governance]
timestamp: 2026-09-07T00:00:00Z
---

# STORY-001-01-sqlite-core-outbox

## Metadata
- Epic: `EPIC-001-shell-brand-vault-sqlite-orchestrator`
- Story ID: `STORY-001-01-sqlite-core-outbox`
- Mapping: `HU-1.6`
- Status: `draft`
- Owner: `jaymusicmachine`
- RFC owner slice: `SPEC/jaymusicmachine-EPIC-01-spec01-sqlite-core-outbox-queue`
- Created: `2026-09-07`
- Last Updated: `2026-09-07`

## Context
- Problem: La suite requiere un motor de persistencia relacional local sin latencia de red, que soporte operaciones transaccionales ACID y funcione 100% offline. Descartado Plane por excesiva sobrecarga de infraestructura, la aplicación necesita modelar la jerarquía de Sello, Artista, Lanzamiento, Fases, Tareas y Enlaces de Audio, junto con un mecanismo que permita sincronizar mutaciones locales hacia la nube de manera idempotente y tolerante a fallos.
- Why now: Es la capa de infraestructura fundamental sobre la que operan todos los repositorios y vistas de la suite. Ninguna entidad puede persistir de forma consistente sin este esquema.
- Constraints:
  - SQLite en modo WAL (`PRAGMA journal_mode = WAL;`) para concurrencia lectura/escritura.
  - Habilitación estricta de llaves foráneas (`PRAGMA foreign_keys = ON;`).
  - Zero ORMs pesados (sin Prisma ni Docker): queries nativas preparadas con tipado TypeScript y validación Zod en dominio.
  - Patrón Outbox con tabla `cloud_sync_queue` para desacoplar mutaciones locales de llamadas remotas.
- Affected paths:
  - `apps/web/src/infrastructure/db/sqlite-client.ts`
  - `apps/web/src/infrastructure/db/migrations/001_initial_schema.sql`
  - `apps/web/src/infrastructure/db/repositories/sqlite-label-repository.ts`
  - `apps/web/src/infrastructure/db/repositories/sqlite-outbox-repository.ts`
  - `apps/web/src/domain/outbox/outbox-event.ts`
  - `tests/infrastructure/db/sqlite-schema.test.ts`

## Proposal
- Approach summary: Diseñar un esquema SQL relacional normalizado de 6 tablas con claves primarias UUIDv7/text, índices optimizados y una tabla outbox con triggers de actualización de timestamps.
- Technical design:
  ```sql
  -- DDL Base Normalizado
  CREATE TABLE IF NOT EXISTS labels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    country TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS artists (
    id TEXT PRIMARY KEY,
    label_id TEXT NOT NULL,
    name TEXT NOT NULL,
    bio TEXT,
    genre TEXT,
    subgenres TEXT, -- JSON array
    color_palette TEXT, -- JSON array de hexadecimals
    typography TEXT, -- JSON object
    tone_of_voice TEXT,
    social_links TEXT, -- JSON object
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(label_id) REFERENCES labels(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS releases (
    id TEXT PRIMARY KEY,
    artist_id TEXT NOT NULL,
    title TEXT NOT NULL,
    release_date TEXT NOT NULL,
    archetype TEXT NOT NULL, -- single, ep, album, remix
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(artist_id) REFERENCES artists(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    release_id TEXT NOT NULL,
    phase TEXT NOT NULL, -- pre_release, release_day, post_release
    title TEXT NOT NULL,
    description TEXT,
    due_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'todo', -- todo, in_progress, in_review, done, blocked
    parent_task_id TEXT,
    is_gatekeeper INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(release_id) REFERENCES releases(id) ON DELETE CASCADE,
    FOREIGN KEY(parent_task_id) REFERENCES tasks(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS external_audio_links (
    id TEXT PRIMARY KEY,
    release_id TEXT NOT NULL,
    provider TEXT NOT NULL, -- drive, dropbox, soundcloud, other
    url TEXT NOT NULL,
    verified INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(release_id) REFERENCES releases(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS cloud_sync_queue (
    id TEXT PRIMARY KEY,
    aggregate_type TEXT NOT NULL, -- label, artist, release, task
    aggregate_id TEXT NOT NULL,
    action TEXT NOT NULL, -- CREATE, UPDATE, DELETE
    payload TEXT NOT NULL, -- JSON snapshot
    status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, PROCESSING, SYNCED, FAILED
    retry_count INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    synced_at TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_artists_label ON artists(label_id);
  CREATE INDEX IF NOT EXISTS idx_releases_artist ON releases(artist_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_release_phase ON tasks(release_id, phase);
  CREATE INDEX IF NOT EXISTS idx_outbox_pending ON cloud_sync_queue(status, created_at);
  ```
- Alternatives considered:
  - SQLite con ORM TypeORM/Prisma: Descartado por huella binaria innecesaria, problemas en empaquetado Tauri y latencia de arranque.
  - Almacenamiento en archivos JSON independientes: Descartado por riesgo de corrupción ante cierres súbitos y falta de transaccionalidad outbox.
- Tradeoffs: Requiere escribir migraciones DDL manuales en SQL puro, lo cual es más robusto y mantenible a largo plazo.

## Critique
- Reviewer(s): `architect`, `db`, `ponytail`
- Critical findings:
  1. Los campos JSON en SQLite (como `color_palette`, `social_links`) deben validarse al ingresar mediante esquemas Zod en la capa de dominio antes de ejecutar el `INSERT`/`UPDATE`.
  2. La tabla outbox necesita un índice compuesto `(status, created_at)` para que el worker de sincronización no degrade el rendimiento al crecer el histórico.
  3. `Ponytail Evaluation`: Usar `better-sqlite3` en Node.js local con `prepare()` en caché. Cero dependencias adicionales. Sin capas de abstracción innecesarias (no `RepositoryFactoryManager`).

## Resolution
- Final approach after critique: Esquema DDL puro con migrador lineal ultraligero de 40 líneas. Validación de payloads en capa Domain.
- Changes accepted: Triggers de actualización e índices compuestos incorporados en DDL inicial.

## Decision
- Decision: `approved` (Validado para Hito 1.A)
- Decision date: `2026-09-07`
- Decision owner: `jaymusicmachine`

## Status
- Current status: `approved`
- Next action: Crear tests RED en `tests/infrastructure/db/sqlite-schema.test.ts`.

## Test and Validation Plan
- Unit tests: Pruebas unitarias en Vitest validando: creación de tablas en `:memory:`, restricciones de llaves foráneas `ON DELETE CASCADE`, rechazo de nulos y orden de inserción/lectura en `cloud_sync_queue`.
- Integration tests: Simulación de concurrencia y transacciones rollback ante fallos en inserción outbox.

## Traceability
- Related issue(s): `EPIC-01`, `HU-1.6`
- Branch: `SPEC/jaymusicmachine-EPIC-01-spec01-sqlite-core-outbox-queue`
- Final commit hash(es): `TBD`
