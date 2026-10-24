---
type: RFC
title: STORY-002-02 HU-2.1 Creación de Lanzamiento por Arquetipo (Plantillas Musicales)
description: RFC Story — Motor de generación de cronogramas basados en plantillas preconfiguradas para la industria (Single 6 sem, EP 8 sem, Álbum 12 sem, Remix 4 sem) calculadas respecto a T-0.
tags: [rfc, story, archetypes, planner, templates, schedule]
timestamp: 2026-10-23T17:00:00Z
---

# STORY-002-02: Creación de Lanzamiento por Arquetipo (Plantillas Musicales)

## Metadata
- Epic: `EPIC-002-release-planner-engine`
- Story ID: `STORY-002-02`
- Mapping: `HU-2.1`
- Status: `approved`
- Current status: `approved`
- Owner: `jaymusicmachine`
- RFC owner slice: `epic/jaymusicmachine-EPIC-02-release-planner-engine`
- Created: `2026-10-23`
- Last Updated: `2026-10-23`

---

## Context
### Historia de Usuario Oficial
- **Como** A&R o Label Manager,
- **Quiero** seleccionar una plantilla de lanzamiento (Single, EP, Álbum, Remix) e ingresar la fecha objetivo ($T-0$),
- **Para que** el sistema autogenere la secuencia completa de tareas, fases y fechas límite de pre, live y post-lanzamiento en el SQLite local.

### Criterios de Aceptación Oficiales
1. Ofrece al menos 4 plantillas preconfiguradas con duraciones estándar:
   - **Single Debut / Sencillo:** 6 semanas ($T-42$ a $T+14$).
   - **EP Release:** 8 semanas ($T-56$ a $T+21$).
   - **Álbum Completo:** 12 semanas ($T-84$ a $T+28$).
   - **Remix / Edición Deluxe:** 4 semanas ($T-28$ a $T+7$).
2. Distribuye automáticamente las tareas a lo largo del calendario calculadas hacia atrás y adelante de la fecha de salida ($T-0$) fijadas estrictamente en formato ISO UTC (`YYYY-MM-DD` a las `00:00:00Z`).
3. Permite añadir, reordenar o remover tareas específicas dentro de la secuencia generada sin corromper la integridad referencial.

---

## Proposal
La historia se compone de **2 Features funcionales** y **4 SPECs técnicas**:

### 🔹 FEATURE 2.2.1: Catálogo de Arquetipos & Motor de Cálculo de Fechas
- **`SPEC-2.2.1.1` (Definición de Plantillas de Arquetipos y Tareas Maestras)**:
  - *Solución*: Catálogo inmutable de solo lectura `ARCHETYPE_TEMPLATES` en Capa de Dominio con las 4 plantillas musicales, definiendo para cada tarea su `offset_days`, fase y marca `is_gatekeeper`.
  - *Capa*: `Domain` (`apps/web/src/lib/pipelines/planner/archetype-templates.ts`).
  - *Fase RED (TDD AAA)*:
    - **Arrange**: Importar `ARCHETYPE_TEMPLATES`.
    - **Act**: Consultar plantilla `'SINGLE'`.
    - **Assert**: Verifica que contiene fase `PRE_RELEASE`, tarea `'Entrega del Máster'` con `offset_days: -14` y `is_gatekeeper: true`.
- **`SPEC-2.2.1.2` (Motor de Proyección Temporal Relativo a $T-0$ en UTC Estricto)**:
  - *Solución*: Función pura `calculateScheduleDates(targetDateUtcIso, template)` que suma algebraicamente los offsets a la fecha $T-0$ normalizada a medianoche UTC, eliminando derivas por Daylight Saving Time (DST).
  - *Capa*: `Domain` (`apps/web/src/lib/pipelines/planner/schedule-projector.ts`).
  - *Fase RED (TDD AAA)*:
    - **Arrange**: Fecha objetivo $T-0$ fijada en `"2026-11-20T00:00:00.000Z"`. Tarea con offset `-14`.
    - **Act**: Invocación de `calculateScheduleDates`.
    - **Assert**: La fecha resultante calculada es exactamente `"2026-11-06T00:00:00.000Z"`.

### 🔹 FEATURE 2.2.2: Generación Transaccional en SQLite & Modal de Selección
- **`SPEC-2.2.2.1` (Generador Transaccional de Lanzamiento en SQLite)**:
  - *Solución*: Función factory `createReleasePlannerRepository(db)` en Capa 4 con método `generateReleaseFromArchetype(params)` envuelto en `db.transaction()`. Inserta de forma atómica: 1 registro en `releases`, 3 registros en `release_phases`, $N$ registros en `release_tasks` y sus dependencias en `task_dependencies`.
  - *Capa*: `Infrastructure` (`apps/web/src/lib/infrastructure/db/repositories/sqlite-task-repository.ts`).
  - *Fase RED (TDD AAA)*:
    - **Arrange**: Conexión SQLite en memoria con esquema `004_release_planner.sql`.
    - **Act**: Llamar a `generateReleaseFromArchetype` con plantilla `'EP'`.
    - **Assert**: La base de datos contiene exactamente 3 fases vinculadas al `release_id` y todas las tareas hijas tienen foreign keys válidas.
- **`SPEC-2.2.2.2` (Componente UI: ArchetypeSelectorModal)**:
  - *Solución*: Modal accesible con selección visual de tarjetas de arquetipo, visualizador de duración total y selector de fecha $T-0$.
  - *Capa*: `Presentation` (`apps/web/src/components/planner/archetype-selector-modal.tsx`).
  - *Fase RED (TDD AAA)*:
    - **Arrange**: Renderizar modal con mock callback `onSelectArchetype`.
    - **Act**: Click en la tarjeta "Álbum Completo (12 semanas)" y click en "Generar Planificador".
    - **Assert**: Callback invocado con `{ archetype: 'ALBUM', targetDate: '...' }`.

---

## Critique
- *¿Por qué no usar librerías externas de diagramas de Gantt para renderizar las plantillas?*  
  Ponytail: Las librerías de Gantt pesadas aumentan el bundle en >250KB y dificultan la accesibilidad y el modo oscuro. Renderizar una lista ordenada por fases con badges nativos de Tailwind y cálculo de offsets es 10 veces más ligero y rápido.

---

## Resolution
Se implementa el catálogo de arquetipos como estructuras inmutables en Dominio y la inserción atómica en SQLite en Infraestructura.

---

## Decision
Adoptar `ARCHETYPE_TEMPLATES` inmutables y persistencia atómica en SQLite mediante `db.transaction()`.

---

## Status
- Status: `approved`
- Current status: `approved`

---

## Traceability
- Epic: [`EPIC-002-release-planner-engine/README.md`](./README.md)
- User Story: `HU-2.1`
- Related PR(s): TBD
- Final commit hash(es): TBD
