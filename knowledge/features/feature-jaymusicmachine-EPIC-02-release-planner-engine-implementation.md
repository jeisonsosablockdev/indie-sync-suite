# Solution Spec: release-planner-engine Implementation (Épica 2)

## 1. Governance & Agent Assignment
- **Initiative Planner**: `planner`
- **Lead Implementation Specialist**: `frontend` (para componentes UI y hooks), `db` (para SQLite WAL y migración DDL `004_release_planner.sql`) y `api` (para cliente HTTP anti-SSRF y tools agénticas).
- **Architect Gatekeeper**: `architect` (Gate 1 Scaffolding Review & Gate 2 Post-Implementation Diff Audit).
- **Quality & Review**: `qa` & `reviewer`
- **Security Auditor**: `security` (en cliente HTTP anti-SSRF de enlaces externos y políticas de riesgo de tools).

---

## 2. Solution Overview & 4-Layer Architecture

La solución implementa el motor de planificación musical desacoplado en 4 capas estrictas sobre SQLite local y Next.js 16, respetando la prohibición de `class` mediante el patrón de funciones factory funcionales:

### Capa 1: Presentación (Presentation Layer)
- `apps/web/src/components/planner/release-timeline.tsx`: Vista visual del cronograma interactivo agrupado por fases (`PRE_RELEASE`, `LIVE_RELEASE`, `POST_RELEASE`).
- `apps/web/src/components/planner/release-concept-card.tsx`: Tarjeta de visualización y edición del contexto de release (ISRC, UPC, narrativa, mood, presupuesto) con indicador de snapshot inmutable.
- `apps/web/src/components/planner/archetype-selector-modal.tsx`: Modal para seleccionar entre Single, EP, Álbum y Remix, previsualizar duración y fijar fecha $T-0$.
- `apps/web/src/components/planner/audio-links-manager.tsx`: Gestor de URLs externas de audio con verificación HTTP en vivo y badges de estado.
- `apps/web/src/components/planner/gatekeeper-alert-banner.tsx`: Banner de advertencia de hitos críticos bloqueados o ventanas de pitching en riesgo (< 7 días) con botón de auto-resolución en 1-clic.
- `apps/web/src/components/planner/cascade-preview-modal.tsx`: Modal interactivo que expone la tabla comparativa "Antes vs Después" de fechas recalculadas con botón de confirmación y toast de *Undo*.
- `apps/web/src/components/planner/deliverable-review-panel.tsx`: Panel de revisión de artes y copys con estados formales y formulario modal de retroalimentación obligatoria.
- `apps/web/src/components/planner/role-preview-toggle.tsx`: Conmutador de perspectiva (`LABEL_MANAGER` vs `ARTIST`) para auditar la vista del creador.
- `apps/web/src/components/assistant/planner-tool-badge.tsx`: Renderizador de tarjetas interactivas de planificación en el streaming del chat lateral.

### Capa 2: Aplicación / Consumo (Application Layer)
- `apps/web/src/lib/hooks/use-release-planner.ts`: Hook principal de carga y mutación reactiva de lanzamientos, fases y tareas desde SQLite.
- `apps/web/src/lib/hooks/use-audio-link-verification.ts`: Hook que gestiona el estado de validación HTTP ligera de enlaces de audio externos.
- `apps/web/src/lib/hooks/use-gatekeeper-alerts.ts`: Hook que detecta cuellos de botella y expone alertas de tareas bloqueantes.
- `apps/web/src/lib/hooks/use-cascade-recalc.ts`: Hook que coordina la previsualización del diff en cascada y la aplicación atómica con token de reversión.
- `apps/web/src/lib/hooks/use-deliverable-workflow.ts`: Hook para transicionar entregables y registrar comentarios de feedback.
- `apps/web/src/lib/hooks/use-role-perspective.ts`: Hook de gestión del rol simulado activo con persistencia de sesión local.

