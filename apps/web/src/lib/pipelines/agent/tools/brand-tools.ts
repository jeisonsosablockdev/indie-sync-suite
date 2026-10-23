/**
 * @file brand-tools.ts
 * @layer Domain
 * @description Executable Brand Vault tools for the autonomous orchestrator with Zod schema contracts.
 */

import { z } from 'zod';
import { ToolDefinition } from './tool-contract';
import { HexColorSchema } from '../../brand-vault/brand-schemas';
import { SqliteArtistRepository } from '../../../infrastructure/db/repositories/sqlite-artist-repository';
import { SqliteLabelRepository } from '../../../infrastructure/db/repositories/sqlite-label-repository';

// 1. Tool: consultar_marca (SAFE)
export const ConsultarMarcaSchema = z.object({
  artistId: z.string().uuid('ID de artista debe ser UUID').optional(),
  labelId: z.string().uuid('ID de sello debe ser UUID').optional(),
});

export function createConsultarMarcaTool(
  artistRepo: SqliteArtistRepository,
  labelRepo: SqliteLabelRepository
): ToolDefinition<typeof ConsultarMarcaSchema> {
  return {
    name: 'consultar_marca',
    description: 'Consulta la identidad estética, paleta de colores, tipografía y redes de un artista o sello.',
    riskLevel: 'SAFE',
    parameters: ConsultarMarcaSchema,
    execute: async ({ artistId, labelId }) => {
      if (artistId) {
        const artist = await artistRepo.findById(artistId);
        if (!artist) throw new Error(`Artista con ID ${artistId} no encontrado`);
        return { type: 'artist', data: artist };
      }
      if (labelId) {
        const label = await labelRepo.findById(labelId);
        if (!label) throw new Error(`Sello con ID ${labelId} no encontrado`);
        return { type: 'label', data: label };
      }
      const allArtists = await artistRepo.findAll();
      return { type: 'artist_list', data: allArtists };
    },
  };
}

// 2. Tool: crear_artista (SENSITIVE)
export const CrearArtistaSchema = z.object({
  labelId: z.string().uuid('ID de sello debe ser UUID válido'),
  name: z.string().min(1, 'El nombre del artista es obligatorio'),
  genre: z.string().min(1, 'El género musical principal es obligatorio'),
  bio: z.string().max(2000).optional().default(''),
  colorPalette: z.array(HexColorSchema).min(1).max(6).optional().default(['#0F172A', '#6366F1']),
});

export function createCrearArtistaTool(
  artistRepo: SqliteArtistRepository
): ToolDefinition<typeof CrearArtistaSchema> {
  return {
    name: 'crear_artista',
    description: 'Registra un nuevo artista musical en la base de datos y asigna su paleta de colores y género.',
    riskLevel: 'SENSITIVE',
    parameters: CrearArtistaSchema,
    requiresConfirmationMessage: (params) =>
      `El agente solicita registrar al artista musical "${params.name}" (${params.genre}) en la base de datos local.`,
    execute: async (params, context) => {
      const id = crypto.randomUUID();
      const newArtist = {
        id,
        labelId: params.labelId,
        name: params.name,
        genre: params.genre,
        bio: params.bio || '',
        subgenres: [],
        colorPalette: params.colorPalette || ['#0F172A', '#6366F1'],
        typography: { primary: 'Inter', secondary: 'Geist', weights: [400, 700] },
        toneOfVoice: '',
        socialLinks: {},
      };

      await artistRepo.create(newArtist);
      return { success: true, artist: newArtist, confirmedBy: context?.confirmedBy };
    },
  };
}

// 3. Tool: actualizar_marca_artista (SENSITIVE)
export const ActualizarMarcaArtistaSchema = z.object({
  artistId: z.string().uuid('ID de artista debe ser UUID válido'),
  bio: z.string().max(2000).optional(),
  genre: z.string().optional(),
  colorPalette: z.array(HexColorSchema).min(1).max(6).optional(),
  toneOfVoice: z.string().max(1000).optional(),
});

export function createActualizarMarcaArtistaTool(
  artistRepo: SqliteArtistRepository
): ToolDefinition<typeof ActualizarMarcaArtistaSchema> {
  return {
    name: 'actualizar_marca_artista',
    description: 'Actualiza los parámetros estéticos, paleta de color, tono de voz o bio de un artista existente.',
    riskLevel: 'SENSITIVE',
    parameters: ActualizarMarcaArtistaSchema,
    requiresConfirmationMessage: (params) =>
      `El agente solicita sobrescribir la identidad estética y conceptual del artista (ID: ${params.artistId}).`,
    execute: async (params, context) => {
      const { artistId, ...fields } = params;
      const updated = await artistRepo.update(artistId, fields);
      if (!updated) {
        throw new Error(`Artista con ID ${artistId} no encontrado para actualizar`);
      }
      return { success: true, updated, confirmedBy: context?.confirmedBy };
    },
  };
}

/**
 * Creates all standard brand tools bundled into a list.
 *
 * @param artistRepo - Repository for artist profile persistence.
 * @param labelRepo - Repository for label brand profile persistence.
 * @returns Array of operational brand tools.
 */
export function createBrandTools(
  artistRepo: SqliteArtistRepository,
  labelRepo: SqliteLabelRepository
): ToolDefinition<any, any>[] {
  return [
    createConsultarMarcaTool(artistRepo, labelRepo),
    createCrearArtistaTool(artistRepo),
    createActualizarMarcaArtistaTool(artistRepo),
  ];
}
