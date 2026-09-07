---
type: RFC
title: STORY-001-03 Entidades de Dominio y UI CRUD del Brand Vault
description: RFC Story — Modelado de marca para Sello y Artista, esquemas Zod de validación y consola interactiva de gestión
tags: [rfc, story, brand-vault, domain, frontend, ui, governance]
timestamp: 2026-09-07T00:00:00Z
---

# STORY-001-03-brand-vault-crud

## Metadata
- Epic: `EPIC-001-shell-brand-vault-sqlite-orchestrator`
- Story ID: `STORY-001-03-brand-vault-crud`
- Mapping: `HU-1.1`
- Status: `draft`
- Owner: `jaymusicmachine`
- RFC owner slice: `SPEC/jaymusicmachine-EPIC-01-spec03-brand-vault-entities-crud-ui`
- Created: `2026-09-07`
- Last Updated: `2026-09-07`

## Context
- Problem: Para que el sistema genere activos multimedia, copys y calendarios coherentes con la identidad del proyecto musical, debe existir un repositorio centralizado de marca (Brand Vault) para el Sello y cada Artista anidado. Los creadores necesitan una consola ágil para registrar colores hex oficiales, tipografías, muestras de estilo, biografías y directrices de tono de voz sin tener que reintroducirlos en cada generación.
- Why now: Las herramientas creativas de la Épica 3 y la planificación de la Épica 2 inyectan obligatoriamente estos lineamientos en los prompts del sistema y en la maquetación visual.
- Constraints:
  - Validación estricta con esquemas Zod en la capa Domain.
  - Colores hex deben cumplir formato regex `^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$`.
  - Formularios accesibles (WAI-ARIA, contraste WCAG AA, soporte para navegación por teclado).
  - Integración reactiva con el repositorio SQLite local de la STORY-001-01.
- Affected paths:
  - `apps/web/src/domain/brand-vault/brand-schemas.ts`
  - `apps/web/src/domain/brand-vault/brand-profile.ts`
  - `apps/web/src/application/brand-vault/use-brand-vault.ts`
  - `apps/web/src/presentation/components/brand-vault/label-editor.tsx`
  - `apps/web/src/presentation/components/brand-vault/artist-profile-card.tsx`
  - `apps/web/src/presentation/components/brand-vault/color-palette-picker.tsx`
  - `tests/domain/brand-vault/brand-profile-validation.test.ts`

## Proposal
- Approach summary: Definir esquemas Zod inmutables para `LabelProfile` y `ArtistProfile`. Implementar componentes UI modulares con Tailwind CSS, Lucide icons y validación en tiempo de ejecución.
- Technical design:
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
- Alternatives considered:
  - Almacenar CSS completo en lugar de valores estructurados: Rechazado porque los generadores agénticos (LLMs) necesitan valores semánticos discretos (primario, acento, fondo).
- Tradeoffs: Estructurar campos como JSON en SQLite requiere deserialización al vuelo en el repositorio.

## Critique
- Reviewer(s): `frontend`, `architect`, `ponytail`
- Critical findings:
  1. Si un usuario no define tipografía secundaria o subgéneros, el formulario debe aplicar valores por defecto sensatos sin fallar la validación.
  2. El selector de color debe permitir escribir directamente el código hex además de usar el color picker nativo HTML5.
  3. `Ponytail Evaluation`: Usar `<input type="color">` nativo del navegador con sincronización bidireccional a input de texto. Cero librerías de color picker de terceros (`react-color`, etc. descartadas: 0 KB de bundle añadido).

## Resolution
- Final approach after critique: Input nativo de color enriquecido con validación regex Zod. Componente autónomo reutilizable en menos de 60 líneas de código.

## Decision
- Decision: `approved`
- Decision date: `2026-09-07`
- Decision owner: `jaymusicmachine`

## Status
- Current status: `approved`
- Next action: Crear tests RED en `tests/domain/brand-vault/brand-profile-validation.test.ts`.

## Test and Validation Plan
- Unit tests: Validación de combinaciones válidas e inválidas de paleta, detección de URLs mal formadas en enlaces de streaming y prueba de valores por defecto.
- Integration tests: Flujo completo de creación de Label -> creación de Artist -> persistencia en SQLite -> consulta y lectura fiel.

## Traceability
- Related issue(s): `EPIC-01`, `HU-1.1`
- Branch: `SPEC/jaymusicmachine-EPIC-01-spec03-brand-vault-entities-crud-ui`
- Final commit hash(es): `TBD`
