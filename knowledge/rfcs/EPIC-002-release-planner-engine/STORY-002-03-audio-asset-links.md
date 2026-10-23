---
type: RFC
title: STORY-002-03 HU-2.4 Registro y Validación de Enlaces a Activos de Audio (Drive / Dropbox / Disco)
description: RFC Story — Registro de enlaces externos de audio con validación HTTP ligera en Infraestructura, blindaje exhaustivo anti-SSRF y completado automático del hito del Máster.
tags: [rfc, story, audio-links, drive, dropbox, disco, ssrf, verification]
timestamp: 2026-10-23T17:00:00Z
---

# STORY-002-03: Registro y Validación de Enlaces a Activos de Audio

## Metadata
- Epic: `EPIC-002-release-planner-engine`
- Story ID: `STORY-002-03`
- Mapping: `HU-2.4`
- Status: `approved`
- Current status: `approved`
- Owner: `jaymusicmachine`
- RFC owner slice: `epic/jaymusicmachine-EPIC-02-release-planner-engine`
- Created: `2026-10-23`
- Last Updated: `2026-10-23`

---

## Context
### Historia de Usuario Oficial
- **Como** A&R o Productor musical,
- **Quiero** vincular los enlaces externos a los archivos máster y stems (Google Drive, Dropbox, Box, Disco.ac, WeTransfer o enlaces privados de SoundCloud/Audius),
- **Para que** todo el equipo tenga acceso al audio final sin saturar la plataforma con subidas pesadas de archivos WAV.

### Criterios de Aceptación Oficiales
1. Permite registrar URLs externas categorizadas (`MASTER_WAV`, `INSTRUMENTAL`, `STEMS`, `ACAPELLA`) con restricción de unicidad de un solo enlace activo por categoría por lanzamiento.
2. Valida que el formato del enlace sea accesible y válido mediante verificación HTTP ligera (`HEAD` o `GET` con `Range: bytes=0-1024`) con timeout estricto de 3500ms y **blindaje total anti-SSRF**:
   - Bloqueo de rangos IPv4 privados y loopback: `10.0.0.0/8`, `172.16.0.0/12` (RFC 1918 completo), `192.168.0.0/16`, `127.0.0.0/8`, `169.254.0.0/16` (metadata de nube/link-local), `0.0.0.0/8`.
   - Bloqueo de IPv6: Loopback `::1`, Unique Local `fc00::/7`, Link-Local `fe80::/10`, IPv4-mapped `::ffff:0:0/96`.
   - Bloqueo de bypass por redirecciones: Uso forzado de `redirect: 'manual'`. Si la respuesta es HTTP 301/302/307, se valida de forma independiente la IP de destino de la cabecera `Location` antes de seguir el salto (máximo 3 redirecciones).
3. Marca automáticamente el hito crítico de "Entrega del Máster" como completado (`status = DONE`) en la tabla de tareas al registrar y verificar exitosamente la URL del `MASTER_WAV`.

---

## Proposal
La historia se compone de **2 Features funcionales** y **4 SPECs técnicas**:

### 🔹 FEATURE 2.3.1: Cliente HTTP Ligero en Infraestructura con Blindaje Anti-SSRF
- **`SPEC-2.3.1.1` (Cliente HTTP de Verificación con Guardrail Anti-SSRF en Capa 4)**:
  - *Solución*: Factory funcional `createAudioLinkClient()` ubicada estrictamente en **Capa 4 (Infraestructura)** (`apps/web/src/lib/infrastructure/http/audio-link-client.ts`). Realiza resolución DNS previa con `dns.promises.lookup`, compara la IP contra la lista de rangos prohibidos (IPv4 RFC 1918, IPv6, loopback, link-local), ejecuta `fetch` con `redirect: 'manual'` y timeout de 3500ms vía `AbortController`. Si hay redirección 3xx, re-valida la IP del target.
  - *Capa*: `Infrastructure` (`apps/web/src/lib/infrastructure/http/audio-link-client.ts`).
  - *Fase RED (TDD AAA)*:
    - **Arrange**: URLs de prueba maliciosas: `"http://169.254.169.254/latest/meta-data/"`, `"http://172.17.0.1:8080/secret"`, `"http://[::1]:3000"`, y URL que redirige a `localhost`.
    - **Act**: Invocación de `verifyAudioLink(url)`.
    - **Assert**: Todas las llamadas son rechazadas con error de seguridad `SSRF_BLOCKED` sin ejecutar solicitudes salientes indebidas.
