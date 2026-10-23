---
type: RFC
title: STORY-001-03 HU-1.1 Bóveda de Identidad Visual y Conceptual (Brand Vault CRUD)
description: RFC Story — Entidades de marca, validación estricta Zod, persistencia relacional SQLite y consola UI accesible con color picker nativo HTML5
tags: [rfc, story, brand-vault, domain, frontend, ui, zod, governance]
timestamp: 2026-09-07T00:00:00Z
---

# STORY-001-03-brand-vault-crud

## Metadata
- Epic: `EPIC-001-shell-brand-vault-sqlite-orchestrator`
- Story ID: `STORY-001-03`
- Mapping: `HU-1.1`
- Status: `approved`
- Owner: `jaymusicmachine`
- RFC owner slice: `epic/jaymusicmachine-EPIC-01-shell-brand-vault-sqlite-orchestrator`
- Created: `2026-09-07`
- Last Updated: `2026-09-07`

## Context
### Historia de Usuario Oficial
- **Como** Label Manager o Artista musical independiente,
- **Quiero** registrar y administrar perfiles detallados con bio, paleta de colores hexadecimales, tipografías, tono de voz y enlaces a redes y plataformas de streaming (Spotify, Apple Music, Instagram, YouTube),
- **Para que** toda la generación futura de campañas (Épica 2) y contenidos multimedia (Épica 3) mantenga coherencia visual y tonal sin tener que reconfigurar los parámetros estéticos en cada ocasión.

### Criterios de Aceptación Oficiales
1. Permite crear, leer, actualizar y eliminar entidades Label y anidar perfiles de Artist en la base de datos local SQLite con integridad referencial.
2. Valida mediante esquemas Zod estrictos que los colores sean códigos hexadecimales válidos (`#RGB` o `#RRGGBB`), que las tipografías contengan pesos numéricos válidos y que los links a DSPs cumplan formato URL.
3. Provee un componente interactivo de selección de paleta cromática (hasta 6 colores) utilizando el `<input type="color">` nativo del navegador con cálculo en vivo de ratio de contraste WCAG AA.
4. Implementa formularios modulares y tarjetas de previsualización con accesibilidad por teclado y feedback visual instantáneo.

### Problem & Gap Analysis
Sin una bóveda estructurada e inmutable de parámetros de marca, los modelos generativos de imagen (Flux, Midjourney) y de texto (Claude, Gemini, GPT) alucinan estilos inconexos en cada lanzamiento. Esta historia establece la única fuente de verdad (*single source of truth*) estética para sellos y artistas.

---

## Proposal
La historia se compone de **2 Features funcionales** y **4 SPECs técnicas**:

### 🔹 FEATURE 3.1: Modelado de Dominio y Validación Zod de Identidad
*Definición rigurosa de los contratos de marca que alimentan a los generadores creativos posteriores.*
- **`SPEC-3.1.1` (Esquemas Zod Estrictos de Brand Vault)**:
  - *Problema*: Inyección de valores de color mal formados o URLs rotas que romperían los prompts de imagen y maquetadores de landings.
  - *Solución*: Esquemas Zod inmutables para `LabelProfile` y `ArtistProfile` con validación regex para hex codes (`^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$`), URLs de DSPs (Spotify, Apple Music, Instagram, YouTube, web) y límites de caracteres en bio y tono de voz.
  - *Capa*: `Domain` (`apps/web/src/domain/brand-vault/brand-schemas.ts`, `apps/web/src/domain/brand-vault/brand-types.ts`).
  - *Tests RED*: `tests/domain/brand-vault/brand-schemas.test.ts` (rechazo de colores inválidos, sanitización de strings y valores por defecto).
- **`SPEC-3.1.2` (Repositorio Relacional de Sello y Artista)**:
  - *Problema*: Necesidad de mapear estructuras de datos JSON anidadas (paletas, tipografías, redes) a columnas relacionales de SQLite sin pérdida de fidelidad de tipos.
  - *Solución*: `SqliteLabelRepository` y `SqliteArtistRepository` con transformadores bidireccionales transparentes `Entity <-> DBRow`.
  - *Capa*: `Infrastructure` (`apps/web/src/infrastructure/db/repositories/sqlite-label-repository.ts`, `apps/web/src/infrastructure/db/repositories/sqlite-artist-repository.ts`).
  - *Tests RED*: `tests/infrastructure/db/artist-repository.test.ts` (operaciones CRUD completas y verificación de integridad relacional).

