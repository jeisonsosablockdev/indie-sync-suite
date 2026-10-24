# Solution Spec: creative-pipeline-engine Implementation (Épica 3)

## 1. Governance & Agent Assignment
- **Initiative Planner**: `planner`
- **Lead Implementation Specialist**: `frontend` (para componentes UI de estudio creativo, canvas tipográfico y hooks), `db` (para SQLite WAL y migración DDL `005_creative_pipeline.sql`), `api` (para orquestación de prompts, clientes multimodales y tools agénticas).
- **Architect Gatekeeper**: `architect` (Gate 1 Scaffolding Review & Gate 2 Post-Implementation Diff Audit).
- **Quality & Review**: `qa` & `reviewer`
- **Security Auditor**: `security` (en validación de buffers de imagen, prevención de Path Traversal en almacenamiento local de assets y verificación de BYOK credentials).

---

## 2. Solution Overview & 4-Layer Architecture

La solución implementa el pipeline creativo multimedia y el repositorio central de activos desacoplado estrictamente en 4 capas sobre SQLite local y Next.js 16, cumpliendo la regla de **cero `class`** mediante funciones factory puras e inmutabilidad funcional:

```
┌────────────────────────────────────────────────────────┐
│ Capa 1: Presentación (Presentation / UI)               │
│ - Studio View, Batch Grid, Typography Canvas, Vault    │
├────────────────────────────────────────────────────────┤
│ Capa 2: Aplicación / Consumo (Application / Hooks)     │
│ - useCreativeStudio, usePromptStudio, useAssetVault    │
├────────────────────────────────────────────────────────┤
│ Capa 3: Dominio / Pipelines (Pure Functional Domain)   │
│ - Prompt Builder, Copy Generator, Typo Compositor      │
├────────────────────────────────────────────────────────┤
│ Capa 4: Infraestructura / Persistencia (SQLite / IO)   │
│ - Repositories, DDL Migration 005, Media Storage       │
└────────────────────────────────────────────────────────┘
```

### Capa 1: Presentación (Presentation Layer)
- `apps/web/src/components/creative/creative-studio-view.tsx`: Panel principal del estudio creativo con selector de release, formato de asset y pestañas de generación.
- `apps/web/src/components/creative/prompt-studio-panel.tsx`: Editor interactivo de prompts maestros en texto plano con desglose modular, edición manual, selector de presets (Midjourney, Flux, Runway, Raw) y botón de copiado 1-clic.
- `apps/web/src/components/creative/batch-generation-grid.tsx`: Cuadrícula responsiva que renderiza 4 variantes simultáneas con botones de acción rápida (`Aprobar`, `Descartar`, `Regenerar`).
- `apps/web/src/components/creative/social-copy-drawer.tsx`: Cajón interactivo de redacción de copys por fase de campaña, conteo de caracteres en tiempo real y selector de red social.
- `apps/web/src/components/creative/typography-stamping-canvas.tsx`: Editor visual interactivo de maquetación tipográfica que sobrepone título y artista con fuentes oficiales y exportación a 3000×3000 px.
- `apps/web/src/components/creative/asset-vault-gallery.tsx`: Repositorio visual unificado de entregables aprobados categorizado por ratio (1:1, 9:16, 16:9, Textos) con badges de hash SHA-256.
- `apps/web/src/components/assistant/creative-tool-badge.tsx`: Tarjeta interactiva de previsualización de assets y prompts en el chat lateral.

### Capa 2: Aplicación / Consumo (Application Layer)
- `apps/web/src/lib/hooks/use-creative-studio.ts`: Hook principal de orquestación de generación multimedia, selección de formato y estado del estudio.
- `apps/web/src/lib/hooks/use-prompt-studio.ts`: Hook para compilar, editar, actualizar en SQLite y copiar prompts maestros al portapapeles sin costo de renderizado.
- `apps/web/src/lib/hooks/use-batch-curation.ts`: Hook que administra el ciclo de vida del lote de 4 variantes y su aprobación hacia tareas del planificador.
- `apps/web/src/lib/hooks/use-social-copy.ts`: Hook para generar y refinar textos promocionales por fase de campaña ($T-14$, $T-7$, $T-0$, $T+7$).
- `apps/web/src/lib/hooks/use-typography-stamping.ts`: Hook que coordina las capas vectoriales sobre la imagen base y el renderizado exportable de alta resolución.
- `apps/web/src/lib/hooks/use-asset-vault.ts`: Hook de consulta, filtrado y descarga de activos aprobados con integridad criptográfica SHA-256.

