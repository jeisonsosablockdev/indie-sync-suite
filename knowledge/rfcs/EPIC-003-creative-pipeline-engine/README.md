# RFC EPIC-003: Pipeline Creativo Multimedia & Repositorio Central de Activos

## Estado y Metadatos
- **ID:** `EPIC-003`
- **Iniciativa:** Pipeline Creativo Multimedia & Repositorio Central de Activos (Basado en Open Generative AI)
- **Estado:** `APPROVED`
- **Owner:** `jaymusicmachine`
- **Branch Padre:** `epic/jaymusicmachine-EPIC-03-creative-pipeline-engine`
- **Fecha de Creación:** 2026-10-24
- **Arquitectura:** 4 Capas Funcionales (Presentación, Aplicación, Dominio Puro, Infraestructura)
- **Base Open-Source:** Adaptación desacoplada y local-first del repositorio `anil-matcha/open-generative-ai`

---

## 1. Contexto y Justificación

La producción de activos gráficos y textuales para una campaña musical independiente exige una sincronización perfecta entre la identidad visual del artista, el concepto lírico del lanzamiento y los requisitos técnicos de las plataformas de distribución y redes sociales.

En la actualidad, los artistas y sellos independientes sufren de:
1. **Alucinación de Estilo:** Los generadores de imagen convencionales producen estéticas que contradicen el Brand Vault si no se inyecta un contexto estructurado determinista.
2. **Dependencia de Costes de API Directos:** No todos los creadores cuentan con saldo en OpenAI o Stability; muchos usan interfaces web de Midjourney, Runway o herramientas locales. Obligar a renderizar en la app bloquea a estos usuarios si no se provee un modo *Prompt-Only*.
3. **Rechazos por Tipografía Deforme:** Los modelos generativos arruinan los textos. Las distribuidoras exigen portadas 1:1 a 3000×3000 px con nombres legibles y sin artefactos.
4. **Descoordinación Temporal de Copys:** Los textos para redes se redactan al azar sin alinearse a las fases del cronograma ($T-14$ a $T+7$).

Este RFC define el diseño e implementación del motor multimedia de Indie Sync Suite, integrando el modo **Prompt Studio (Text-Only)** como requerimiento obligatorio de primer nivel.

---

## 2. Catálogo de Historias de Usuario

| ID | Título | Alcance Principal | Archivo RFC |
| :--- | :--- | :--- | :--- |
| **HU-3.1** | Generación de Assets Anclados a la Marca | Ratios estándar (1:1 a 3000px, 9:16, 16:9) con inyección de Brand Vault y Contexto Nivel 3. | [`STORY-003-01`](./STORY-003-01-brand-anchored-asset-generation.md) |
| **HU-3.2** | Exploración y Curaduría en Lote | Cuadrícula con 4 variantes simultáneas, triage rápido y enlace a tareas del planificador. | [`STORY-003-02`](./STORY-003-02-batching-and-curation-grid.md) |
| **HU-3.3** | Generación de Copys y Guiones Promocionales | Textos para redes por fase de campaña, conteo de caracteres y sugerencia de hashtags. | [`STORY-003-03`](./STORY-003-03-social-copy-and-scripts.md) |
| **HU-3.4** | Maquetación Tipográfica Vectorial 3000px | Composición vectorial de título y artista sobre la portada con fuentes oficiales sin fallos de IA. | [`STORY-003-04`](./STORY-003-04-typography-cover-stamping.md) |
| **HU-3.5** | Repositorio Central de Activos Aprobados | Galería categorizada por formato con hash inmutable SHA-256 para handshake con Postiz. | [`STORY-003-05`](./STORY-003-05-release-asset-vault.md) |
| **HU-3.6** | Estudio y Gestión de Prompts Editables (Prompt Studio) | Generación, inspección, edición manual, actualización en SQLite y copiado 1-clic a Midjourney/Flux. | [`STORY-003-06`](./STORY-003-06-prompt-studio-text-only.md) |
| **HU-6.1 v3**| Tools Creativas para el Asistente Lateral | Invocación conversacional de generación de portadas, copys y copia de prompts con guardrails. | [`STORY-003-07`](./STORY-003-07-sidebar-creative-tools.md) |

