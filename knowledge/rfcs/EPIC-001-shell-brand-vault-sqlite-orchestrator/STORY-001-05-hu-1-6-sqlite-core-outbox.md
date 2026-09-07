---
type: RFC
title: STORY-001-05 HU-1.6 Esquema Relacional Base de Lanzamientos, Tareas y Outbox Queue
description: RFC Story — Modelo relacional local en SQLite, árbol de dependencias de tareas y tabla outbox para sincronización
tags: [rfc, story, sqlite, database, outbox, offline-first, governance]
timestamp: 2026-09-07T00:00:00Z
---

# STORY-001-05-hu-1-6-sqlite-core-outbox

## Metadata
- Epic: `EPIC-001-shell-brand-vault-sqlite-orchestrator`
- Story ID: `STORY-001-05`
- Mapping: `HU-1.6`
- Status: `approved`
- Owner: `jaymusicmachine`
- RFC owner slice: `SPEC/jaymusicmachine-EPIC-01-spec05-sqlite-core-outbox`
- Created: `2026-09-07`
- Last Updated: `2026-09-07`

## Context
### Historia de Usuario Oficial
- **Como** Desarrollador y Label Manager,
- **Quiero** disponer de un modelo de datos relacional local (SQLite en Tauri) que gestione la jerarquía completa de Sello $\rightarrow$ Artista $\rightarrow$ Lanzamiento $\rightarrow$ Fases (Pre, Live, Post) $\rightarrow$ Hitos / Tareas, Enlaces de Audio Externos y la tabla `cloud_sync_queue`,
- **Para que** la aplicación disponga de una estructura de persistencia local, reactiva, autónoma y tolerante a desconexión sin depender de la infraestructura pesada de Plane.

### Criterios de Aceptación Oficiales
1. Define y migra el esquema relacional en SQLite con integridad referencial completa para Sellos, Artistas, Lanzamientos, Fases, Tareas y Enlaces externos.
2. Provee operaciones CRUD locales optimizadas con latencia cero a través de Rust IPC en Tauri.
3. Modela el árbol de dependencias básicas (tarea padre, tareas hijas, hitos bloqueantes) listo para ser consumido por el planificador visual y el orquestador.
4. Incluye la tabla `cloud_sync_queue` bajo el Patrón Outbox para garantizar que cambios offline se sincronicen de forma idempotente con Postiz Cloud.

### Problem & Gap Analysis
La persistencia previa dependía teóricamente de importar el código de Plane, lo que acarreaba más de 30 contenedores Docker, latencias innecesarias y fragilidad offline. Esta historia establece la base de datos relacional local nativa y soberana.

---

## Proposal
La historia se compone de **2 Features funcionales** y **4 SPECs técnicas**:

### 🔹 FEATURE 5.1: Motor Relacional SQLite Core y Migraciones DDL Transaccionales
*Sustrato persistente local con soporte relacional completo.*
- **`SPEC-5.1.1` (DDL Normalizado e Integridad Referencial)**:
  - *Problema*: Falta de tablas que modelen la jerarquía de releases, fases y tareas con soporte para tareas padre/hija e hitos bloqueantes (*gatekeepers*).
  - *Solución*: Esquema DDL en SQL puro con llaves foráneas activadas (`PRAGMA foreign_keys = ON;`), cascadas automáticas y soporte para árbol de tareas recursivo (`parent_task_id`).
  - *Capa*: `Infrastructure` (`apps/web/src/infrastructure/db/migrations/001_initial_schema.sql`).
  - *Tests RED*: `tests/infrastructure/db/sqlite-ddl.test.ts`.
- **`SPEC-5.1.2` (Cliente WAL Mode & Migrador Lineal)**:
  - *Problema*: SQLite en modo por defecto bloquea la base de datos cuando hay lecturas simultáneas a una escritura.
  - *Solución*: Cliente `SqliteClient` con activación obligatoria de `PRAGMA journal_mode = WAL;` y migrador determinista que ejecuta scripts DDL secuencialmente sin ORMs pesados.
  - *Capa*: `Infrastructure` (`apps/web/src/infrastructure/db/sqlite-client.ts`).
  - *Tests RED*: `tests/infrastructure/db/sqlite-client.test.ts`.

### 🔹 FEATURE 5.2: Cola Asíncrona Outbox y Transaccionalidad Atómica
*Mecanismo de sincronización eventual offline-first hacia servicios externos.*
- **`SPEC-5.2.1` (Tabla Outbox y Máquina de Estados de Sincronización)**:
  - *Problema*: Pérdida de eventos de sincronización ante micro-cortes de red o cierres repentinos de la app.
  - *Solución*: Tabla `cloud_sync_queue` con payload JSON snapshot, estados (`PENDING`, `PROCESSING`, `SYNCED`, `FAILED`), contador de reintentos e índice compuesto `(status, created_at)`.
  - *Capa*: `Infrastructure` (`apps/web/src/infrastructure/db/repositories/sqlite-outbox-repository.ts`).
  - *Tests RED*: `tests/infrastructure/db/outbox-repository.test.ts`.
- **`SPEC-5.2.2` (Unit of Work Transaccional Atómico)**:
  - *Problema*: Si una tarea se actualiza localmente pero la inserción en la cola outbox falla, la nube nunca se enterará del cambio.
  - *Solución*: Ejecución dentro de una transacción ACID unificada (`db.transaction()`). Si la inserción del evento outbox falla, se revierte automáticamente la mutación del aggregate.
  - *Capa*: `Infrastructure` (`apps/web/src/infrastructure/db/unit-of-work.ts`).
  - *Tests RED*: `tests/infrastructure/db/unit-of-work.test.ts`.

---

## Critique
- Reviewer(s): `architect`, `db`, `ponytail`
- Critical findings:
  1. Las claves primarias deben ser cadenas ordenables en el tiempo (UUIDv7 o nanoid con prefijo temporal) para evitar fragmentación de índices B-Tree en SQLite.
  2. `Ponytail Evaluation`: Usar `better-sqlite3` con queries preparadas en memoria. Descartar Prisma o TypeORM: se ahorran 40MB de dependencias y problemas en empaquetado Tauri.

## Resolution
- Final approach after critique: Adopción de UUIDv7 para IDs primarios e implementación de Unit of Work ligero.

## Decision
- Decision: `approved`
- Decision date: `2026-09-07`
- Decision owner: `jaymusicmachine`

## Status
- Current status: `approved`
- Next action: Diseñar tests RED de llaves foráneas y transaccionalidad outbox.

## Traceability
- Related issue(s): `EPIC-01`, `HU-1.6`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