### Capa 3: Dominio / Pipelines / Lógica Pura (Pure Functional Domain - Cero I/O)
- `apps/web/src/lib/pipelines/creative/creative-schemas.ts`: Esquemas Zod estrictos para dimensiones de asset (1:1 3000px, 9:16 1080x1920px, 16:9 1920x1080px), categorías, estados y metadatos EXIF/RGBA.
- `apps/web/src/lib/pipelines/creative/prompt-schemas.ts`: Esquemas Zod para la estructura del prompt maestro (sujeto, paleta, estilo, iluminación, cámara, prompt negativo, preset de plataforma).
- `apps/web/src/lib/pipelines/creative/creative-prompt-builder.ts`: Función pura que compila el contexto de marca de 3 niveles en prompts deterministas estructurados.
- `apps/web/src/lib/pipelines/creative/platform-prompt-formatter.ts`: Formateador puro que adapta un prompt maestro a los sintaxis específicos de Midjourney v6 (`--ar`, `--style raw`), Flux/SD, Runway/Kling y Texto Plano.
- `apps/web/src/lib/pipelines/creative/social-copy-generator.ts`: Motor determinista de generación de textos promocionales por fase de lanzamiento y límites de caracteres por plataforma.
- `apps/web/src/lib/pipelines/creative/typography-compositor.ts`: Algoritmo de cálculo de maquetación tipográfica (bounding boxes, kerning, escala y contraste) independiente del entorno de renderizado.
- `apps/web/src/lib/pipelines/creative/asset-hasher.ts`: Función pura de cálculo de hash SHA-256 sobre buffers binarios o strings canónicos para garantizar inmutabilidad.
- `apps/web/src/lib/pipelines/creative/tools/creative-tools.ts`: Catálogo de tools ejecutables para el orquestador agéntico (`generar_portada`, `generar_copy`, `copiar_prompt`, `actualizar_prompt`, `listar_activos_aprobados`).
- `apps/web/src/lib/pipelines/creative/prompts/creative-assistant-prompt.ts`: Prompt del sistema con directrices de dirección de arte musical y directrices de copy sin clichés.

### Capa 4: Infraestructura / Persistencia / Red (Infrastructure Layer)
- `apps/web/src/lib/infrastructure/db/migrations/005_creative_pipeline.sql`: DDL relacional con tablas `creative_prompts`, `creative_assets`, `generation_batches`, `typography_presets`, claves foráneas con `ON DELETE CASCADE` e índices de búsqueda por `release_id` y `content_hash`.
- `apps/web/src/lib/infrastructure/db/repositories/sqlite-creative-prompt-repository.ts`: Factory funcional `createCreativePromptRepository(db)` para CRUD, versionado y actualización de prompts en SQLite.
- `apps/web/src/lib/infrastructure/db/repositories/sqlite-creative-asset-repository.ts`: Factory funcional `createCreativeAssetRepository(db)` para persistencia de activos, vinculación con entregables (`deliverable_id`) y gestión de hashes.
- `apps/web/src/lib/infrastructure/db/repositories/sqlite-batch-repository.ts`: Factory funcional `createBatchRepository(db)` para seguimiento de lotes de variantes y estados de triage.
- `apps/web/src/lib/infrastructure/media/local-asset-storage.ts`: Módulo de almacenamiento de archivos locales con prevención de Path Traversal y persistencia de buffers en el directorio de usuario de la app.
- `apps/web/src/lib/infrastructure/media/canvas-export-renderer.ts`: Renderizador de alta resolución para generar imágenes exportables a 3000×3000 px en PNG/JPG.

---

## 3. Mandatory In-Code Commentary Standard

Todo archivo de código (`.ts`, `.tsx`, `.sql`) implementado en la Épica 3 debe cumplir estrictamente:
1. **Header de archivo declarativo**:
   ```typescript
   /**
    * @file <nombre-del-archivo>.ts
    * @layer <Presentation | Application | Domain | Infrastructure>
    * @description <Descripción precisa de la responsabilidad funcional>
    */
   ```
2. **TSDoc completo en cada función factory, tipo y schema Zod**: declarando `@param`, `@returns` e `@invariants`.
3. **Indicadores de lógica paso a paso**: marcados explícitamente en el cuerpo de las funciones:
   `// Step 1: Validar invariantes de entrada`
   `// Step 2: Compilar directrices de marca`
   `// Step 3: Retornar estructura inmutable`
4. **Cero `class`**: 100% funciones puras, factory functions (`createRepository(db)`) e interfaces inmutables.

---

## 4. Atomic Slices & Logical Sequence (SPECs de Ejecución)

