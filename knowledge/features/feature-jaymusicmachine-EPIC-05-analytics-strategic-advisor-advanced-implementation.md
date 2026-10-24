# Solution Spec: analytics-strategic-advisor-advanced Implementation (EPIC-05)

## 1. Governance & Agent Assignment
- **Initiative Planner**: `planner`
- **Lead Implementation Specialist**: `frontend` & `db` (UI Dashboards, CSV Ingestion, SQLite Repositories, Analytics Pipelines)
- **Architect Gatekeeper**: `architect` (Gate 1 Scaffolding & Gate 2 Diff Audit)
- **Quality & Review**: `qa` & `reviewer`
- **Security Auditor**: `security` (Protección anti-SSRF en Modo Avanzado, Sanitización CSV, Borrado Irreversible GDPR)

## 2. Solution Overview & 4-Layer Architecture

La solución implementa un ecosistema de analítica unificada, ingestión de datos y asesoría estratégica local-first sin dependencias de servicios SaaS de terceros, organizado estrictamente en 4 capas funcionales:

```
┌────────────────────────────────────────────────────────────────────────┐
│  CAPA 1: PRESENTACIÓN (apps/web/src/components/)                       │
│  - performance-dashboard-view.tsx (Dashboard Unificado con Filtros)    │
│  - csv-report-uploader.tsx (Carga Drag & Drop y Previsualización CSV)  │
│  - ad-efficiency-card.tsx (Métricas CPA, CPC y Comparador de Variantes)│
│  - strategic-advisor-chat.tsx (Chat con Memoria y Control de Privacidad)│
│  - anomaly-alert-banner.tsx (Banners de Anomalías y Acciones 1-Clic)   │
│  - custom-api-dashboard-view.tsx (Paneles Dinámicos Modo Avanzado)     │
│  - analytics-tool-badge.tsx (Insignias de Ejecución en Chat Lateral)   │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ Consume únicamente vía Hooks React
┌────────────────────────────────────▼───────────────────────────────────┐
│  CAPA 2: APLICACIÓN (apps/web/src/lib/hooks/)                          │
│  - use-performance-dashboard.ts (Filtros por Fase T, Métricas Globales)│
│  - use-csv-ingestion.ts (Validación, Mapeo y Progreso de Ingesta)     │
│  - use-ad-efficiency.ts (Cálculo Reactivo de CPA/CPC y Rendimiento)    │
│  - use-strategic-advisor.ts (Historial, Envío y Purga Irreversible)   │
│  - use-anomaly-detector.ts (Supervisión Reactiva de Métricas y Alertas)│
│  - use-custom-api-dashboard.ts (Conexión, Schema Inference y Widgets)  │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ Consume Lógica Pura y Repositorios
┌────────────────────────────────────▼───────────────────────────────────┐
│  CAPA 3: DOMINIO (apps/web/src/lib/pipelines/analytics/)               │
│  - analytics-schemas.ts (Zod Contracts para Métricas, CSV, Conversiones)│
│  - csv-report-parser.ts (Parser Determinista para Spotify, DistroKid)  │
│  - ad-efficiency-calculator.ts (Fórmulas Puras: CPA, CPC, Conv Rate)  │
│  - anomaly-detection-engine.ts (Heurística de Desviación >30% y Picos) │
│  - json-schema-inferrer.ts (Inferencia Dinámica para Modo Avanzado API)│
│  - tools/analytics-tools.ts (Tools Agénticas con Clasificación Tier 1/2)│
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ Operaciones de Persistencia Aisladas
┌────────────────────────────────────▼───────────────────────────────────┐
│  CAPA 4: INFRAESTRUCTURA (apps/web/src/lib/infrastructure/)            │
│  - db/migrations/007_analytics_advisor.sql (DDL Streaming & Advisor)   │
│  - db/repositories/sqlite-streaming-metrics-repository.ts              │
│  - db/repositories/sqlite-advisor-conversation-repository.ts           │
│  - db/repositories/sqlite-custom-dashboard-repository.ts               │
│  - api/safe-fetch-client.ts (Cliente HTTP con Anti-SSRF para Modo API) │
└────────────────────────────────────────────────────────────────────────┘
```

## 3. Atomic Slices & Logical Sequence

Cada SPEC se implementa como una unidad vertical que contiene internamente su ciclo TDD completo (RED -> GREEN -> REFACTOR) sin crear tareas aisladas de solo-tests o solo-refactor:

- **`SPEC-05-01` (HU-5.1: Dashboard Centralizado de Rendimiento)**:
  - Consolidación de métricas de escuchas, reproducciones, interacciones sociales y conversiones por fase de lanzamiento ($T-14$ a $T-1$, $T-0$ a $T+7$, $T+8$ en adelante).
  - Repositorio SQLite `sqlite-streaming-metrics-repository.ts` y componente `performance-dashboard-view.tsx`.
- **`SPEC-05-02` (HU-5.4: Ingesta de Reportes CSV de Streaming)**:
  - Parser determinista tolerante a fallos (`csv-report-parser.ts`) para exportaciones de Spotify for Artists, DistroKid y genéricos.
  - Mapeo automático de columnas: `streams`, `listeners`, `saves`, `country_code` y series temporales.
  - Componente de carga `csv-report-uploader.tsx` y pruebas de integración SQLite.
