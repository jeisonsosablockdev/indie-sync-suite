---
type: RFC
title: STORY-002-05 HU-2.6 Recálculo en Cascada del Cronograma ante Retrasos Críticos
description: RFC Story — Algoritmo de propagación en cascada de fechas sobre el árbol de tareas con detección preventiva de ciclos en DAG, vista previa Antes/Después y Undo atómico en SQLite.
tags: [rfc, story, cascade, recalculation, undo, schedule, sqlite, dag]
timestamp: 2026-10-23T17:00:00Z
---

# STORY-002-05: Recálculo en Cascada del Cronograma ante Retrasos Críticos

## Metadata
- Epic: `EPIC-002-release-planner-engine`
- Story ID: `STORY-002-05`
- Mapping: `HU-2.6`
- Status: `approved`
- Current status: `approved`
- Owner: `jaymusicmachine`
- RFC owner slice: `epic/jaymusicmachine-EPIC-02-release-planner-engine`
- Created: `2026-10-23`
- Last Updated: `2026-10-23`

---

## Context
### Historia de Usuario Oficial
- **Como** A&R o Planificador del sello discográfico,
- **Quiero** que el sistema recalcule automáticamente las fechas de las tareas dependientes cuando un hito se pospone o la fecha del lanzamiento cambia,
- **Para que** el cronograma general mantenga la coherencia temporal sin necesidad de editar fecha por fecha a mano.

### Criterios de Aceptación Oficiales
1. Al cambiar la fecha de un hito padre o desplazar la fecha objetivo $T-0$, proyecta el impacto en cascada sobre todas las tareas hijas dependientes en el DAG ordenado topológicamente.
2. Detección preventiva de ciclos: Impide la inserción de aristas que generen referencias circulares en el grafo de tareas (`assertNoCycle(db, taskId, prerequisiteTaskId)`).
3. Presenta una previsualización interactiva con el "Antes" y "Después" de las fechas propuestas destacando los cambios en días ($\pm N$ días).
4. Aplica los cambios en bloque tras la confirmación explícita del usuario dentro de una transacción SQLite atómica, guardando el estado anterior en la tabla `schedule_undo_snapshots`. Si el usuario realiza una edición manual posterior, el snapshot de Undo se invalida automáticamente (`is_valid = 0`).

---

## Proposal
La historia se compone de **2 Features funcionales** y **4 SPECs técnicas**:

### 🔹 FEATURE 2.5.1: Algoritmo de Desplazamiento Topológico & Validación de Grafo
- **`SPEC-2.5.1.1` (Calculador de Desplazamiento Topológico & Detección de Ciclos)**:
  - *Solución*: Algoritmo funcional puro `calculateCascadeShift(tasks, dependencies, modifiedTaskId, deltaDays)` en Capa 3. Realiza ordenamiento topológico (Kahn / DFS), verifica ausencia de ciclos y propaga fechas:
    $$\text{nueva\_fecha}(T) = \max(\text{fecha\_actual}(T) + \Delta t, \max_{P \in \text{padres}}(\text{nueva\_fecha}(P) + \text{offset}(P, T)))$$
  - *Capa*: `Domain` (`apps/web/src/lib/pipelines/planner/cascade-calculator.ts`).
  - *Fase RED (TDD AAA)*:
    - **Arrange**: Grafo A -> B -> C. A se retrasa 4 días.
    - **Act**: Invocación de `calculateCascadeShift(tasks, deps, 'A', 4)`.
    - **Assert**: B y C se desplazan exactamente 4 días hacia adelante. Si se introduce C -> A, la función arroja error `DAG_CYCLE_DETECTED`.
- **`SPEC-2.5.1.2` (Validador Preventivo de Aristas en SQLite: `assertNoCycle`)**:
  - *Solución*: Método funcional `assertNoCycle(db, taskId, prerequisiteTaskId)` en `sqlite-task-repository.ts` que recorre el grafo de prerequisitos de `prerequisiteTaskId` antes de insertar en `task_dependencies`; si encuentra `taskId`, aborta la inserción antes de escribir en disco.
  - *Capa*: `Infrastructure` (`apps/web/src/lib/infrastructure/db/repositories/sqlite-task-repository.ts`).
  - *Fase RED (TDD AAA)*:
    - **Arrange**: Base de datos con dependencia existente Tarea 1 -> Tarea 2.
    - **Act**: Intentar insertar dependencia Tarea 2 -> Tarea 1.
    - **Assert**: La transacción arroja `Error("Cyclic dependency detected: Task 2 cannot depend on Task 1")` y no modifica `task_dependencies`.

### 🔹 FEATURE 2.5.2: Mutación Atómica en SQLite con Tabla Undo & Modal Diff
- **`SPEC-2.5.2.1` (Aplicador Transaccional de Cronograma con `schedule_undo_snapshots`)**:
  - *Solución*: Factory funcional `createTaskRepository(db)` con métodos `applyCascadeDiff(releaseId, diff)` y `revertLastCascade(releaseId)`. Guarda el snapshot JSON previo en `schedule_undo_snapshots` con `is_valid = 1`. Si cualquier tarea del release es editada manualmente de forma aislada, un trigger o método `invalidateUndoSnapshot(releaseId)` marca `is_valid = 0`.
  - *Capa*: `Infrastructure` (`apps/web/src/lib/infrastructure/db/repositories/sqlite-task-repository.ts`).
  - *Fase RED (TDD AAA)*:
    - **Arrange**: Aplicar un diff de cascada en SQLite.
    - **Act**: Invocar `revertLastCascade(releaseId)`.
    - **Assert**: Todas las tareas recuperan sus fechas originales y el snapshot queda marcado como `is_valid = 0`.
- **`SPEC-2.5.2.2` (Componente UI: CascadePreviewModal con Vista Antes / Después)**:
  - *Solución*: Componente modal interactivo `CascadePreviewModal` con tabla comparativa de columnas: Tarea, Fase, Fecha Anterior, Fecha Nueva, $\Delta$ Días y botón "Aplicar Cronograma". Tras aplicar, expone toast con botón "Deshacer Recálculo".
  - *Capa*: `Presentation` (`apps/web/src/components/planner/cascade-preview-modal.tsx`).
  - *Fase RED (TDD AAA)*:
    - **Arrange**: Renderizar modal con mock de diff de 3 tareas desplazadas.
    - **Act**: Click en "Confirmar y Aplicar".
    - **Assert**: Se invoca el callback `onConfirm` y se cierra el modal.

---

## Critique
- *¿Por qué persistir el Undo en una tabla SQLite en lugar de Zustand en memoria?*  
  Si el usuario recarga la ventana de la app en Tauri o el navegador se refresca, un estado en memoria se pierde irremediablemente. Almacenarlo en la tabla `schedule_undo_snapshots` garantiza atomicidad transaccional ACID y persistencia segura de sesión.

---

## Resolution
Se adopta la tabla `schedule_undo_snapshots` con clave de invalidación y el validador preventivo `assertNoCycle` al insertar aristas en `task_dependencies`.

---

## Decision
Implementar el algoritmo topológico puro en Dominio y el almacenamiento de snapshot en la tabla SQLite de Infraestructura.

---

## Status
- Status: `approved`
- Current status: `approved`

---

## Traceability
- Epic: [`EPIC-002-release-planner-engine/README.md`](./README.md)
- User Story: `HU-2.6`
- Related PR(s): TBD
- Final commit hash(es): TBD
