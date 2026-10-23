---
type: RFC
title: EPIC-002 Motor Visual de Planificación y Gestión Estratégica de Lanzamientos (Sustituto Nativo de Plane)
description: RFC Epic README — Metadata, alcance, criterios de éxito, índice canónico de 8 historias, bitácora de decisiones arquitectónicas, análisis de riesgos y trazabilidad
tags: [rfc, epic, governance, planner, releases, sqlite, tauri, gatekeepers, cascade, rbac]
timestamp: 2026-10-23T17:00:00Z
---

# EPIC-002-release-planner-engine

## Metadata
- Epic ID: `EPIC-002`
- Title: `Motor Visual de Planificación y Gestión Estratégica de Lanzamientos (Sustituto Nativo de Plane)`
- Status: `approved`
- Owner: `jaymusicmachine`
- Spec owner slice: `epic/jaymusicmachine-EPIC-02-release-planner-engine`
- Created: `2026-10-23`
- Last Updated: `2026-10-23`

---

## Scope
- **Problem statement:** Ausencia de un motor determinista, local-first y adaptado a la industria musical para planificar lanzamientos sin la sobrecarga técnica y de infraestructura pesada de herramientas genéricas como Plane (12 contenedores Docker, Celery, Redis, RabbitMQ, PostgreSQL). Falta de semántica musical en calendarios ($T-0$, ventanas de pitching editorial DSP de 7 días, arquetipos de formato, enlaces de audio externos y alertas de gatekeepers críticos).
- **Business goal:** Dotar a sellos discográficos y artistas independientes de un motor de planificación ligero embebido en SQLite con modo WAL (< 80MB de RAM), que automatice la creación de cronogramas por arquetipo (Single, EP, Álbum, Remix), detecte cuellos de botella en la entrega del máster, recalcule en cascada de forma atómica y ofrezca una vista asimétrica auditable para el artista.
- **Technical goal:** Implementar el esquema relacional DDL `004_release_planner.sql`, clientes y repositorios funcionales en TypeScript (sin uso de `class`), validador HTTP ligero de audio con protección exhaustiva anti-SSRF (bloqueo de IPv4 privadas, IPv6, metadatos y `redirect: manual`), algoritmo de recálculo topológico sobre DAG con detección preventiva de ciclos y persistencia de snapshot de Undo en SQLite (`schedule_undo_snapshots`), bucle formal de estados de entregables (`DRAFT` -> `IN_REVIEW` -> `APPROVED` | `REJECTED`) con feedback obligatorio, y 4 herramientas agénticas de planificación con guardrails para el `AssistantSidebar`.
- **Out of scope:** Generación multimedia y curaduría de portadas en lote (Épica 3), publicación y pauta programática hacia redes sociales con Postiz Cloud (Épica 4), analítica unificada de reproducciones (Épica 5), y servidor MCP público (Épica 6).

---

## Success Criteria
- [x] Esquema relacional DDL `004_release_planner.sql` con tablas `release_concepts`, `release_phases`, `release_tasks`, `task_dependencies`, `external_audio_links`, `task_deliverables`, `deliverable_feedbacks`, `schedule_undo_snapshots` e índices inversos para consultas en grafo.
- [x] Contexto Nivel 3 (Ficha Conceptual) con validación Zod estricta para ISRC (ISO 3901), UPC (12 dígitos), presupuesto $USD y congelamiento inmutable de snapshot (`snapshot_frozen = 1`).
- [x] Generador por arquetipos (Single 6 sem, EP 8 sem, Álbum 12 sem, Remix 4 sem) proyectando fechas UTC absolutas relativas a $T-0$ con inserción transaccional ACID en SQLite.
- [x] Gestor de enlaces de audio externos (`MASTER_WAV`, `INSTRUMENTAL`, `STEMS`, `ACAPELLA`) con validador HTTP en Capa 4 (Infraestructura), blindaje anti-SSRF exhaustivo (IPv4 privada/loopback, IPv6, `redirect: manual`, prevención de DNS rebinding) y auto-completado transaccional del hito del máster.
- [x] Motor de detección de gatekeepers con alertas visuales de camino crítico y verificación de la invariante de 7 días de antelación para pitching en DSPs con botón de acción en 1-clic para reprogramar.
- [x] Algoritmo de desplazamiento topológico en DAG acíclico con detección preventiva de ciclos al insertar dependencias (`assertNoCycle`), tabla comparativa Antes/Después y tabla SQLite `schedule_undo_snapshots` con invalidación reactiva ante mutaciones intermedias.
- [x] Máquina de estados de entregables (`DRAFT` -> `IN_REVIEW` -> `APPROVED` | `REJECTED`) con feedback explicativo obligatorio de mínimo 10 caracteres ante rechazo.
- [x] Conmutador de perspectiva de roles (`RolePreviewToggle`) en la app desktop para filtrar estrictamente la vista del artista sin requerir infraestructura remota.
- [x] Catálogo de 4 tools agénticas (`crear_tarea`, `mover_fecha_lanzamiento`, `consultar_gatekeepers`, `recalcular_cronograma`) con clasificación de riesgo e integración con `GuardrailInterceptor`.

