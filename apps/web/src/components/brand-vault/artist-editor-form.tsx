/**
 * @file artist-editor-form.tsx
 * @layer Presentation
 * @description Accessible modular form for creating and editing Artist Brand Vault profiles.
 */

'use client';

import React, { useState } from 'react';
import { useBrandVault } from '../../lib/hooks/use-brand-vault';
import { ColorPalettePicker } from './color-palette-picker';
import { ArtistProfile } from '../../lib/pipelines/brand-vault/brand-schemas';

interface ArtistEditorFormProps {
  initialArtist?: Partial<ArtistProfile>;
  onSaveProfile?: (profile: ArtistProfile) => Promise<void>;
}

export function ArtistEditorForm({ initialArtist, onSaveProfile }: ArtistEditorFormProps) {
  const {
    artist,
    errors,
    isSaving,
    isSuccess,
    updateField,
    updateColorPalette,
    save,
  } = useBrandVault(initialArtist);

  const [activeTab, setActiveTab] = useState<'general' | 'aesthetic' | 'social'>('general');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await save(onSaveProfile);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 w-full max-w-2xl bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
      data-testid="artist-editor-form"
    >
      {/* Tab Navigation */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 pb-2 gap-4 text-sm font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`pb-2 transition ${
            activeTab === 'general'
              ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          1. Identidad General
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('aesthetic')}
          className={`pb-2 transition ${
            activeTab === 'aesthetic'
              ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          2. Estética Visual
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('social')}
          className={`pb-2 transition ${
            activeTab === 'social'
              ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          3. Tono & Plataformas
        </button>
      </div>

      {errors.root && (
        <div className="p-3 text-xs bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 rounded border border-rose-200 dark:border-rose-900" role="alert">
          {errors.root}
        </div>
      )}

      {isSuccess && (
        <div className="p-3 text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 rounded border border-emerald-200 dark:border-emerald-900" role="status">
          ✓ Perfil de artista guardado exitosamente en la bóveda de marca.
        </div>
      )}

      {/* Tab 1: Identidad General */}
      {activeTab === 'general' && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1" htmlFor="artist-name">
              Nombre del Artista *
            </label>
            <input
              id="artist-name"
              type="text"
              value={artist.name || ''}
              onChange={e => updateField('name', e.target.value)}
              placeholder="ej. Luna & The Waves"
              className="w-full px-3 py-2 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1" htmlFor="artist-genre">
              Género Principal *
            </label>
            <input
              id="artist-genre"
              type="text"
              value={artist.genre || ''}
              onChange={e => updateField('genre', e.target.value)}
              placeholder="ej. Synthwave, Indie Pop"
              className="w-full px-3 py-2 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            {errors.genre && <p className="text-xs text-rose-500 mt-1">{errors.genre}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1" htmlFor="artist-bio">
              Biografía Conceptual (máx. 2000 caracteres)
            </label>
            <textarea
              id="artist-bio"
              rows={4}
              value={artist.bio || ''}
              onChange={e => updateField('bio', e.target.value)}
              placeholder="Describe el trasfondo, influencias sonoras y narrativa del proyecto..."
              className="w-full px-3 py-2 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            {errors.bio && <p className="text-xs text-rose-500 mt-1">{errors.bio}</p>}
          </div>
        </div>
      )}

      {/* Tab 2: Estética Visual */}
      {activeTab === 'aesthetic' && (
        <div className="space-y-6">
          <ColorPalettePicker
            palette={artist.colorPalette || []}
            onChange={updateColorPalette}
          />
          {errors.colorPalette && <p className="text-xs text-rose-500">{errors.colorPalette}</p>}

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1" htmlFor="artist-font">
              Tipografía Primaria
            </label>
            <input
              id="artist-font"
              type="text"
              value={artist.typography?.primary || ''}
              onChange={e =>
                updateField('typography', {
                  ...artist.typography,
                  primary: e.target.value,
                  weights: artist.typography?.weights || [400, 700],
                })
              }
              placeholder="ej. Space Grotesk, Syne, Inter"
              className="w-full px-3 py-2 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
            />
          </div>
        </div>
      )}

      {/* Tab 3: Tono & Redes */}
      {activeTab === 'social' && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1" htmlFor="artist-tone">
              Tono de Voz y Manifiesto
            </label>
            <input
              id="artist-tone"
              type="text"
              value={artist.toneOfVoice || ''}
              onChange={e => updateField('toneOfVoice', e.target.value)}
              placeholder="ej. Melancólico, futurista, poético y reflexivo"
              className="w-full px-3 py-2 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1" htmlFor="artist-spotify">
              Enlace de Spotify
            </label>
            <input
              id="artist-spotify"
              type="url"
              value={artist.socialLinks?.spotify || ''}
              onChange={e =>
                updateField('socialLinks', {
                  ...artist.socialLinks,
                  spotify: e.target.value,
                })
              }
              placeholder="https://open.spotify.com/artist/..."
              className="w-full px-3 py-2 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="px-5 py-2 text-sm font-semibold rounded-md bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-50"
        >
          {isSaving ? 'Guardando en Bóveda...' : 'Guardar Perfil de Marca'}
        </button>
      </div>
    </form>
  );
}
