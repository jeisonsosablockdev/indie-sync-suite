---
type: RFC
title: STORY-002-01 HU-1.4 Ficha Conceptual del Lanzamiento (Contexto Nivel 3)
description: RFC Story — Especificación de captura de contexto específico de release (narrativa, mood sonoro, temática lírica, ISRC/UPC) con herencia de marca Nivel 1 y 2 y snapshot inmutable.
tags: [rfc, story, release-concept, brand-vault, level3, snapshot]
timestamp: 2026-10-23T17:00:00Z
---

# STORY-002-01: Ficha Conceptual del Lanzamiento (Contexto Nivel 3)

## Metadata
- Epic: `EPIC-002-release-planner-engine`
- Story ID: `STORY-002-01`
- Mapping: `HU-1.4`
- Status: `approved`
- Current status: `approved`
- Owner: `jaymusicmachine`
- RFC owner slice: `epic/jaymusicmachine-EPIC-02-release-planner-engine`
- Created: `2026-10-23`
- Last Updated: `2026-10-23`

---

## Context
### Historia de Usuario Oficial
- **Como** A&R, Label Manager o Artista,
- **Quiero** registrar la narrativa específica, concepto lírico, mood sonoro y metadatos de un lanzamiento individual al crear el proyecto,
- **Para que** las tareas del planificador y los generadores de contenido hereden el contexto específico del track sin perder la identidad general del artista y sello.

### Criterios de Aceptación Oficiales
1. Captura la narrativa del track, mood sonoro, temática lírica, códigos ISRC/UPC, presupuesto de pauta ($USD) y fecha objetivo ($T-0$).
2. Asocia la ficha del lanzamiento al Artista correspondiente heredando automáticamente sus paletas de color, tipografía y arquetipo.
3. Permite congelar un snapshot inmutable del contexto (`snapshot_frozen = 1`) al iniciar la fase de producción de activos para evitar desalineación si el artista cambia su estética general en el futuro.

### Problem & Gap Analysis
Hasta ahora la Bóveda de Marca solo contenía datos a nivel Sello (Nivel 1) y Artista (Nivel 2). No existía modelo ni contrato para capturar la temática concreta de una canción o álbum (Nivel 3). Sin este nivel, los agentes generadores de contenido y los copys de publicación no pueden redactar descripciones precisas de las canciones.

---

## Proposal
La historia se compone de **2 Features funcionales** y **4 SPECs técnicas**:

### 🔹 FEATURE 2.1.1: Esquema de Contexto Nivel 3 & Herencia de Marca
- **`SPEC-2.1.1.1` (Zod Schema e Invariantes de Release Concept)**:
  - *Solución*: Esquema Zod funcional puro `ReleaseConceptSchema` en Capa 3 que valida ISRC regex `^[A-Z]{2}[A-Z0-9]{3}[0-9]{7}$`, UPC regex `^[0-9]{12}$`, `target_date` ISO-8601 UTC a las `00:00:00Z` y presupuesto `>= 0`.
  - *Capa*: `Domain` (`apps/web/src/lib/pipelines/planner/planner-schemas.ts`).
  - *Fase RED (TDD AAA)*:
    - **Arrange**: Payload con ISRC inválido `"INVALID-ISRC"` y fecha en formato no UTC `"2026/12/01"`.
    - **Act**: `ReleaseConceptSchema.safeParse(payload)`.
    - **Assert**: Retorna `success: false` con errores específicos en campos `isrc` y `target_date`.
- **`SPEC-2.1.1.2` (Agregador de Contexto Jerárquico en 3 Niveles)**:
  - *Solución*: Función pura `buildUnifiedBrandContext(label, artist, releaseConcept)` que consolida los 3 niveles resolviendo herencia estética (paleta del artista + mood del track).
  - *Capa*: `Domain` (`apps/web/src/lib/pipelines/planner/release-context-builder.ts`).
  - *Fase RED (TDD AAA)*:
    - **Arrange**: Entidades dummy de Label, Artist y ReleaseConcept.
    - **Act**: Invocar `buildUnifiedBrandContext(label, artist, releaseConcept)`.
    - **Assert**: Objeto resultante contiene `primaryColor` del artista, `labelName` del sello y `trackMood` del release concept.

### 🔹 FEATURE 2.1.2: Congelamiento de Snapshot Inmutable & UI de Gestión
- **`SPEC-2.1.2.1` (Repositorio SQLite de Concepto con Mecanismo de Congelación)**:
  - *Solución*: Factory funcional `createReleaseConceptRepository(db)` en Capa 4 con método `freezeSnapshot(releaseId)`. Guarda snapshot JSON de Nivel 1+2+3 y bloquea ediciones posteriores si `snapshot_frozen = 1`.
  - *Capa*: `Infrastructure` (`apps/web/src/lib/infrastructure/db/repositories/sqlite-release-concept-repository.ts`).
  - *Fase RED (TDD AAA)*:
    - **Arrange**: Insertar concepto en SQLite con `snapshot_frozen = 0`.
    - **Act**: Ejecutar `freezeSnapshot(releaseId)` e intentar actualizar el concepto.
    - **Assert**: Base de datos actualiza `snapshot_frozen = 1` y la mutación subsiguiente arroja error `"Cannot modify frozen release concept"`.
- **`SPEC-2.1.2.2` (Componente UI: ReleaseConceptCard & Editor)**:
  - *Solución*: Componente React accesible `ReleaseConceptCard` con vista de lectura/edición, selector de fecha $T-0$ y botón con confirmación "Congelar Concepto para Producción".
  - *Capa*: `Presentation` (`apps/web/src/components/planner/release-concept-card.tsx`).
  - *Fase RED (TDD AAA)*:
    - **Arrange**: Renderizar `<ReleaseConceptCard concept={mockConcept} isFrozen={true} />`.
    - **Act**: Intentar editar los inputs de texto.
    - **Assert**: Todos los campos están en modo `disabled` y se muestra el badge `"Snapshot Inmutable Activo"`.

---

## Critique
- *¿Por qué no almacenar el snapshot en el sistema de archivos como un archivo JSON estático?*  
  Rompería la consistencia transaccional ACID de SQLite y complicaría las consultas reactivas. Mantenerlo en la columna `snapshot_json` de SQLite garantiza transaccionalidad atómica y cero dependencias de pathing en desktop/web.
- *¿Ponytail:* Evitar crear tablas separadas para cada campo de metadatos; una sola tabla `release_concepts` con campos tipados cubre el 100% de los requerimientos sin uniones relacionales innecesarias.

---

## Resolution
Se aprueba la persistencia en `release_concepts` con columna `snapshot_json` inmutable y validación estricta Zod en Capa 3, asegurando que Dominio permanezca libre de dependencias de I/O.

---

## Decision
Adoptar la arquitectura en 4 capas funcional sin clases, con `createReleaseConceptRepository(db)` en Infraestructura y `ReleaseConceptSchema` en Dominio.

---

## Status
- Status: `approved`
- Current status: `approved`

---

## Traceability
- Epic: [`EPIC-002-release-planner-engine/README.md`](./README.md)
- User Story: `HU-1.4`
- Related PR(s): TBD
- Final commit hash(es): TBD