---

## Story Index
| Story ID | Title | RFC File | Status | PR | Notes |
| --- | --- | --- | --- | --- | --- |
| STORY-002-01 | HU-1.4 Ficha Conceptual del Lanzamiento (Contexto Nivel 3) | STORY-002-01-release-context-level3.md | approved | TBD | Contexto Nivel 3 & Snapshot Inmutable |
| STORY-002-02 | HU-2.1 Creación de Lanzamiento por Arquetipo (Plantillas Musicales) | STORY-002-02-archetype-planner-templates.md | approved | TBD | 4 Arquetipos (Single, EP, Álbum, Remix) |
| STORY-002-03 | HU-2.4 Registro y Validación de Enlaces a Activos de Audio | STORY-002-03-audio-asset-links.md | approved | TBD | HTTP Ligero, Anti-SSRF Exhaustivo & Auto-Done |
| STORY-002-04 | HU-2.2 Alertas de Hitos Bloqueantes (Gatekeepers) y Camino Crítico | STORY-002-04-gatekeeper-alerts.md | approved | TBD | Detección DAG & Invariante DSP (7 días) |
| STORY-002-05 | HU-2.6 Recálculo en Cascada del Cronograma ante Retrasos Críticos | STORY-002-05-cascade-schedule-recalculation.md | approved | TBD | Desplazamiento Topológico & Undo SQLite |
| STORY-002-06 | HU-2.5 Bucle Formal de Aprobación/Rechazo con Feedback | STORY-002-06-deliverable-approval-workflow.md | approved | TBD | FSM Entregables & Historial Feedback |
| STORY-002-07 | HU-2.3 Vista Diferenciada por Roles (RBAC Local & RolePreviewToggle) | STORY-002-07-role-preview-toggle.md | approved | TBD | Conmutador de Perspectiva (Manager/Artista) |
| STORY-002-08 | HU-6.1 (v2) Tools de Planificación para el Asistente Lateral Operativo | STORY-002-08-sidebar-planner-tools.md | approved | TBD | 4 Tools con Guardrails en Sidebar |

---