- **`SPEC-05-03` (HU-5.5: Cálculo de Eficiencia y Retorno de Pauta - CPA/CPC)**:
  - Calculador puramente matemático (`ad-efficiency-calculator.ts`) cruzando inversión de `ad_campaigns` con conversiones registradas.
  - Métricas calculadas: CPA (Cost per Acquisition), CPC (Cost per Click), Conversion Rate (%), y ranking de creativos más eficientes.
  - Componente `ad-efficiency-card.tsx`.
- **`SPEC-05-04` (HU-5.2: Asesoría Estratégica con Memoria y Control de Privacidad)**:
  - Persistencia relacional de conversaciones y mensajes estructurados (`advisor_conversations`, `advisor_messages`).
  - Motor de contexto agregando analíticas actuales al prompt del asesor.
  - Mecanismo de purga irreversible (Hard Delete) garantizando privacidad y cumplimiento GDPR.
  - Hook `use-strategic-advisor.ts` y chat `strategic-advisor-chat.tsx`.
- **`SPEC-05-05` (HU-5.6: Alertas Proactivas de Anomalías y Riesgos)**:
  - Algoritmo de detección heurística (`anomaly-detection-engine.ts`) identificando caídas de engagement/streams > 30% contra promedios móviles de 7 días.
  - Generador de sugerencias tácticas accionables con ejecución o descarte en 1 clic.
  - Componente `anomaly-alert-banner.tsx`.
- **`SPEC-05-06` (HU-5.3 & HU-6.1 v5: Creación Autónoma de Paneles API y Tools)**:
  - Inferencia de esquemas JSON (`json-schema-inferrer.ts`) a partir de payloads de endpoints externos con validación anti-SSRF.
  - Repositorio `sqlite-custom-dashboard-repository.ts` y vista `custom-api-dashboard-view.tsx`.
  - Catálogo de herramientas agénticas (`analytics-tools.ts`) con insignias visuales `analytics-tool-badge.tsx`.

## 4. TDD (Test-Driven Development) Strategy
Cada una de las 6 historias contará con sus suites de pruebas unitarias y de integración desarrolladas bajo el estándar `tdd-primal` antes de implementar el código de producción:
- `tests/domain/analytics/csv-report-parser.test.ts`: Validación de sintaxis CSV, manejo de comillas, errores de parsing y normalización de columnas.
- `tests/domain/analytics/ad-efficiency-calculator.test.ts`: Pruebas de cálculo de CPA, CPC, porcentajes y divisiones por cero.
- `tests/domain/analytics/anomaly-detection-engine.test.ts`: Detección de caídas > 30%, detección de picos y generación de sugerencias.
- `tests/domain/analytics/json-schema-inferrer.test.ts`: Inferencia de tipos primitivos, series numéricas y protección de campos.
- `tests/domain/analytics/analytics-tools.test.ts`: Contratos Zod y validación de ejecución de tools de analítica.
- `tests/infrastructure/db/streaming-metrics-repository.test.ts`: Ingesta, agregaciones por ventana temporal y filtrado por fecha.
- `tests/infrastructure/db/advisor-conversation-repository.test.ts`: Persistencia de mensajes, paginación y purga irreversible.
- `tests/infrastructure/db/custom-dashboard-repository.test.ts`: Almacenamiento de configuraciones de paneles y widgets.
- `tests/components/performance-dashboard-view.test.tsx`: Renderizado accesible de métricas y filtros temporales.
- `tests/components/csv-report-uploader.test.tsx`: Carga de archivos, validación y feedback de progreso.
- `tests/components/ad-efficiency-card.test.tsx`: Visualización de métricas financieras y estados vacíos.
- `tests/components/strategic-advisor-chat.test.tsx`: Interacción conversacional y botón de borrado seguro.
- `tests/components/anomaly-alert-banner.test.tsx`: Renderizado de tarjetas de alerta y clics de acción.

## 5. Local Definition of Done (DoD)
- [ ] La fase en `.agents/active_task_state.json` avanza secuencialmente hasta `PHASE_8_HUMAN_MERGE_APPROVED`.
- [ ] La suite de pruebas de Épica 5 (unitarias y de componentes) pasa al 100% en verde.
- [ ] `pnpm validate` se ejecuta limpiamente con 0 errores de ESLint, TypeScript, licencias, doc governance, arquitectura y harness.
- [ ] Auditoría de Arquitectura Gate 2 aprobada formalmente por el subagente `architect` (0 clases, 4 capas estrictas, in-code commentary verificado).
- [ ] Aprobación explícita del humano (Human Acceptance) recibida antes de proceder con el PR.
- [ ] `pnpm pr:auto` ejecutado exitosamente con etiquetas y cuerpo canónico de PR.

## 6. Spec Artifact Traceability
- **Problem Spec**: [feature-jaymusicmachine-EPIC-05-analytics-strategic-advisor-advanced.md](./knowledge/features/feature-jaymusicmachine-EPIC-05-analytics-strategic-advisor-advanced.md)
- **Solution Spec**: [feature-jaymusicmachine-EPIC-05-analytics-strategic-advisor-advanced-implementation.md](./knowledge/features/feature-jaymusicmachine-EPIC-05-analytics-strategic-advisor-advanced-implementation.md)
- **Linear Issue**: [EPIC-05](https://linear.app/indie-suite/issue/EPIC-05)