### Capa 3: Dominio / Pipelines / Servicios (Domain Layer - Puramente Funcional, Cero I/O)
- `apps/web/src/lib/pipelines/planner/planner-schemas.ts`: Esquemas Zod para conceptos de release, tareas, fases, dependencias y diff de cronograma.
- `apps/web/src/lib/pipelines/planner/archetype-templates.ts`: Definición inmutable de las 4 plantillas estándar de la industria (Single, EP, Álbum, Remix) con offsets relativos en días.
- `apps/web/src/lib/pipelines/planner/schedule-projector.ts`: Función pura que proyecta fechas absolutas UTC a medianoche a partir de $T-0$ y offsets en días.
- `apps/web/src/lib/pipelines/planner/audio-link-schemas.ts`: Esquemas Zod para categorías de audio e invariantes de enlace.
- `apps/web/src/lib/pipelines/planner/gatekeeper-engine.ts`: Algoritmo de detección de hitos bloqueantes vencidos e invariante de 7 días para pitching en DSPs.
- `apps/web/src/lib/pipelines/planner/cascade-calculator.ts`: Algoritmo de ordenamiento topológico sobre el grafo de tareas (DAG) para propagar retrasos y recalcular fechas preservando dependencias.
- `apps/web/src/lib/pipelines/planner/deliverable-state-machine.ts`: Máquina de estados finita pura (`DRAFT` $\rightarrow$ `IN_REVIEW` $\rightarrow$ `APPROVED` \| `REJECTED`) con validación de feedback obligatorio.
- `apps/web/src/lib/pipelines/planner/role-permissions.ts`: Matriz de permisos y selectores de filtrado de tareas por rol.
- `apps/web/src/lib/pipelines/planner/tools/planner-tools.ts`: Catálogo de tools de planificación para el asistente agéntico (`crear_tarea`, `mover_fecha_lanzamiento`, `consultar_gatekeepers`, `recalcular_cronograma`) con clasificación de riesgo e interceptor de Guardrails.
- `apps/web/src/lib/pipelines/planner/prompts/planner-assistant-prompt.ts`: Prompt especializado con directrices temporales de la industria musical.

### Capa 4: Infraestructura / Persistencia / Red (Infrastructure Layer)
- `apps/web/src/lib/infrastructure/http/audio-link-client.ts`: Cliente HTTP en Capa 4 con validación anti-SSRF exhaustiva (bloqueo IPv4 RFC 1918, IPv6, loopback, metadata de nube), `redirect: manual` y timeout de 3.5s vía `AbortController`.
- `apps/web/src/lib/infrastructure/db/migrations/004_release_planner.sql`: DDL relacional con tablas `release_concepts`, `release_phases`, `release_tasks`, `task_dependencies`, `external_audio_links`, `task_deliverables`, `deliverable_feedbacks`, `schedule_undo_snapshots` e índices de rendimiento.
- `apps/web/src/lib/infrastructure/db/repositories/sqlite-release-concept-repository.ts`: Factory funcional `createReleaseConceptRepository(db)` para CRUD de conceptos y congelamiento inmutable de snapshot.
- `apps/web/src/lib/infrastructure/db/repositories/sqlite-task-repository.ts`: Factory funcional `createTaskRepository(db)` para tareas, dependencias con `assertNoCycle` preventivo, y recálculo en cascada con persistencia en `schedule_undo_snapshots`.
- `apps/web/src/lib/infrastructure/db/repositories/sqlite-audio-link-repository.ts`: Factory funcional `createAudioLinkRepository(db)` para enlaces de audio y auto-completado transaccional del hito del máster.
- `apps/web/src/lib/infrastructure/db/repositories/sqlite-deliverable-repository.ts`: Factory funcional `createDeliverableRepository(db)` para entregables e historial de feedback.

---

## 3. Atomic Slices & Logical Sequence

Cada historia se abordará en su propia rama SPEC con el ciclo Red-Green-Refactor completo:

1. **`SPEC-02-01` (HU-1.4: Ficha Conceptual del Lanzamiento & Contexto Nivel 3)**
   - *Rama:* `SPEC/jaymusicmachine-EPIC-02-spec01-release-context-level3`
   - *Entregable:* Schemas Zod, snapshot inmutable, repositorio SQLite y componente `ReleaseConceptCard`.
2. **`SPEC-02-02` (HU-2.1: Creación de Lanzamiento por Arquetipo)**
   - *Rama:* `SPEC/jaymusicmachine-EPIC-02-spec02-archetype-planner-templates`
   - *Entregable:* Catálogo de 4 arquetipos, proyector temporal UTC, generador transaccional en SQLite y `ArchetypeSelectorModal`.