## Decision Log
| Date | Story | Decision | Owner | Link |
| --- | --- | --- | --- | --- |
| 2026-10-23 | STORY-002-01 | Almacenar el contexto de lanzamiento congelado como snapshot JSON inmutable en la tabla `release_concepts` al iniciar producción para blindar copys contra cambios posteriores en el artista | jaymusicmachine | [STORY-002-01-release-context-level3.md](./STORY-002-01-release-context-level3.md) |
| 2026-10-23 | STORY-002-02 | Adoptar duraciones estándar de la industria (Single 6 sem, EP 8 sem, Álbum 12 sem, Remix 4 sem) calculadas como offsets negativos/positivos relativos a T-0 en UTC estricto | jaymusicmachine | [STORY-002-02-archetype-planner-templates.md](./STORY-002-02-archetype-planner-templates.md) |
| 2026-10-23 | STORY-002-03 | Reubicar el cliente HTTP de validación a Capa 4 (Infraestructura) con bloqueo exhaustivo de rangos privados (IPv4 RFC 1918, IPv6, loopback, metadata) y `redirect: manual` | jaymusicmachine | [STORY-002-03-audio-asset-links.md](./STORY-002-03-audio-asset-links.md) |
| 2026-10-23 | STORY-002-04 | Establecer la ventana de 7 días naturales como límite duro antes de T-0 para pitching editorial en DSPs con alerta visual roja y botón de auto-resolución | jaymusicmachine | [STORY-002-04-gatekeeper-alerts.md](./STORY-002-04-gatekeeper-alerts.md) |
| 2026-10-23 | STORY-002-05 | Implementar ordenamiento topológico en Capa 3, detección preventiva de ciclos al insertar dependencias (`assertNoCycle`) y persistencia atómica del snapshot de Undo en tabla SQLite | jaymusicmachine | [STORY-002-05-cascade-schedule-recalculation.md](./STORY-002-05-cascade-schedule-recalculation.md) |
| 2026-10-23 | STORY-002-06 | Diseñar máquina de estados pura para entregables (`DRAFT`, `IN_REVIEW`, `APPROVED`, `REJECTED`) exigiendo motivo obligatorio de >= 10 caracteres ante rechazo | jaymusicmachine | [STORY-002-06-deliverable-approval-workflow.md](./STORY-002-06-deliverable-approval-workflow.md) |
| 2026-10-23 | STORY-002-07 | Implementar `RolePreviewToggle` como filtro puro en memoria y hook reactivo, sin autenticación remota en esta etapa (principio Ponytail) | jaymusicmachine | [STORY-002-07-role-preview-toggle.md](./STORY-002-07-role-preview-toggle.md) |
| 2026-10-23 | STORY-002-08 | Exponer 4 herramientas de planificación en Vercel AI SDK Core clasificando mutaciones como `SENSITIVE` con interceptación interactiva de Guardrails | jaymusicmachine | [STORY-002-08-sidebar-planner-tools.md](./STORY-002-08-sidebar-planner-tools.md) |

---

## 4-Layer Architecture Map & DDL Specification

```
apps/web/src/
├── components/planner/             # Capa 1: Presentación (UI interactiva)
│   ├── release-timeline.tsx
│   ├── release-concept-card.tsx
│   ├── archetype-selector-modal.tsx
│   ├── audio-links-manager.tsx
│   ├── gatekeeper-alert-banner.tsx
│   ├── cascade-preview-modal.tsx
│   ├── deliverable-review-panel.tsx
│   └── role-preview-toggle.tsx
├── lib/hooks/                      # Capa 2: Aplicación (Hooks reactivos & State)
│   ├── use-release-planner.ts
│   ├── use-audio-link-verification.ts
│   ├── use-gatekeeper-alerts.ts
│   ├── use-cascade-recalc.ts
│   ├── use-deliverable-workflow.ts
│   └── use-role-perspective.ts
├── lib/pipelines/planner/          # Capa 3: Dominio (Lógica de Negocio Pura)
│   ├── archetype-templates.ts
│   ├── cascade-calculator.ts
│   ├── gatekeeper-engine.ts
│   ├── deliverable-state-machine.ts
│   ├── role-permissions.ts
│   ├── planner-schemas.ts
│   └── tools/planner-tools.ts
└── lib/infrastructure/             # Capa 4: Infraestructura (SQLite, HTTP & Repositorios)
    ├── http/audio-link-client.ts   # Cliente HTTP anti-SSRF desacoplado de Dominio
    └── db/
        ├── migrations/004_release_planner.sql
        └── repositories/
            ├── sqlite-release-concept-repository.ts
            ├── sqlite-task-repository.ts
            ├── sqlite-audio-link-repository.ts
            └── sqlite-deliverable-repository.ts
```

