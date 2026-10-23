---
type: RFC
title: STORY-002-04 HU-2.2 Alertas de Hitos Bloqueantes (Gatekeepers) y Camino Crítico
description: RFC Story — Motor de detección de cuellos de botella en la cadena crítica (Master -> Distribución -> Pitching DSP) con alertas visuales y acción de auto-resolución en 1-clic.
tags: [rfc, story, gatekeepers, alerts, critical-path, bottleneck]
timestamp: 2026-10-23T17:00:00Z
---

# STORY-002-04: Alertas de Hitos Bloqueantes (Gatekeepers)

## Metadata
- Epic: `EPIC-002-release-planner-engine`
- Story ID: `STORY-002-04`
- Mapping: `HU-2.2`
- Status: `approved`
- Current status: `approved`
- Owner: `jaymusicmachine`
- RFC owner slice: `epic/jaymusicmachine-EPIC-02-release-planner-engine`
- Created: `2026-10-23`
- Last Updated: `2026-10-23`

---

## Context
### Historia de Usuario Oficial
- **Como** Miembro del equipo operativo del sello o Artista,
- **Quiero** que el sistema me notifique si una tarea crítica (como la entrega del máster de audio a $T-14$) se retrasa o expira,
- **Para que** pueda reprogramar automáticamente las dependencias posteriores y evitar perder la ventana estricta de pitching editorial en DSPs (Spotify for Artists requiere mínimo 7 días de antelación para ingresar a listas oficiales).

### Criterios de Aceptación Oficiales
1. Identifica tareas de dependencia estricta y camino crítico (`is_gatekeeper = 1`), por ejemplo: `Entrega de Máster` $\rightarrow$ `Envío a Distribuidora` $\rightarrow$ `Pitching Editorial DSP`.
2. Si la fecha límite (`due_date`) de un hito crítico expira sin marcarse como `DONE`, marca una alerta visual en rojo (`status = BLOCKED` o indicador visual destacado de Gatekeeper Vencido).
3. Detecta violaciones de la ventana editorial de DSPs: si la tarea de pitching queda a menos de 7 días naturales de la fecha $T-0$, emite alerta `CRITICAL` y ofrece una acción en 1-clic: *"Desplazar fecha de estreno $T-0$ en $+N$ días para restaurar margen editorial de 7 días"*.

---

## Proposal
La historia se compone de **2 Features funcionales** y **4 SPECs técnicas**:

### 🔹 FEATURE 2.4.1: Motor de Análisis de Camino Crítico & Detección de Bloqueos
- **`SPEC-2.4.1.1` (Motor Funcional de Detección de Gatekeepers en Capa de Dominio)**:
  - *Solución*: Módulo funcional puro `createGatekeeperEngine()` en Capa 3. Procesa la lista de tareas y aristas de dependencia, localiza tareas con `is_gatekeeper === 1` y fecha vencida (`due_date < nowUtc` con `status !== 'DONE'`), y calcula el retraso acumulado $\Delta t$ en días.
  - *Capa*: `Domain` (`apps/web/src/lib/pipelines/planner/gatekeeper-engine.ts`).
  - *Fase RED (TDD AAA)*:
    - **Arrange**: Conjunto de tareas donde "Entrega del Máster" tenía fecha límite ayer y estado `'TODO'`.
    - **Act**: Invocación de `detectBlockedGatekeepers(tasks, nowUtc)`.
    - **Assert**: Retorna lista con 1 gatekeeper bloqueado, `overdueDays: 1` y tareas dependientes afectadas.
- **`SPEC-2.4.1.2` (Invariante de Ventana de Pitching DSP & Generador de Acción Reparadora)**:
  - *Solución*: Función pura `evaluateDspPitchingWindow(targetDateIso, pitchingDueDateIso)` que calcula la diferencia en días. Si es $< 7$, genera un objeto `DspWindowAlert` con severidad `'CRITICAL'`, días de déficit y la recomendación calculada para desplazar $T-0$.
  - *Capa*: `Domain` (`apps/web/src/lib/pipelines/planner/gatekeeper-invariants.ts`).
  - *Fase RED (TDD AAA)*:
    - **Arrange**: Fecha objetivo $T-0$ en `"2026-11-10T00:00:00Z"`, pitching due date en `"2026-11-06T00:00:00Z"` (margen de solo 4 días).
    - **Act**: Invocar `evaluateDspPitchingWindow`.
    - **Assert**: Retorna `isViolated: true`, `deficitDays: 3` y `suggestedTargetShiftDays: 3`.

### 🔹 FEATURE 2.4.2: Alertas Visuales en Tiempo Real & Acción de Reprogramación
- **`SPEC-2.4.2.1` (Hook Reactivo: `useGatekeeperAlerts`)**:
  - *Solución*: Hook `useGatekeeperAlerts(releaseId)` en Capa 2 que evalúa de forma reactiva las tareas del release y expone `blockedCount`, `hasDspViolation`, `suggestedShiftDays` y la acción `resolveDspWindow()`.
  - *Capa*: `Application` (`apps/web/src/lib/hooks/use-gatekeeper-alerts.ts`).
  - *Fase RED (TDD AAA)*:
    - **Arrange**: Mock del repositorio de tareas con un gatekeeper vencido.
    - **Act**: Montar hook `useGatekeeperAlerts('rel-1')`.
    - **Assert**: `blockedCount` es igual a `1` y `hasDspViolation` es `true`.
- **`SPEC-2.4.2.2` (Componente UI: GatekeeperAlertBanner & Badge)**:
  - *Solución*: Componente accesible `GatekeeperAlertBanner` con diseño de alta visibilidad y botón de acción en 1-clic para abrir el modal de recálculo en cascada con los días de retraso pre-cargados.
  - *Capa*: `Presentation` (`apps/web/src/components/planner/gatekeeper-alert-banner.tsx`).
  - *Fase RED (TDD AAA)*:
    - **Arrange**: Renderizar `<GatekeeperAlertBanner alert={mockAlert} onAutoFix={spy} />`.
    - **Act**: Click en botón "Corregir Ventana DSP (+3 días)".
    - **Assert**: Se dispara `spy` con argumento `3`.

---

## Critique
- *¿Por qué fijar la ventana en 7 días y no hacerla configurable?*  
  Ponytail: 7 días es el estándar inmutable de la industria para Spotify for Artists y Amazon Music for Artists. Añadir configuraciones complejas para valores que nunca cambian en la práctica es sobre-ingeniería innecesaria. Se mantiene el valor estándar de 7 días.

---

## Resolution
Se implementa el motor de detección de camino crítico como funciones puras en Dominio y se provee la acción de auto-resolución en 1-clic hacia el modal de cascada.

---

## Decision
Adoptar funciones funcionales puras para el `GatekeeperEngine` y botón de resolución directa en el banner de UI.

---

## Status
- Status: `approved`
- Current status: `approved`

---

## Traceability
- Epic: [`EPIC-002-release-planner-engine/README.md`](./README.md)
- User Story: `HU-2.2`
- Related PR(s): TBD
- Final commit hash(es): TBD