3. **`SPEC-02-03` (HU-2.4: Registro y Validación de Enlaces de Audio)**
   - *Rama:* `SPEC/jaymusicmachine-EPIC-02-spec03-audio-asset-links`
   - *Entregable:* Validador anti-SSRF HTTP ligero en Infraestructura, repositorio de enlaces con auto-completado del hito del máster y `AudioLinksManager`.
4. **`SPEC-02-04` (HU-2.2: Alertas de Hitos Bloqueantes & Camino Crítico)**
   - *Rama:* `SPEC/jaymusicmachine-EPIC-02-spec04-gatekeeper-alerts`
   - *Entregable:* Motor de gatekeepers, invariante de ventana de 7 días de pitching DSP, hook reactivo y `GatekeeperAlertBanner`.
5. **`SPEC-02-05` (HU-2.6: Recálculo en Cascada del Cronograma & Undo)**
   - *Rama:* `SPEC/jaymusicmachine-EPIC-02-spec05-cascade-schedule-recalculation`
   - *Entregable:* Calculador topológico de desplazamiento en grafo DAG con detección preventiva de ciclos (`assertNoCycle`), aplicador atómico con `schedule_undo_snapshots` y `CascadePreviewModal`.
6. **`SPEC-02-06` (HU-2.5: Bucle Formal de Aprobación de Entregables con Feedback)**
   - *Rama:* `SPEC/jaymusicmachine-EPIC-02-spec06-deliverable-approval-workflow`
   - *Entregable:* Máquina de estados de entregables, repositorio de feedback transaccional y `DeliverableReviewPanel`.
7. **`SPEC-02-07` (HU-2.3: Vista Diferenciada por Roles & RolePreviewToggle)**
   - *Rama:* `SPEC/jaymusicmachine-EPIC-02-spec07-role-preview-toggle`
   - *Entregable:* Matriz de permisos de rol, filtros de perspectiva, hook de estado y componente `RolePreviewToggle`.
8. **`SPEC-02-08` (HU-6.1 v2: Tools de Planificación para Asistente Lateral)**
   - *Rama:* `SPEC/jaymusicmachine-EPIC-02-spec08-sidebar-planner-tools`
   - *Entregable:* Tools tipadas (`crear_tarea`, `mover_fecha_lanzamiento`, `consultar_gatekeepers`, `recalcular_cronograma`), integración con GuardrailInterceptor y tarjetas en UI.

---

## 4. TDD (Test-Driven Development) Strategy: Escenarios AAA de Fase RED

Para garantizar que ningún código de producción se escriba sin pruebas en fallo previas, se establecen los escenarios formales Arrange-Act-Assert:

### Suite 1: Contexto Nivel 3 (`tests/domain/planner/release-concept.test.ts`)
- **Arrange:** Payload con ISRC inválido `"ABC-123"` y presupuesto negativo `-$500`.
- **Act:** `ReleaseConceptSchema.safeParse(payload)`.
- **Assert:** Retorna `success: false` identificando fallas en `isrc` y `budget_usd`.
- **Arrange:** Concepto guardado en SQLite con `snapshot_frozen = 1`.
- **Act:** Invocar `updateReleaseConcept()`.
- **Assert:** Rechaza la operación arrojando `Error("Cannot modify frozen release concept")`.

### Suite 2: Arquetipos Musicales (`tests/domain/planner/archetype-templates.test.ts`)
- **Arrange:** Fecha objetivo $T-0$ en `"2026-11-20T00:00:00Z"` con plantilla `'SINGLE'`.
- **Act:** Invocar `calculateScheduleDates(targetDate, template)`.
- **Assert:** La tarea "Entrega del Máster" (offset -14) tiene fecha `"2026-11-06T00:00:00Z"` y el lanzamiento tiene 3 fases.

### Suite 3: Audio Links & Anti-SSRF (`tests/infrastructure/http/audio-link-client.test.ts`)
- **Arrange:** Servidor mock con respuestas para: URL pública válida, IP privada `172.18.0.2`, metadata `169.254.169.254`, IPv6 `::1` y redirect 302 hacia `127.0.0.1`.
- **Act:** Invocar `verifyAudioLink(url)` para cada vector.
- **Assert:** La URL pública retorna `{ valid: true }`, mientras que todos los vectores privados/redirect son bloqueados con `SSRF_BLOCKED`.
- **Arrange:** Guardar enlace `MASTER_WAV` verificado en SQLite.
- **Act:** Invocar `saveAudioLinkAndCompleteMilestone(params)`.
- **Assert:** La tarea de entrega del máster pasa atómicamente a `status = 'DONE'`.