---

## 3. Modelo de Datos Relacional (Migración `005_creative_pipeline.sql`)

```sql
-- Prompts Maestros Editables y Versionados
CREATE TABLE creative_prompts (
  id TEXT PRIMARY KEY,
  release_id TEXT NOT NULL REFERENCES release_concepts(id) ON DELETE CASCADE,
  target_format TEXT NOT NULL CHECK (target_format IN ('COVER_1_1', 'CANVAS_9_16', 'BANNER_16_9', 'SOCIAL_COPY')),
  platform_preset TEXT NOT NULL CHECK (platform_preset IN ('MIDJOURNEY_V6', 'FLUX_SD', 'RUNWAY_KLING', 'RAW_TEXT')),
  prompt_text TEXT NOT NULL,
  negative_prompt TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  is_favorite INTEGER NOT NULL DEFAULT 0 CHECK (is_favorite IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Lotes de Variantes Generadas
CREATE TABLE generation_batches (
  id TEXT PRIMARY KEY,
  release_id TEXT NOT NULL REFERENCES release_concepts(id) ON DELETE CASCADE,
  prompt_id TEXT NOT NULL REFERENCES creative_prompts(id) ON DELETE CASCADE,
  target_format TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'GENERATING', 'COMPLETED', 'FAILED')),
  variant_count INTEGER NOT NULL DEFAULT 4,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Repositorio Central de Activos Creativos Aprobados
CREATE TABLE creative_assets (
  id TEXT PRIMARY KEY,
  release_id TEXT NOT NULL REFERENCES release_concepts(id) ON DELETE CASCADE,
  batch_id TEXT REFERENCES generation_batches(id) ON DELETE SET NULL,
  deliverable_id TEXT REFERENCES task_deliverables(id) ON DELETE SET NULL,
  prompt_id TEXT REFERENCES creative_prompts(id) ON DELETE SET NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('IMAGE', 'VIDEO', 'TEXT')),
  target_format TEXT NOT NULL CHECK (target_format IN ('COVER_1_1', 'CANVAS_9_16', 'BANNER_16_9', 'SOCIAL_COPY')),
  content_hash TEXT NOT NULL,
  file_path TEXT,
  text_content TEXT,
  dimensions_width INTEGER,
  dimensions_height INTEGER,
  mime_type TEXT NOT NULL,
  curation_status TEXT NOT NULL CHECK (curation_status IN ('PROPOSED', 'APPROVED', 'DISCARDED')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Presets de Maquetación Tipográfica Vectorial
CREATE TABLE typography_presets (
  id TEXT PRIMARY KEY,
  artist_id TEXT NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  title_font_family TEXT NOT NULL,
  title_font_size INTEGER NOT NULL,
  title_color TEXT NOT NULL,
  artist_font_family TEXT NOT NULL,
  artist_font_size INTEGER NOT NULL,
  artist_color TEXT NOT NULL,
  alignment TEXT NOT NULL CHECK (alignment IN ('TOP', 'CENTER', 'BOTTOM')),
  shadow_enabled INTEGER NOT NULL DEFAULT 1 CHECK (shadow_enabled IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_creative_prompts_release ON creative_prompts(release_id);
CREATE INDEX idx_creative_assets_release ON creative_assets(release_id);
CREATE INDEX idx_creative_assets_hash ON creative_assets(content_hash);
CREATE INDEX idx_generation_batches_release ON generation_batches(release_id);
```

---

## 4. Invariantes de Seguridad y Calidad

1. **Aislamiento de Capas:** Capa 3 no efectúa I/O ni llamadas a red; opera de forma puramente determinista sobre entradas tipadas.
2. **Protección Path Traversal:** Toda persistencia física de archivos de imagen en Capa 4 verifica que la ruta resuelta resida estrictamente dentro de `$APP_DATA/assets/`.
3. **Idempotencia Criptográfica:** Todo activo registrado calcula su hash SHA-256 (`content_hash`) para evitar escrituras redundantes y garantizar sincronización fiable con Postiz en la Épica 4.
4. **Cero Clases:** Toda la arquitectura se construye sobre funciones puras y factory functions funcionales.