1. **`SPEC-03-01` (HU-3.6: Estudio y Gestión de Prompts Editables - Prompt Studio & Text-Only Workflow)**
   - *Rama:* `SPEC/jaymusicmachine-EPIC-03-spec01-prompt-studio-text-only`
   - *Entregable:* Schemas de prompt Zod, `platform-prompt-formatter.ts`, `creative-prompt-builder.ts`, migración SQLite para `creative_prompts`, repositorio y componente `PromptStudioPanel` con copiado a Midjourney/Flux.
2. **`SPEC-03-02` (HU-3.1: Generación de Assets Anclados a la Marca)**
   - *Rama:* `SPEC/jaymusicmachine-EPIC-03-spec02-brand-anchored-asset-generation`
   - *Entregable:* Schemas de dimensiones musicales (1:1, 9:16, 16:9), conector multimodal sobre `AiProviderRegistry`, migración para `creative_assets` y componente `CreativeStudioView`.
3. **`SPEC-03-03` (HU-3.2: Exploración y Curaduría en Lote - Batching Grid)**
   - *Rama:* `SPEC/jaymusicmachine-EPIC-03-spec03-batching-and-curation-grid`
   - *Entregable:* Repositorio de lotes `sqlite-batch-repository.ts`, orquestador de 4 variantes en paralelo, vinculación a `task_id` y componente `BatchGenerationGrid`.
4. **`SPEC-03-04` (HU-3.3: Generación de Copys y Guiones por Fase de Lanzamiento)**
   - *Rama:* `SPEC/jaymusicmachine-EPIC-03-spec04-social-copy-and-scripts`
   - *Entregable:* Motor de copys por fases ($T-14$ a $T+7$), validación de límites de caracteres y componente `SocialCopyDrawer`.
5. **`SPEC-03-05` (HU-3.4: Maquetación Tipográfica Vectorial 3000px sobre Portadas)**
   - *Rama:* `SPEC/jaymusicmachine-EPIC-03-spec05-typography-cover-stamping`
   - *Entregable:* `typography-compositor.ts`, `canvas-export-renderer.ts`, persistencia de presets tipográficos y `TypographyStampingCanvas`.
6. **`SPEC-03-06` (HU-3.5: Repositorio Central de Activos Aprobados - Asset Vault & Content Hashing)**
   - *Rama:* `SPEC/jaymusicmachine-EPIC-03-spec06-release-asset-vault`
   - *Entregable:* Algoritmo `asset-hasher.ts` SHA-256, galería categorizada por ratio, exportación masiva y preparación del handshake con Postiz.
7. **`SPEC-03-07` (HU-6.1 v3: Tools Creativas para el Asistente Lateral)**
   - *Rama:* `SPEC/jaymusicmachine-EPIC-03-spec07-sidebar-creative-tools`
   - *Entregable:* Catálogo de tools en `creative-tools.ts`, registro en el orquestador con guardrails y componente `CreativeToolBadge`.

---

## 5. Zero Forbidden Patterns Enforcement

1. **Zero `class`**: Todo componente, repositorio o servicio se implementa como función pura o función factory funcional.
2. **Zero In-Memory Mocking de Base de Datos**: Todas las pruebas de repositorio se ejecutan contra SQLite real en memoria (`:memory:`) aplicando las migraciones DDL ordenadas (`001`, `004`, `005`).
3. **Zero Unverified Network I/O en Dominio**: Capa 3 es 100% pura y determinista; toda llamada a IA o sistema de archivos reside exclusivamente en Capa 4.
4. **Zero Path Traversal**: Las rutas de almacenamiento local de activos se sanean y validan contra una raíz controlada de la aplicación.
5. **No `any` implícito ni explícito**: 100% TypeScript estricto.

---

## 6. Gates & Verifications to Pass

- **Gate 1 (Arquitecto)**: Inspección y aprobación de los contratos de tipos en las 4 capas y scaffolding físico inicial con stubs funcionales.
- **Human Gate 1**: Aprobación explícita del usuario tras revisar el andamiaje antes de implementar lógica.
- **TDD RED (Evaluator-Optimizer Loop)**: Diseño de pruebas unitarias exhaustivas con calificación $\ge 9.5/10$ antes de implementar código de producción.
- **GREEN Implementation**: Implementación funcional con comentarios obligatorios hasta que todas las pruebas pasen.
- **Gate 2 (Arquitecto & Clean Code Audit)**: Verificación estricta de aislamiento de capas, in-code commentary y paso limpio de `pnpm validate`.
- **Human Gate 2**: Aprobación final del usuario previa al merge a `develop`.
