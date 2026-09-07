---
type: RFC
title: STORY-001-01 HU-1.1 Configuración de la Bóveda del Sello y Artista (Brand Vault)
description: RFC Story — Entidades de marca, validación Zod, persistencia relacional local y consola UI accesible
tags: [rfc, story, brand-vault, domain, frontend, ui, governance]
timestamp: 2026-09-07T00:00:00Z
---

# STORY-001-01-hu-1-1-brand-vault-setup

## Metadata
- Epic: `EPIC-001-shell-brand-vault-sqlite-orchestrator`
- Story ID: `STORY-001-01`
- Mapping: `HU-1.1`
- Status: `approved`
- Owner: `jaymusicmachine`
- RFC owner slice: `SPEC/jaymusicmachine-EPIC-01-spec01-brand-vault-setup`
- Created: `2026-09-07`
- Last Updated: `2026-09-07`

## Context
### Historia de Usuario Oficial
- **Como** Label Manager o Artista,
- **Quiero** registrar perfiles detallados con bio, valores, paleta de colores, tipografías y enlaces a redes/DSPs,
- **Para que** toda la generación futura de contenidos mantenga consistencia visual y tonal sin configurarla desde cero cada vez.

### Criterios de Aceptación Oficiales
1. Permite crear entidades Label y anidar entidades Artist en la base de datos local.
2. Almacena valores hexadecimales de color, enlaces tipográficos y muestras de estilo.
3. Valida que los campos esenciales de tono y estética queden guardados en el perfil.

### Problem & Gap Analysis
Sin una bóveda estructurada de marca, los modelos generativos de imagen (Flux, Midjourney) y de texto (Claude, GPT) alucinan estilos incongruentes en cada release. Esta historia establece el estándar único de verdad de marca.

---

## Proposal
La historia se compone de **2 Features funcionales** y **4 SPECs técnicas**:

### 🔹 FEATURE 1.1: Modelado de Dominio y Validación Zod de Identidad
*Estructuración de datos y reglas de integridad para las entidades Label y Artist.*
- **`SPEC-1.1.1` (Esquemas Zod Estrictos de Brand Vault)**:
  - *Problema*: Inyección de códigos de color inválidos o URLs rotas que dañan la maquetación.
  - *Solución*: Esquemas Zod inmutables para `LabelProfile` y `ArtistProfile` con validación regex para hex codes (`^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$`), links DSPs y tono de voz.
  - *Capa*: `Domain` (`apps/web/src/domain/brand-vault/brand-schemas.ts`).
  - *Tests RED*: `tests/domain/brand-vault/brand-schemas.test.ts`.
- **`SPEC-1.1.2` (Repositorio Relacional de Sello y Artista)**:
  - *Problema*: Mapeo de estructuras JSON complejas (paletas, tipografías) en tablas relacionales SQLite.
  - *Solución*: Repositorios `SqliteLabelRepository` y `SqliteArtistRepository` con transformadores `Entity <-> DBRow`.
  - *Capa*: `Infrastructure` (`apps/web/src/infrastructure/db/repositories/sqlite-artist-repository.ts`).
  - *Tests RED*: `tests/infrastructure/db/artist-repository.test.ts`.

### 🔹 FEATURE 1.2: Consola UI y Selector de Color Hexadecimal Nativo WCAG AA
*Interfaz interactiva para configurar la identidad sin fricción ni librerías pesadas.*
- **`SPEC-1.2.1` (Selector de Color Nativo HTML5 & Validador de Contraste)**:
  - *Problema*: Las librerías de color picker de terceros inflan el bundle con dependencias superfluas.
  - *Solución*: Componente usando `<input type="color">` nativo sincronizado bidireccionalmente con input de texto hex y cálculo de ratio de contraste WCAG AA.
  - *Capa*: `Presentation` (`apps/web/src/presentation/components/brand-vault/color-palette-picker.tsx`).
  - *Tests RED*: `tests/presentation/components/color-palette-picker.test.tsx`.
- **`SPEC-1.2.2` (Editor de Perfil de Artista y Tarjetas de Visualización)**:
  - *Problema*: Formularios extensos que aumentan la tasa de abandono en onboarding.
  - *Solución*: Editor modular con pestañas de Identidad, Estética, Tono y Enlaces con retroalimentación en tiempo real.
  - *Capa*: `Presentation` (`apps/web/src/presentation/components/brand-vault/artist-editor-form.tsx`).
  - *Tests RED*: `tests/presentation/components/artist-editor.test.tsx`.

---

## Critique
- Reviewer(s): `architect`, `frontend`, `ponytail`
- Critical findings:
  1. Si un usuario introduce menos de 3 colores, el sistema debe autocompletar con colores neutros (blanco/negro) sin bloquear la creación.
  2. `Ponytail Evaluation`: Usar `<input type="color">` nativo ahorra ~120KB al descartar `react-color`. Cero librerías de componentes innecesarias.

## Resolution
- Final approach after critique: Esquemas Zod con fallbacks inteligentes para campos estéticos secundarios.

## Decision
- Decision: `approved`
- Decision date: `2026-09-07`
- Decision owner: `jaymusicmachine`

## Status
- Current status: `approved`
- Next action: Diseñar tests RED de validación Zod en `tests/domain/brand-vault/brand-schemas.test.ts`.

## Traceability
- Related issue(s): `EPIC-01`, `HU-1.1`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
