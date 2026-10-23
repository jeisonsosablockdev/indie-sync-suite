---
type: RFC
title: STORY-001-01 HU-1.6 Persistencia Relacional SQLite Core y Cola Outbox
description: RFC Story — Motor de base de datos relacional local SQLite con WAL mode, integridad referencial y cola de sincronización eventual asíncrona outbox
tags: [rfc, story, sqlite, database, outbox, offline-first, governance]
timestamp: 2026-09-07T00:00:00Z
---

# STORY-001-01-sqlite-core-outbox

## Metadata
- Epic: `EPIC-001-shell-brand-vault-sqlite-orchestrator`
- Story ID: `STORY-001-01`
- Mapping: `HU-1.6`
- Status: `approved`
- Owner: `jaymusicmachine`
- RFC owner slice: `epic/jaymusicmachine-EPIC-01-shell-brand-vault-sqlite-orchestrator`
- Created: `2026-09-07`
- Last Updated: `2026-09-07`

## Context
### Historia de Usuario Oficial
- **Como** Desarrollador y Label Manager,
- **Quiero** disponer de un modelo de datos relacional local (SQLite en Tauri/Next.js) que gestione la jerarquía completa de Sello $\rightarrow$ Artista $\rightarrow$ Lanzamiento $\rightarrow$ Fases (Pre, Live, Post) $\rightarrow$ Hitos / Tareas, Enlaces de Audio Externos y la tabla `cloud_sync_queue`,
- **Para que** la aplicación disponga de una estructura de persistencia local, reactiva, autónoma y tolerante a desconexión sin depender de la infraestructura pesada de microservicios Docker o Plane.

### Criterios de Aceptación Oficiales
1. Define y migra el esquema relacional en SQLite con integridad referencial completa para Sellos, Artistas, Lanzamientos, Fases, Tareas y Enlaces externos.
2. Provee operaciones CRUD locales optimizadas con latencia cero a través del cliente SQLite nativo con modo WAL.
3. Modela el árbol de dependencias de tareas (tarea padre, tareas hijas, hitos bloqueantes *gatekeeper*) listo para ser consumido por el planificador visual y el orquestador.
4. Incluye la tabla `cloud_sync_queue` bajo el Patrón Outbox para garantizar que cambios offline se sincronicen de forma idempotente con Postiz Cloud y servicios externos.

### Problem & Gap Analysis
La persistencia previa dependía teóricamente de importar el código de Plane, lo que acarreaba más de 30 contenedores Docker, consumo de varios gigabytes de RAM, latencias innecesarias y fragilidad ante fallos de red. Esta historia establece la base de datos relacional local soberana, optimizada para sub-milisegundo de lectura/escritura y con garantías transaccionales ACID.

---

## Proposal
La historia se compone de **2 Features funcionales** y **4 SPECs técnicas**:

### 🔹 FEATURE 1.1: Motor SQLite Core & Migraciones DDL Transaccionales
*Persistencia estructurada local que sustituye la infraestructura pesada de microservicios Docker.*
- **`SPEC-1.1.1` (DDL Relacional e Integridad Referencial)**:
  - *Problema*: Falta de tablas normalizadas para Sellos, Artistas, Lanzamientos, Tareas y Enlaces de Audio con árbol recursivo y eliminación en cascada.
  - *Solución*: Esquema DDL SQL puro con llaves foráneas (`PRAGMA foreign_keys = ON;`), cascadas `ON DELETE CASCADE`, índices en claves foráneas y timestamps UTC.
  - *Capa*: `Infrastructure` (`apps/web/src/infrastructure/db/migrations/001_initial_schema.sql`, `apps/web/src/domain/db/schema-types.ts`).
  - *Tests RED*: `tests/infrastructure/db/sqlite-ddl.test.ts` (verifica restricciones de unicidad, borrado en cascada y tipos).
- **`SPEC-1.1.2` (Cliente SQLite WAL & Migrador Lineal)**:
  - *Problema*: Concurrencia bloqueante en lecturas/escrituras en SQLite por defecto y riesgo de fallos `SQLITE_BUSY` inmediatos al inicializar la app o durante transacciones concurrentes.
  - *Solución*: Cliente `better-sqlite3` encapsulado en `SqliteClient`, activación obligatoria de `PRAGMA journal_mode = WAL;`, `PRAGMA foreign_keys = ON;`, `PRAGMA busy_timeout = 5000;` (espera de hasta 5s para resolver locks de escritura concurrentes) y `PRAGMA synchronous = NORMAL;`, junto a un ejecutor secuencial de migraciones de menos de 45 líneas.
  - *Capa*: `Infrastructure` (`apps/web/src/infrastructure/db/sqlite-client.ts`, `apps/web/src/infrastructure/db/migrator.ts`).
  - *Tests RED*: `tests/infrastructure/db/sqlite-client.test.ts` (verifica modo WAL, busy_timeout de 5000ms resolviendo contención concurrente y migración idempotente).

