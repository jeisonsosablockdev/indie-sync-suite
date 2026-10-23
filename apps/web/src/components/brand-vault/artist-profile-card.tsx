/**
 * @file artist-profile-card.tsx
 * @layer Presentation
 * @description Accessible visual representation card for an Artist Brand Vault profile.
 */

'use client';

import React from 'react';
import { ArtistProfile } from '../../lib/pipelines/brand-vault/brand-schemas';

interface ArtistProfileCardProps {
  profile: Partial<ArtistProfile>;
}

export function ArtistProfileCard({ profile }: ArtistProfileCardProps) {
  const palette = profile.colorPalette || ['#0F172A', '#6366F1'];
  const primaryColor = palette[0] || '#0F172A';
  const secondaryColor = palette[1] || '#6366F1';

  return (
    <div
      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm transition"
      data-testid="artist-profile-card"
    >
      {/* Visual Header Banner using brand colors */}
      <div
        className="h-24 w-full relative p-4 flex items-end"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        }}
      >
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-black/40 text-white backdrop-blur-sm">
          {profile.genre || 'Género no asignado'}
        </span>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {profile.name || 'Nombre del Artista'}
          </h3>
          {profile.bio ? (
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-3">
              {profile.bio}
            </p>
          ) : (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 italic">
              Sin biografía definida aún.
            </p>
          )}
        </div>

        {/* Color Palette Strip */}
        <div>
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
            Paleta de Identidad
          </span>
          <div className="flex gap-1.5 items-center">
            {palette.map((hex: string, i: number) => (
              <div
                key={`${hex}-${i}`}
                className="w-6 h-6 rounded-md border border-black/10 dark:border-white/10 shadow-xs"
                style={{ backgroundColor: hex }}
                title={`Muestra ${i + 1}: ${hex}`}
              />
            ))}
          </div>
        </div>

        {/* Typography & Tone */}
        <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <div>
            <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Tipografía</span>
            <span className="font-mono text-zinc-700 dark:text-zinc-300">
              {profile.typography?.primary || 'Inter'}
            </span>
          </div>
          <div>
            <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Tono</span>
            <span className="text-zinc-700 dark:text-zinc-300 truncate block">
              {profile.toneOfVoice || 'Neutro'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