### DDL DDL Canónico (`004_release_planner.sql`)
```sql
PRAGMA foreign_keys = ON;

-- 1. Ficha Conceptual del Lanzamiento (Contexto Nivel 3)
CREATE TABLE IF NOT EXISTS release_concepts (
  id TEXT PRIMARY KEY,
  release_id TEXT NOT NULL UNIQUE,
  narrative TEXT NOT NULL,
  lyric_theme TEXT NOT NULL,
  sound_mood TEXT NOT NULL,
  isrc TEXT,
  upc TEXT,
  target_date TEXT NOT NULL,
  budget_usd REAL NOT NULL DEFAULT 0.0 CHECK (budget_usd >= 0),
  snapshot_frozen INTEGER NOT NULL DEFAULT 0 CHECK (snapshot_frozen IN (0, 1)),
  frozen_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(release_id) REFERENCES releases(id) ON DELETE CASCADE
);

-- 2. Fases del Lanzamiento (Pre, Live, Post)
CREATE TABLE IF NOT EXISTS release_phases (
  id TEXT PRIMARY KEY,
  release_id TEXT NOT NULL,
  phase_type TEXT NOT NULL CHECK (phase_type IN ('PRE_RELEASE', 'LIVE_RELEASE', 'POST_RELEASE')),
  name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(release_id) REFERENCES releases(id) ON DELETE CASCADE
);

-- 3. Tareas e Hitos del Cronograma
CREATE TABLE IF NOT EXISTS release_tasks (
  id TEXT PRIMARY KEY,
  release_id TEXT NOT NULL,
  phase_id TEXT NOT NULL,
  parent_task_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  assigned_role TEXT NOT NULL DEFAULT 'LABEL_MANAGER' CHECK (assigned_role IN ('LABEL_MANAGER', 'ARTIST', 'COLLABORATOR')),
  due_date TEXT NOT NULL,
  offset_days INTEGER NOT NULL, -- Relativo a T-0 (negativo = antes, positivo = después)
  is_gatekeeper INTEGER NOT NULL DEFAULT 0 CHECK (is_gatekeeper IN (0, 1)),
  status TEXT NOT NULL DEFAULT 'TODO' CHECK (status IN ('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED')),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(release_id) REFERENCES releases(id) ON DELETE CASCADE,
  FOREIGN KEY(phase_id) REFERENCES release_phases(id) ON DELETE CASCADE,
  FOREIGN KEY(parent_task_id) REFERENCES release_tasks(id) ON DELETE SET NULL
);

-- 4. Grafo de Dependencias entre Tareas (DAG) con Índice Inverso
CREATE TABLE IF NOT EXISTS task_dependencies (
  task_id TEXT NOT NULL,
  prerequisite_task_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (task_id, prerequisite_task_id),
  FOREIGN KEY(task_id) REFERENCES release_tasks(id) ON DELETE CASCADE,
  FOREIGN KEY(prerequisite_task_id) REFERENCES release_tasks(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_task_deps_prereq ON task_dependencies(prerequisite_task_id);

-- 5. Enlaces de Audio Externos con Restricción de Unicidad
CREATE TABLE IF NOT EXISTS external_audio_links (
  id TEXT PRIMARY KEY,
  release_id TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('MASTER_WAV', 'INSTRUMENTAL', 'STEMS', 'ACAPELLA')),
  url TEXT NOT NULL,
  verified_status TEXT NOT NULL DEFAULT 'UNVERIFIED' CHECK (verified_status IN ('UNVERIFIED', 'VERIFIED', 'ERROR')),
  verified_at TEXT,
  mime_type TEXT,
  file_size_bytes INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(release_id) REFERENCES releases(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_external_audio_release_cat ON external_audio_links(release_id, category);

-- 6. Entregables y Feedback de Colaboradores
CREATE TABLE IF NOT EXISTS task_deliverables (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  title TEXT NOT NULL,
  asset_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'IN_REVIEW', 'APPROVED', 'REJECTED')),
  rejection_reason TEXT,
  reviewed_at TEXT,
  reviewed_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(task_id) REFERENCES release_tasks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS deliverable_feedbacks (
  id TEXT PRIMARY KEY,
  deliverable_id TEXT NOT NULL,
  author_role TEXT NOT NULL CHECK (author_role IN ('LABEL_MANAGER', 'ARTIST')),
  comment TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(deliverable_id) REFERENCES task_deliverables(id) ON DELETE CASCADE
);

-- 7. Snapshot Atómico para Deshacer (Undo Stack en SQLite)
CREATE TABLE IF NOT EXISTS schedule_undo_snapshots (
  id TEXT PRIMARY KEY,
  release_id TEXT NOT NULL,
  snapshot_json TEXT NOT NULL,
  is_valid INTEGER NOT NULL DEFAULT 1 CHECK (is_valid IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(release_id) REFERENCES releases(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_undo_release_valid ON schedule_undo_snapshots(release_id, is_valid);

-- Índices de consulta de rendimiento
CREATE INDEX IF NOT EXISTS idx_tasks_release_phase ON release_tasks(release_id, phase_id);
CREATE INDEX IF NOT EXISTS idx_tasks_gatekeeper ON release_tasks(release_id, is_gatekeeper);
CREATE INDEX IF NOT EXISTS idx_deliverables_task ON task_deliverables(task_id, status);
```
