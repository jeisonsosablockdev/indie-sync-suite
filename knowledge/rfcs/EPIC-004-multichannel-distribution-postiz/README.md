# RFC EPIC-004: Distribución Multicanal & Pauta Programática (Headless Postiz Cloud)

## Estado y Metadatos
- **ID:** `EPIC-004`
- **Iniciativa:** Distribución Multicanal & Pauta Programática (Integración Headless Postiz Cloud)
- **Estado:** `APPROVED`
- **Owner:** `jaymusicmachine`
- **Branch Padre:** `epic/jaymusicmachine-EPIC-04-multichannel-distribution-postiz`
- **Fecha de Creación:** 2026-10-24
- **Arquitectura:** 4 Capas Funcionales (Presentación, Aplicación, Dominio Puro, Infraestructura)
- **Base Headless:** Integración desacoplada con Postiz Cloud API + Protocolo Media Handshake S3/R2

---

## 1. Contexto y Justificación

La etapa culminante del ciclo de lanzamiento musical exige colocar los contenidos visuales y textos promocionales aprobados (Épica 3) en las redes sociales y canales de difusión adecuados, exactamente sincronizados con las fases del cronograma estratégico (Épica 2).

En la actualidad, los artistas independientes enfrentan:
1. **Pérdida de Tiempo en Publicación Manual:** Saltar entre Instagram, TikTok, YouTube, X y Facebook consumiendo horas valiosas en tareas mecánicas.
2. **Descoordinación de Fechas:** Si la fecha del estreno cambia, las publicaciones agendadas quedan desfasadas respecto al nuevo $T-0$.
3. **Complejidad de Ads:** Pautar $20 a $100 USD en Meta Ads o TikTok Ads exige manejar interfaces complejas pensadas para agencias.
4. **Falta de Resiliencia Offline:** Sin una cola Outbox transaccional, cualquier pérdida momentánea de conexión aborta la programación.

Este RFC establece la arquitectura técnica del motor de distribución multicanal de Indie Sync Suite.

---

## 2. Catálogo de Historias de Usuario

| ID | Título | Alcance Principal | Archivo RFC |
| :--- | :--- | :--- | :--- |
| **HU-4.3** | Conexión y Gestión de Cuentas (OAuth Hub) | Autenticación y health check de perfiles sociales (IG, TT, FB, YT, X) y cuentas de ads. | [`STORY-004-03`](./STORY-004-03-oauth-hub-connections.md) |
| **HU-4.1** | Programación Multicanal & Media Handshake | Pre-Signed URLs para activos SHA-256, agenda multicanal y cola `cloud_sync_queue`. | [`STORY-004-01`](./STORY-004-01-multichannel-scheduling-handshake.md) |
| **HU-4.4** | Calendario Visual de Contenidos Sincronizado | Vista mensual/semanal drag-and-drop con el hito $T-0$ (Release Day) como eje rector. | [`STORY-004-04`](./STORY-004-04-visual-content-calendar.md) |
| **HU-4.2** | Microcampañas de Pauta ($20–$100 USD) | Wizard de pauta 1-clic hacia Meta/TikTok Ads con credenciales BYOK. | [`STORY-004-02`](./STORY-004-02-micro-campaigns-ads.md) |
| **HU-4.5** | Cola de Reintentos y Alertas de Fallos | 3 reintentos exponenciales automáticos, dead-letter storage y alertas visuales. | [`STORY-004-05`](./STORY-004-05-retry-queue-error-alerts.md) |
| **HU-6.1 v4**| Tools de Distribución para el Asistente | Invocación en lenguaje natural de programación y activación de pautas con Guardrails. | [`STORY-004-06`](./STORY-004-06-sidebar-distribution-tools.md) |

---

## 3. Modelo de Datos Relacional (`006_distribution_postiz.sql`)

```sql
-- Cuentas Sociales Conectadas (OAuth Hub)
CREATE TABLE social_connections (
  id TEXT PRIMARY KEY,
  label_id TEXT NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('INSTAGRAM', 'TIKTOK', 'TWITTER_X', 'YOUTUBE', 'FACEBOOK', 'META_ADS', 'TIKTOK_ADS')),
  account_name TEXT NOT NULL,
  account_id TEXT NOT NULL,
  health_status TEXT NOT NULL CHECK (health_status IN ('CONNECTED', 'EXPIRED', 'DISCONNECTED')),
  access_token_encrypted TEXT,
  token_expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Publicaciones Programadas
CREATE TABLE scheduled_posts (
  id TEXT PRIMARY KEY,
  release_id TEXT NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
  asset_id TEXT REFERENCES creative_assets(id) ON DELETE SET NULL,
  platform TEXT NOT NULL,
  post_text TEXT NOT NULL,
  scheduled_time TEXT NOT NULL,
  media_url TEXT,
  media_hash TEXT,
  postiz_post_id TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'QUEUED', 'PUBLISHED', 'FAILED')),
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Microcampañas Publicitarias
CREATE TABLE ad_campaigns (
  id TEXT PRIMARY KEY,
  release_id TEXT NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('META_ADS', 'TIKTOK_ADS')),
  budget_usd REAL NOT NULL CHECK (budget_usd >= 20.0 AND budget_usd <= 100.0),
  destination_url TEXT NOT NULL,
  target_audience TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'COMPLETED', 'FAILED')),
  external_campaign_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_social_connections_label ON social_connections(label_id);
CREATE INDEX idx_scheduled_posts_release ON scheduled_posts(release_id);
CREATE INDEX idx_scheduled_posts_time ON scheduled_posts(scheduled_time, status);
CREATE INDEX idx_ad_campaigns_release ON ad_campaigns(release_id);
```

---

## 4. Invariantes de Seguridad y Calidad

1. **Protección Anti-SSRF en Media Handshake:** Toda URL generada para descarga/subida de activos valida que los destinos no apunten a direcciones privadas, loopback o metadatos de nube.
2. **Tokens OAuth Seguros:** Los access tokens de redes sociales se resguardan cifrados utilizando el almacén seguro de claves (`CredentialService`).
3. **Idempotencia de Cola:** Cada publicación en `cloud_sync_queue` cuenta con un identificador unívoco para evitar publicaciones duplicadas ante reintentos de red.
4. **Cero Clases:** Toda la arquitectura se construye sobre funciones puras y factory functions funcionales.
