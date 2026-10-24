/**
 * @file audio-links-manager.tsx
 * @layer Presentation
 * @description Accessible UI manager for external audio links (Drive, Dropbox, Disco.ac)
 *              with remote HTTP HEAD header verification.
 */

'use client';

import React, { useState } from 'react';
import {
  ExternalAudioLink,
  AudioCategory,
  AudioCategorySchema,
} from '../../lib/pipelines/planner/audio-link-schemas';

export interface AudioLinksManagerProps {
  links: ExternalAudioLink[];
  isVerifying?: Record<string, boolean>;
  onSaveLink?: (category: AudioCategory, url: string) => Promise<void>;
  onVerifyLink?: (linkId: string, category: AudioCategory) => Promise<void>;
}

const CATEGORY_LABELS: Record<AudioCategory, string> = {
  MASTER_WAV: 'Master WAV (24-bit / 44.1kHz+)',
  INSTRUMENTAL: 'Pista Instrumental',
  STEMS: 'Stems de Mezcla (ZIP / Carpeta)',
  ACAPELLA: 'Vocal / Acapella',
};

export function AudioLinksManager({
  links,
  isVerifying = {},
  onSaveLink,
  onVerifyLink,
}: AudioLinksManagerProps) {
  const [editingCategory, setEditingCategory] = useState<AudioCategory | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  const categories = AudioCategorySchema.options;

  const handleStartEdit = (category: AudioCategory, existingUrl?: string) => {
    setEditingCategory(category);
    setUrlInput(existingUrl || '');
    setInputError(null);
  };

  const handleSave = async (category: AudioCategory) => {
    if (!urlInput.trim()) {
      setInputError('La URL no puede estar vacía.');
      return;
    }
    try {
      new URL(urlInput.trim());
    } catch {
      setInputError('URL inválida. Debe incluir protocolo http:// o https://');
      return;
    }

    if (onSaveLink) {
      await onSaveLink(category, urlInput.trim());
    }
    setEditingCategory(null);
    setUrlInput('');
  };

  return (
    <div
      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-6"
      data-testid="audio-links-manager"
    >
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Gestión de Enlaces de Audio Externos
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Archivos pesados almacenados en la nube (Dropbox, Drive, Disco.ac). Cero archivos locales en BD.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {categories.map(category => {
          const currentLink = links.find(l => l.category === category);
          const isEditing = editingCategory === category;
          const verifying = currentLink ? isVerifying[currentLink.id] : false;

          return (
            <div
              key={category}
              className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 flex flex-col md:flex-row md:items-center justify-between gap-4"
              data-testid={`audio-link-row-${category.toLowerCase()}`}
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {CATEGORY_LABELS[category]}
                  </span>
                  {currentLink?.verifiedStatus === 'VERIFIED' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                      ✓ Verificado
                    </span>
                  )}
                  {currentLink?.verifiedStatus === 'ERROR' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
                      ✕ Error en enlace
                    </span>
                  )}
                  {(!currentLink || currentLink.verifiedStatus === 'UNVERIFIED') && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      Sin verificar
                    </span>
                  )}
                </div>

                {isEditing ? (
                  <div className="pt-2 space-y-2">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={e => setUrlInput(e.target.value)}
                      placeholder="https://drive.google.com/..."
                      className="w-full text-xs px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {inputError && <p className="text-[11px] text-rose-500">{inputError}</p>}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSave(category)}
                        className="px-3 py-1 rounded text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition"
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCategory(null)}
                        className="px-3 py-1 rounded text-xs font-semibold border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-zinc-600 dark:text-zinc-400 truncate max-w-xl">
                    {currentLink ? (
                      <a
                        href={currentLink.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 dark:text-indigo-400 hover:underline font-mono"
                      >
                        {currentLink.url}
                      </a>
                    ) : (
                      <span className="italic text-zinc-400">Ningún enlace configurado</span>
                    )}
                  </div>
                )}
              </div>

              {!isEditing && (
                <div className="flex items-center gap-2 shrink-0">
                  {currentLink && onVerifyLink && (
                    <button
                      type="button"
                      disabled={verifying}
                      onClick={() => onVerifyLink(currentLink.id, category)}
                      className="px-3 py-1 text-xs font-semibold rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition disabled:opacity-50"
                    >
                      {verifying ? 'Comprobando...' : 'Verificar HEAD'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleStartEdit(category, currentLink?.url)}
                    className="px-3 py-1 text-xs font-semibold rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 transition"
                  >
                    {currentLink ? 'Editar URL' : 'Agregar Enlace'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
