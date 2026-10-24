# Solution Spec: multichannel-distribution-postiz Implementation (Épica 4)

## 1. Governance & Agent Assignment
- **Initiative Planner**: `planner`
- **Lead Implementation Specialist**: `frontend` + `api` + `db`
- **Architect Gatekeeper**: `architect` (Gate 1 & Gate 2)
- **Quality & Review**: `qa` & `reviewer`
- **Security Auditor**: `security` (Protección de tokens OAuth, URLs prefirmadas y prevención de SSRF)

## 2. Solution Overview & 4-Layer Architecture

La implementación de la Épica 4 sigue estrictamente la arquitectura funcional en 4 capas desacopladas, cero clases (`class`), inmutabilidad determinista y persistencia en `node:sqlite`:

### Capa 1: Presentación (UI / React Server Components & Client Hooks)
- `apps/web/src/components/distribution/oauth-hub-card.tsx`: Tarjetas de estado de conexión de perfiles sociales con botón de vinculación OAuth y renovación de tokens.
- `apps/web/src/components/distribution/social-calendar-view.tsx`: Cuadrícula de calendario mensual y semanal con hito destacado $T-0$ (Release Day) y slots de publicación.
- `apps/web/src/components/distribution/micro-campaign-modal.tsx`: Modal de configuración de microcampañas de pauta ($20–$100 USD) con confirmación explícita.
- `apps/web/src/components/distribution/sync-queue-monitor.tsx`: Panel de monitoreo de la cola Outbox con estado de reintentos y alertas de errores (*dead-letter*).
- `apps/web/src/components/assistant/distribution-tool-badge.tsx`: Tarjeta interactiva en el streaming del chat lateral para autorizar pautas y calendarizaciones.

### Capa 2: Aplicación (Hooks React & Consumo)
- `apps/web/src/lib/hooks/use-oauth-hub.ts`: Hook reactivo para consultar conexiones sociales, refrescar estado de salud y disparar autorización.
- `apps/web/src/lib/hooks/use-social-calendar.ts`: Hook para gestionar eventos de publicación, filtrado por canal y reprogramación temporal.
- `apps/web/src/lib/hooks/use-micro-campaign.ts`: Hook para calcular presupuestos, validar links de pre-save y coordinar campañas de pauta.
- `apps/web/src/lib/hooks/use-sync-queue.ts`: Hook reactivo para inspeccionar el estado de la cola `cloud_sync_queue` y forzar reintentos manuales.

### Capa 3: Dominio (Pipelines Puros, Reglas de Negocio & Algoritmos)
- `apps/web/src/lib/pipelines/distribution/distribution-schemas.ts`: Esquemas Zod para conexiones OAuth, posts programados, microcampañas y eventos outbox.
- `apps/web/src/lib/pipelines/distribution/media-handshake-service.ts`: Generador puro de metadatos de handshake asociando `content_hash` SHA-256 a la clave de almacenamiento S3/R2.
- `apps/web/src/lib/pipelines/distribution/calendar-slot-calculator.ts`: Algoritmo determinista para proyectar slots óptimos de publicación respecto al hito $T-0$ ($T-14$, $T-7$, $T-0$, $T+7$).
- `apps/web/src/lib/pipelines/distribution/ad-campaign-calculator.ts`: Calculador de distribución de micro-presupuestos ($20–$100 USD) entre plataformas publicitarias (Meta Ads y TikTok Ads).
- `apps/web/src/lib/pipelines/distribution/tools/distribution-tools.ts`: Catálogo de tools ejecutables para el agente (`programar_publicacion`, `lanzar_campana_pauta`, `consultar_calendario_posts`) con clasificación de riesgo Tier 1 vs Tier 2.