### Suite 4: Gatekeepers & Ventana DSP (`tests/domain/planner/gatekeeper-engine.test.ts`)
- **Arrange:** Lanzamiento con fecha $T-0$ en 5 días y tarea de pitching DSP no realizada (`status: TODO`).
- **Act:** Invocar `evaluateDspPitchingWindow(targetDate, pitchingDueDate)`.
- **Assert:** Emite `isViolated: true`, `deficitDays: 2` y sugerencia de desplazamiento en $+2$ días.

### Suite 5: Cascada & Detección de Ciclos (`tests/domain/planner/cascade-calculator.test.ts`)
- **Arrange:** Grafo con dependencias Tarea 1 -> Tarea 2 -> Tarea 3.
- **Act:** Intentar insertar dependencia Tarea 3 -> Tarea 1 en SQLite vía `assertNoCycle`.
- **Assert:** Lanza error `DAG_CYCLE_DETECTED` y la base de datos no se altera.
- **Arrange:** Desplazar Tarea 1 en $+5$ días y aplicar en SQLite.
- **Act:** Invocar `revertLastCascade(releaseId)`.
- **Assert:** Todas las tareas restauran sus fechas previas y el snapshot pasa a `is_valid = 0`.

### Suite 6: Entregables & Feedback (`tests/domain/planner/deliverable-workflow.test.ts`)
- **Arrange:** Entregable en estado `'DRAFT'`.
- **Act:** Intentar transición directa a `'APPROVED'`.
- **Assert:** Lanza error de transición inválida (debe transicionar a `'IN_REVIEW'` primero).
- **Arrange:** Rechazar entregable con motivo de solo 4 caracteres `"mal"`.
- **Act:** Invocar `submitDeliverableReview()`.
- **Assert:** Falla con error de validación exigiendo mínimo 10 caracteres explicativos.

### Suite 7: Roles & Perspectiva (`tests/domain/planner/role-permissions.test.ts`)
- **Arrange:** Usuario con rol simulado `'ARTIST'`.
- **Act:** Evaluar `canViewField('ARTIST', 'budget_usd')` y `filterTasksByRole(allTasks, 'ARTIST')`.
- **Assert:** Retorna `false` para presupuestos y excluye tareas operativas del sello.

### Suite 8: Tools Agénticas en Sidebar (`tests/domain/planner/planner-tools.test.ts`)
- **Arrange:** Tool `mover_fecha_lanzamiento` invocada con nueva fecha.
- **Act:** Procesar a través de `GuardrailInterceptor`.
- **Assert:** La promesa se suspende, se genera `executionId` con TTL de 5 minutos y se emite solicitud de confirmación humana con diff estructurado.

---

## 5. Local Definition of Done (DoD)
- [ ] DDL `004_release_planner.sql` migrado con integridad referencial completa en SQLite WAL con índices inversos y tabla `schedule_undo_snapshots`.
- [ ] Las 8 Historias de Usuario (32 SPECs) implementadas con sus tests TDD pasando al 100% en verde bajo el ciclo Red-Green-Refactor.
- [ ] `pnpm validate` ejecutado limpiamente con 0 errores de TypeScript, 0 lints, 0 fallos de arquitectura y verificación de licencias exitosa.
- [ ] In-code commentary obligatorio presente en cada archivo (`@file`, `@layer`, `@description`, JSDoc/TSDoc).
- [ ] Integración en la consola principal `apps/web/src/app/page.tsx` sin regresión en Brand Vault ni BYOK.
- [ ] Aprobación explícita del humano registrada como `Human Acceptance`.

---

## 6. Spec Artifact Traceability
- **RFC Suite:** [`knowledge/rfcs/EPIC-002-release-planner-engine/README.md`](../rfcs/EPIC-002-release-planner-engine/README.md)
- **Problem Spec:** [`knowledge/features/feature-jaymusicmachine-EPIC-02-release-planner-engine.md`](./feature-jaymusicmachine-EPIC-02-release-planner-engine.md)
- **Concept Spec Source of Truth:** [`knowledge/proposals/indie-sync-suite-concept.md`](../proposals/indie-sync-suite-concept.md)