- **`SPEC-2.3.1.2` (Esquemas Zod e Invariantes de Dominio de Enlace de Audio)**:
  - *Solución*: Esquemas Zod funcionales puros en Capa de Dominio `ExternalAudioLinkSchema` que validan sintaxis URL HTTPS (o HTTP solo en dev), categorías permitidas (`MASTER_WAV`, `INSTRUMENTAL`, `STEMS`, `ACAPELLA`) y estado de verificación (`UNVERIFIED`, `VERIFIED`, `ERROR`).
  - *Capa*: `Domain` (`apps/web/src/lib/pipelines/planner/audio-link-schemas.ts`).
  - *Fase RED (TDD AAA)*:
    - **Arrange**: Payload con URL malformada `"ftp://disco.ac/wav"` o categoría inválida `"VOCAL_STEMS"`.
    - **Act**: `ExternalAudioLinkSchema.safeParse(payload)`.
    - **Assert**: Falla con error de validación descriptivo.

### 🔹 FEATURE 2.3.2: Persistencia en SQLite, Hook de Auto-Completado & UI
- **`SPEC-2.3.2.1` (Repositorio SQLite de Enlaces con Auto-Completado Transaccional)**:
  - *Solución*: Factory funcional `createAudioLinkRepository(db)` en Capa 4. Operación `saveAudioLinkAndCompleteMilestone(params)` en `db.transaction()`: inserta/actualiza en `external_audio_links` respetando el índice único `uq_external_audio_release_cat`, y si es `category === 'MASTER_WAV'`, actualiza a `status = 'DONE'` la tarea que posea `is_gatekeeper = 1` y título que contenga "Entrega del Máster".
  - *Capa*: `Infrastructure` (`apps/web/src/lib/infrastructure/db/repositories/sqlite-audio-link-repository.ts`).
  - *Fase RED (TDD AAA)*:
    - **Arrange**: Base SQLite con tarea de entrega de máster en estado `'TODO'`.
    - **Act**: Guardar enlace `MASTER_WAV` verificado.
    - **Assert**: El enlace se persiste en la BD y la tarea de máster pasa atómicamente a `status = 'DONE'`.
- **`SPEC-2.3.2.2` (Componente UI: AudioLinksManager con Verificador en Vivo)**:
  - *Solución*: Componente accesible `AudioLinksManager` con botones de copiado, comprobación en tiempo real y badges de verificación.
  - *Capa*: `Presentation` (`apps/web/src/components/planner/audio-links-manager.tsx`).
  - *Fase RED (TDD AAA)*:
    - **Arrange**: Renderizar `<AudioLinksManager releaseId="123" />`.
    - **Act**: Ingresar URL y pulsar botón "Verificar Enlace".
    - **Assert**: Muestra spinner de comprobación y renderiza badge verde "Verificado" al recibir respuesta exitosa.

---

## Critique
- *¿Por qué no alojar los archivos de audio en almacenamiento S3/R2 localmente?*  
  Ponytail: Un archivo WAV pesa 70MB. Subir audio a la app de escritorio ralentiza la UI, requiere infraestructura de subida multipart y satura la conexión. Los A&R ya usan Google Drive, Dropbox y Disco.ac; enlazar y verificar por HTTP es la solución más limpia y ligera posible.
- *Riesgo arquitectónico atendido:* La llamada de red no reside en Dominio; fue trasladada a Capa 4 (Infraestructura), preservando la pureza de la Capa de Dominio.

---

## Resolution
Se aprueba la ubicación del cliente de red en `lib/infrastructure/http/audio-link-client.ts`, el blindaje anti-SSRF completo (IPv4 RFC 1918, IPv6, `redirect: manual`) y la restricción `UNIQUE (release_id, category)` en SQLite.

---

## Decision
Mover la verificación I/O a Infraestructura, prohibir `class` usando factory functions funcionales y asegurar auto-completado en `db.transaction()`.

---

## Status
- Status: `approved`
- Current status: `approved`

---

## Traceability
- Epic: [`EPIC-002-release-planner-engine/README.md`](./README.md)
- User Story: `HU-2.4`
- Related PR(s): TBD
- Final commit hash(es): TBD