### 🔹 FEATURE 3.2: Consola de Edición y Visualización de Marca
*Interfaz de usuario intuitiva para configurar la identidad del proyecto musical sin fricción.*
- **`SPEC-3.2.1` (Selector de Color Nativo & Validador de Contraste)**:
  - *Problema*: Librerías de color picker de terceros agregan peso excesivo al bundle (>120KB) y presentan problemas de accesibilidad y foco.
  - *Solución*: Componente `ColorPalettePicker` usando `<input type="color">` nativo del navegador sincronizado bidireccionalmente con input de texto hex y cálculo de ratio de contraste WCAG AA relativo sobre fondo claro y oscuro.
  - *Capa*: `Presentation` (`apps/web/src/components/brand-vault/color-palette-picker.tsx`).
  - *Tests RED*: `tests/components/color-palette-picker.test.tsx` (sincronización de inputs, adición/remoción de muestras).
- **`SPEC-3.2.2` (Editor de Perfil de Artista y Tarjetas de Visualización)**:
  - *Problema*: Formularios desorganizados que confunden a creadores y aumentan la tasa de abandono.
  - *Solución*: Vistas `ArtistEditorForm` y `ArtistProfileCard` con pestañas semánticas (Identidad General, Estética Visual, Tono y DSPs), feedback visual instantáneo y soporte completo de navegación por teclado.
  - *Capa*: `Presentation` / `Application` (`apps/web/src/components/brand-vault/artist-editor-form.tsx`, `apps/web/src/components/brand-vault/artist-profile-card.tsx`, `apps/web/src/application/brand-vault/use-brand-vault.ts`).
  - *Tests RED*: `tests/components/artist-editor.test.tsx` (envío de formulario, validación de errores en línea).

### Esquemas de Validación Zod
```typescript
import { z } from 'zod';

export const HexColorSchema = z.string().regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, {
  message: 'Color hexadecimal inválido (ej. #1A1A1A o #FFF)'
});

export const TypographySchema = z.object({
  primary: z.string().min(1, 'Fuente primaria requerida'),
  secondary: z.string().optional(),
  weights: z.array(z.number()).default([400, 700])
});

export const SocialLinksSchema = z.object({
  spotify: z.string().url().optional().or(z.literal('')),
  appleMusic: z.string().url().optional().or(z.literal('')),
  instagram: z.string().url().optional().or(z.literal('')),
  youtube: z.string().url().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal(''))
});

export const ArtistProfileSchema = z.object({
  id: z.string().uuid(),
  labelId: z.string().uuid(),
  name: z.string().min(1, 'El nombre del artista es obligatorio'),
  bio: z.string().max(2000).default(''),
  genre: z.string().min(1, 'Género principal requerido'),
  subgenres: z.array(z.string()).default([]),
  colorPalette: z.array(HexColorSchema).max(6, 'Máximo 6 colores en la paleta'),
  typography: TypographySchema,
  toneOfVoice: z.string().max(1000).default(''),
  socialLinks: SocialLinksSchema
});
```

---

## Critique
- **Reviewer(s)**: `architect`, `frontend`, `ponytail`
- **Critical findings**:
  1. *Paletas Incompletas*: Si el usuario define solo 1 o 2 colores primarios, los generadores de arte de disco necesitan colores complementarios. El dominio debe admitir paletas de 1 a 6 colores con fallbacks neutros automáticos.
  2. *Ponytail Lean Evaluation*:
     - Se utiliza `<input type="color">` HTML5 estándar. Se descarta `react-color` o `vanilla-picker`, ahorrando ~120KB en el bundle de cliente.
     - Se reutiliza Zod ya presente en el proyecto para validar contratos tanto en cliente como en servidor/base de datos.
     - Se descarta crear tablas relacionales independientes para cada muestra de color; se serializan como un array JSON en la columna `color_palette` de SQLite.

## Resolution
- Final approach after critique: Esquemas Zod con normalización de mayúsculas/minúsculas en hex codes y almacenamiento de paletas/redes en columnas JSON de SQLite.

## Decision
- Decision: `approved`
- Decision date: `2026-09-07`
- Decision owner: `jaymusicmachine`

## Status
- Current status: `approved`
- Next action: Diseñar tests RED de esquemas Zod en `tests/domain/brand-vault/brand-schemas.test.ts`.
- Exit criteria: Validación Zod de artistas y sellos 100% verde, CRUD relacional SQLite operativo.

## Test and Validation Plan
- Unit tests: `tests/domain/brand-vault/brand-schemas.test.ts`, `tests/infrastructure/db/artist-repository.test.ts`.
- Integration tests: `tests/components/color-palette-picker.test.tsx`, `tests/components/artist-editor.test.tsx`.

## Traceability
- Related issue(s): `EPIC-01`, `HU-1.1`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
