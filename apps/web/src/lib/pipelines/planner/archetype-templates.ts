/**
 * @file archetype-templates.ts
 * @layer Domain
 * @description Canonical immutable archetype templates for musical releases
 *              (Single 6w, EP 8w, Album 12w, Remix 4w) with relative day offsets.
 */

import { PhaseType } from './planner-schemas';

export interface ArchetypeTaskDefinition {
  title: string;
  description: string;
  phaseType: PhaseType;
  offsetDays: number; // Relativo a T-0 (negativo = antes, positivo = después)
  isGatekeeper: boolean;
  assignedRole: 'LABEL_MANAGER' | 'ARTIST' | 'COLLABORATOR';
}

export interface ArchetypeTemplate {
  id: 'SINGLE' | 'EP' | 'ALBUM' | 'REMIX';
  name: string;
  description: string;
  durationWeeks: number;
  totalDays: number;
  tasks: ArchetypeTaskDefinition[];
}

// ==============================================================================
// Step 1: Canonical Template Definitions
// Invariant: Master delivery must always occur at T-14 days or earlier.
// ==============================================================================

export const SINGLE_TEMPLATE: ArchetypeTemplate = {
  id: 'SINGLE',
  name: 'Single Debut / Sencillo',
  description: 'Campaña estándar de 6 semanas optimizada para el lanzamiento de un single principal.',
  durationWeeks: 6,
  totalDays: 42,
  tasks: [
    {
      title: 'Entrega del Máster de Audio (WAV)',
      description: 'Entrega final y verificación del master de audio en alta resolución.',
      phaseType: 'PRE_RELEASE',
      offsetDays: -21,
      isGatekeeper: true,
      assignedRole: 'ARTIST',
    },
    {
      title: 'Aprobación de Arte de Portada (1:1)',
      description: 'Revisión y visto bueno del arte final de portada a 3000x3000px.',
      phaseType: 'PRE_RELEASE',
      offsetDays: -18,
      isGatekeeper: false,
      assignedRole: 'ARTIST',
    },
    {
      title: 'Envío de Metadatos a Distribuidora',
      description: 'Carga de ISRC, UPC y assets en plataforma de distribución digital.',
      phaseType: 'PRE_RELEASE',
      offsetDays: -14,
      isGatekeeper: true,
      assignedRole: 'LABEL_MANAGER',
    },
    {
      title: 'Pitching Editorial en Spotify for Artists',
      description: 'Envío de formulario de curaduría editorial antes del límite estricto de 7 días.',
      phaseType: 'PRE_RELEASE',
      offsetDays: -7,
      isGatekeeper: true,
      assignedRole: 'LABEL_MANAGER',
    },
    {
      title: 'Día de Estreno (T-0)',
      description: 'Verificación de disponibilidad en todas las plataformas de streaming a medianoche.',
      phaseType: 'LIVE_RELEASE',
      offsetDays: 0,
      isGatekeeper: false,
      assignedRole: 'LABEL_MANAGER',
    },
    {
      title: 'Lanzamiento de Campaña en Redes Sociales',
      description: 'Publicación de teasers y videos de Canvas en TikTok, Instagram y YouTube.',
      phaseType: 'LIVE_RELEASE',
      offsetDays: 1,
      isGatekeeper: false,
      assignedRole: 'ARTIST',
    },
    {
      title: 'Evaluación de Rendimiento y Primer Reporte',
      description: 'Revisión de reproducciones en primeras 72 horas y alcance orgánico.',
      phaseType: 'POST_RELEASE',
      offsetDays: 7,
      isGatekeeper: false,
      assignedRole: 'LABEL_MANAGER',
    },
  ],
};

export const EP_TEMPLATE: ArchetypeTemplate = {
  id: 'EP',
  name: 'EP Release (Extended Play)',
  description: 'Campaña de 8 semanas para lanzamientos de 4 a 6 canciones con narrativa cohesiva.',
  durationWeeks: 8,
  totalDays: 56,
  tasks: [
    ...SINGLE_TEMPLATE.tasks.map(t => ({
      ...t,
      offsetDays: t.offsetDays < 0 ? t.offsetDays - 14 : t.offsetDays + 7,
    })),
  ],
};

export const ALBUM_TEMPLATE: ArchetypeTemplate = {
  id: 'ALBUM',
  name: 'Álbum Completo (Long Play)',
  description: 'Estrategia integral de 12 semanas con pre-campaña extendida y múltiples sencillos.',
  durationWeeks: 12,
  totalDays: 84,
  tasks: [
    ...SINGLE_TEMPLATE.tasks.map(t => ({
      ...t,
      offsetDays: t.offsetDays < 0 ? t.offsetDays - 42 : t.offsetDays + 14,
    })),
  ],
};

export const REMIX_TEMPLATE: ArchetypeTemplate = {
  id: 'REMIX',
  name: 'Remix / Edición Deluxe',
  description: 'Campaña ágil de 4 semanas para tracks alternativos o reediciones.',
  durationWeeks: 4,
  totalDays: 28,
  tasks: [
    ...SINGLE_TEMPLATE.tasks.map(t => ({
      ...t,
      offsetDays: t.offsetDays < 0 ? Math.max(t.offsetDays + 7, -14) : t.offsetDays,
    })),
  ],
};

export const ARCHETYPE_TEMPLATES: Record<string, ArchetypeTemplate> = {
  SINGLE: SINGLE_TEMPLATE,
  EP: EP_TEMPLATE,
  ALBUM: ALBUM_TEMPLATE,
  REMIX: REMIX_TEMPLATE,
};
