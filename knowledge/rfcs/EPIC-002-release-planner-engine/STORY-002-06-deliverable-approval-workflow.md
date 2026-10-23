---
type: RFC
title: STORY-002-06 HU-2.5 Bucle Formal de Aprobación y Rechazo con Feedback de Colaboradores
description: RFC Story — Flujo estructurado de estados para entregables (Borrador -> En Revisión -> Aprobado / Rechazado) con retroalimentación obligatoria y trazabilidad.
tags: [rfc, story, deliverables, approvals, feedback, workflow]
timestamp: 2026-10-23T17:00:00Z
---

# STORY-002-06: Bucle Formal de Aprobación y Rechazo con Feedback de Colaboradores

## Metadata
- Epic: `EPIC-002-release-planner-engine`
- Story ID: `STORY-002-06`
- Mapping: `HU-2.5`
- Status: `approved`
- Current status: `approved`
- Owner: `jaymusicmachine`
- RFC owner slice: `epic/jaymusicmachine-EPIC-02-release-planner-engine`
- Created: `2026-10-23`
- Last Updated: `2026-10-23`

---

## Context
### Historia de Usuario Oficial
- **Como** Label Manager o Artista,
- **Quiero** aprobar o rechazar entregables de campaña (artes de portada, videos de Canvas, copys promocionales, presupuestos) con comentarios específicos de ajuste,
- **Para que** el equipo conozca con claridad qué cambios se requieren antes de continuar hacia la distribución.

### Criterios de Aceptación Oficiales
1. Las tareas con entregables asociados cuentan con estados formales en máquina de estados finita: `DRAFT` (Borrador) $\rightarrow$ `IN_REVIEW` (En Revisión) $\rightarrow$ `APPROVED` (Aprobado) o `REJECTED` (Rechazado).
2. Al rechazar un entregable, el sistema exige de forma obligatoria ingresar un motivo o feedback explicativo (mínimo 10 caracteres válidos, excluyendo espacios en blanco).
3. Mantiene un historial de auditoría de comentarios en la tabla `deliverable_feedbacks` registrando autor, rol (`LABEL_MANAGER` o `ARTIST`), fecha UTC y texto.

---

## Proposal
La historia se compone de **2 Features funcionales** y **4 SPECs técnicas**:

### 🔹 FEATURE 2.6.1: Máquina de Estados de Entregables & Validación de Feedback
- **`SPEC-2.6.1.1` (Máquina de Estados Finita Pura para Entregables)**:
  - *Solución*: Función pura `transitionDeliverable(currentStatus, action, payload)` en Capa 3. Valida transiciones permitidas (`DRAFT` a `IN_REVIEW`, `IN_REVIEW` a `APPROVED` o `REJECTED`, y de `REJECTED` a `DRAFT` para nueva versión). Prohíbe transiciones directas ilegales.
  - *Capa*: `Domain` (`apps/web/src/lib/pipelines/planner/deliverable-state-machine.ts`).
  - *Fase RED (TDD AAA)*:
    - **Arrange**: Entregable en estado `'DRAFT'`.
    - **Act**: Intentar ejecutar acción `'APPROVE'` directamente.
    - **Assert**: Lanza `Error("Invalid transition: Cannot APPROVE deliverable in DRAFT status. Must be IN_REVIEW.")`.
- **`SPEC-2.6.1.2` (Schema Zod para Acciones de Revisión de Entregables)**:
  - *Solución*: Esquema Zod discriminado `ReviewDeliverableActionSchema` en Capa de Dominio que exige `rejection_reason: z.string().trim().min(10, 'El motivo de rechazo debe tener al menos 10 caracteres')` cuando la acción es `REJECT`.
  - *Capa*: `Domain` (`apps/web/src/lib/pipelines/planner/deliverable-schemas.ts`).
  - *Fase RED (TDD AAA)*:
    - **Arrange**: Payload `{ action: 'REJECT', reason: '   no me gusta   ' }` (8 caracteres efectivos tras trim).
    - **Act**: `ReviewDeliverableActionSchema.safeParse(payload)`.
    - **Assert**: Falla validación Zod con mensaje sobre longitud mínima requerida.

### 🔹 FEATURE 2.6.2: Repositorio SQLite de Entregables & Panel UI de Revisión
- **`SPEC-2.6.2.1` (Repositorio SQLite Transaccional de Entregables y Feedbacks)**:
  - *Solución*: Factory funcional `createDeliverableRepository(db)` en Capa 4. Método `submitDeliverableReview(params)` ejecutado en `db.transaction()`: actualiza `task_deliverables.status` y `rejection_reason`, e inserta el registro histórico en `deliverable_feedbacks`.
  - *Capa*: `Infrastructure` (`apps/web/src/lib/infrastructure/db/repositories/sqlite-deliverable-repository.ts`).
  - *Fase RED (TDD AAA)*:
    - **Arrange**: Entregable en estado `'IN_REVIEW'` en base SQLite.
    - **Act**: Ejecutar `submitDeliverableReview` con acción `REJECT` y comentario explicativo.
    - **Assert**: El entregable pasa a `'REJECTED'` y la tabla `deliverable_feedbacks` contiene exactamente 1 comentario asociado.
- **`SPEC-2.6.2.2` (Componente UI: DeliverableReviewPanel)**:
  - *Solución*: Panel interactivo con visor del archivo/enlace, selector de estado y modal con campo de texto para ingresar el feedback obligatorio al pulsar "Rechazar".
  - *Capa*: `Presentation` (`apps/web/src/components/planner/deliverable-review-panel.tsx`).
  - *Fase RED (TDD AAA)*:
    - **Arrange**: Renderizar `<DeliverableReviewPanel deliverable={mockDeliverable} />`.
    - **Act**: Click en botón "Rechazar Entregable".
    - **Assert**: Se despliega modal de feedback con el botón de confirmación deshabilitado hasta que el usuario tipea al menos 10 caracteres.

---

## Critique
- *¿Por qué no usar un sistema de comentarios WebSocket en tiempo real?*  
  Ponytail: En una app local-first de escritorio y web asincrónica, los WebSockets añaden servidores de señalización innecesarios. Guardar comentarios relacionales en `deliverable_feedbacks` bajo SQLite local con sync eventual por Outbox es infinitamente más confiable y libre de fallos de red.

---

## Resolution
Se aprueba el flujo de estados con feedback obligatorio en Dominio y persistencia atómica en `deliverable_feedbacks`.

---

## Decision
Adoptar la máquina de estados funcional pura en Dominio y el repositorio en Infraestructura sin clases.

---

## Status
- Status: `approved`
- Current status: `approved`

---

## Traceability
- Epic: [`EPIC-002-release-planner-engine/README.md`](./README.md)
- User Story: `HU-2.5`
- Related PR(s): TBD
- Final commit hash(es): TBD