### Capa 4: Infraestructura (SQLite Repositories, Migraciones & Cliente Postiz)
- `apps/web/src/lib/infrastructure/db/migrations/006_distribution_postiz.sql`: DDL para tablas `social_connections`, `scheduled_posts`, `ad_campaigns` y ampliación de `cloud_sync_queue`.
- `apps/web/src/lib/infrastructure/db/repositories/sqlite-social-connection-repository.ts`: Factory funcional para persistencia y consulta de cuentas conectadas.
- `apps/web/src/lib/infrastructure/db/repositories/sqlite-scheduled-post-repository.ts`: Factory funcional para gestión CRUD de posts programados vinculados a entregables y cronograma.
- `apps/web/src/lib/infrastructure/db/repositories/sqlite-ad-campaign-repository.ts`: Factory funcional para persistencia y tracking de microcampañas de anuncios.
- `apps/web/src/lib/infrastructure/postiz/postiz-api-client.ts`: Cliente HTTP determinista y testeable para la API REST headless de Postiz Cloud con protección anti-SSRF.
- `apps/web/src/lib/infrastructure/postiz/cloud-sync-worker.ts`: Worker en segundo plano que procesa la cola `cloud_sync_queue` con retroceso exponencial (máx 3 reintentos).

---

## 3. Atomic Slices & Logical Sequence (6 SPECs)

Cada SPEC individual ejecuta internamente su propio ciclo Red-Green-Refactor completo (TDD Red -> Green -> Refactor):

- **SPEC-04-01 (HU-4.3)**: Conexión y Gestión de Cuentas Sociales (OAuth Hub, estado de salud y renovación).
- **SPEC-04-02 (HU-4.1)**: Protocolo Media Handshake & Programación Multicanal con Pre-Signed URLs.
- **SPEC-04-03 (HU-4.4)**: Calendario Visual de Contenidos Sincronizado con el Hito $T-0$ (Release Day).
- **SPEC-04-04 (HU-4.2)**: Motor de Microcampañas de Pauta ($20–$100 USD en Meta/TikTok Ads).
- **SPEC-04-05 (HU-4.5)**: Cola de Reintentos Outbox y Alertas de Fallos de Publicación (*Dead-Letter*).
- **SPEC-04-06 (HU-6.1 v4)**: Tools de Distribución Multicanal para el Asistente Lateral con Guardrails Tier 2.

---

## 4. TDD (Test-Driven Development) Strategy

### Unit/Integration Tests (Fase RED)
- **Domain Schemas & Handshake**: `tests/domain/distribution/distribution-schemas.test.ts`
- **Media Handshake Service**: `tests/domain/distribution/media-handshake-service.test.ts`
- **Calendar Slot Calculator**: `tests/domain/distribution/calendar-slot-calculator.test.ts`
- **Ad Campaign Calculator**: `tests/domain/distribution/ad-campaign-calculator.test.ts`
- **Distribution Tools**: `tests/domain/distribution/distribution-tools.test.ts`
- **SQLite Repositories**:
  - `tests/infrastructure/db/social-connection-repository.test.ts`
  - `tests/infrastructure/db/scheduled-post-repository.test.ts`
  - `tests/infrastructure/db/ad-campaign-repository.test.ts`
- **Postiz Client & Sync Worker**:
  - `tests/infrastructure/postiz/postiz-api-client.test.ts`
  - `tests/infrastructure/postiz/cloud-sync-worker.test.ts`
- **UI Components**:
  - `tests/components/oauth-hub-card.test.tsx`
  - `tests/components/social-calendar-view.test.tsx`
  - `tests/components/micro-campaign-modal.test.tsx`
  - `tests/components/sync-queue-monitor.test.tsx`
  - `tests/components/distribution-tool-badge.test.tsx`

---

## 5. Local Definition of Done (DoD)
- [ ] La fase actual del tracker de estado es `PHASE_8_HUMAN_MERGE_APPROVED`.
- [ ] La suite de pruebas de regresión pasa al 100% (verde).
- [ ] `pnpm validate` se ejecuta con 0 errores y 0 warnings.
- [ ] La documentación de arquitectura local y de base de datos está actualizada (`006_distribution_postiz.sql`).
- [ ] Aprobación explícita del humano registrada.

---

## 6. Spec Artifact Traceability
- **Problem Spec**: [feature-jaymusicmachine-EPIC-04-multichannel-distribution-postiz.md](./knowledge/features/feature-jaymusicmachine-EPIC-04-multichannel-distribution-postiz.md)
- **Solution Spec**: [feature-jaymusicmachine-EPIC-04-multichannel-distribution-postiz-implementation.md](./knowledge/features/feature-jaymusicmachine-EPIC-04-multichannel-distribution-postiz-implementation.md)
- **Linear Issue**: [Linear Ticket #EPIC-04](https://linear.app/indie-suite/issue/EPIC-04)