### 🔹 FEATURE 1.2: Cola Outbox Asíncrona (`cloud_sync_queue`)
*Garantiza que mutaciones offline se sincronicen de manera idempotente sin acoplar la UI a la red.*
- **`SPEC-1.2.1` (Tabla Outbox y Máquina de Estados de Eventos)**:
  - *Problema*: Riesgo de pérdida de sincronización o publicaciones duplicadas en redes ante caídas de red.
  - *Solución*: Tabla `cloud_sync_queue` con payload JSON snapshot del aggregate, máquina de estados determinista (`PENDING`, `PROCESSING`, `SYNCED`, `FAILED`), contador de reintentos y trigger automático de timestamp.
  - *Capa*: `Domain` / `Infrastructure` (`apps/web/src/domain/outbox/outbox-event.ts`, `apps/web/src/infrastructure/db/repositories/sqlite-outbox-repository.ts`).
  - *Tests RED*: `tests/infrastructure/db/outbox-repository.test.ts` (transiciones de estado y serialización de snapshots).
- **`SPEC-1.2.2` (Transaccionalidad Atómica Mutación + Outbox)**:
  - *Problema*: Posibilidad de que se guarde un cambio en la base local pero falle la creación del evento de sincronización (inconsistencia parcial).
  - *Solución*: Patrón Unit of Work en transacciones SQLite: toda mutación de entidad de negocio y su inserción correspondiente en `cloud_sync_queue` ocurren en una única transacción atómica `db.transaction()`.
  - *Capa*: `Infrastructure` (`apps/web/src/infrastructure/db/unit-of-work.ts`).
  - *Tests RED*: `tests/infrastructure/db/unit-of-work.test.ts` (simulación de fallo con rollback total).

### Definición del Esquema Relacional DDL
```sql
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;
PRAGMA synchronous = NORMAL;

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
  color_palette TEXT, -- JSON array
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

---

## Critique
- **Reviewer(s)**: `architect`, `db`, `ponytail`
- **Critical findings**:
  1. *Fragmentación B-Tree*: Las claves primarias deben ser cadenas ordenables en el tiempo (UUIDv7 o nanoid con prefijo temporal) para evitar fragmentación de páginas en SQLite a medida que crece el volumen de tareas.
  2. *Modo WAL & Concurrencia (busy_timeout)*: Es obligatorio que toda conexión active `PRAGMA journal_mode = WAL;`, `PRAGMA foreign_keys = ON;` y `PRAGMA busy_timeout = 5000;` al inicializarse. Aunque WAL permite lectores concurrentes, los escritores (`BEGIN IMMEDIATE`) compiten por el lock de escritura; sin `busy_timeout = 5000;`, cualquier transacción concurrente o sondeo en segundo plano de la cola outbox arrojaría un error `SQLITE_BUSY` (`database is locked`) de forma instantánea (0ms) en lugar de esperar la liberación de la transacción activa.
  3. *Ponytail Lean Evaluation*:
     - Se descartan ORMs pesados (Prisma, TypeORM) ahorrando >40MB en dependencias y eliminando problemas de compilación en Tauri.
     - Se utiliza `better-sqlite3` con queries preparadas (`prepare().run()`) en un migrador lineal de menos de 45 líneas.
     - Se evita crear microservicios de colas (Redis/BullMQ) usando una tabla `cloud_sync_queue` indexada nativamente.

## Resolution
- Final approach after critique: Esquema DDL puro ejecutado por un migrador secuencial con transacciones atómicas Unit of Work y soporte para llaves UUIDv7.

## Decision
- Decision: `approved`
- Decision date: `2026-09-07`
- Decision owner: `jaymusicmachine`

## Status
- Current status: `approved`
- Next action: Ejecución de tests RED de integridad referencial DDL y transacciones Unit of Work.
- Exit criteria: Todas las tablas creadas, WAL mode verificado y outbox queue operacional.

## Test and Validation Plan
- Unit tests: `tests/infrastructure/db/sqlite-ddl.test.ts`, `tests/infrastructure/db/sqlite-client.test.ts`.
- Integration tests: `tests/infrastructure/db/outbox-repository.test.ts`, `tests/infrastructure/db/unit-of-work.test.ts`.

## Traceability
- Related issue(s): `EPIC-01`, `HU-1.6`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
