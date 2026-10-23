/**
 * @file release-concept-card.tsx
 * @layer Presentation
 * @description Accessible visual presentation card for Release Concept (Contexto Nivel 3).
 *              Displays narrative, lyric theme, sound mood, T-0 target date, budget, and metadata codes.
 */

'use client';

import React from 'react';
import { ReleaseConcept } from '../../lib/pipelines/planner/planner-schemas';

export interface ReleaseConceptCardProps {
  concept: Partial<ReleaseConcept>;
  canEditBudget?: boolean;
  onEdit?: () => void;
  onFreeze?: () => void;
}

export function ReleaseConceptCard({
  concept,
  canEditBudget = true,
  onEdit,
  onFreeze,
}: ReleaseConceptCardProps) {
  const isFrozen = Boolean(concept.snapshotFrozen);

  return (
    <div
      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm transition p-6 space-y-6"
      data-testid="release-concept-card"
    >
      {/* Step 1: Card Header with status badge */}
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Contexto Estratégico del Lanzamiento
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Nivel 3 — Narrativa artística, directrices sonoras y metadatos maestros.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isFrozen ? (
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50"
              data-testid="frozen-badge"
            >
              🔒 Snapshot Congelado
            </span>
          ) : (
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50"
              data-testid="draft-badge"
            >
              ✏️ Modo Borrador
            </span>
          )}

          {!isFrozen && onFreeze && (
            <button
              type="button"
              onClick={onFreeze}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 transition shadow-sm"
              data-testid="freeze-btn"
            >
              Congelar Concepto
            </button>
          )}

          {!isFrozen && onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="px-3 py-1 text-xs font-semibold rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition"
              data-testid="edit-concept-btn"
            >
              Editar
            </button>
          )}
        </div>
      </div>

      {/* Step 2: Strategic Narrative & Aesthetic Mood */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Narrativa Central
            </span>
            <p className="text-sm text-zinc-800 dark:text-zinc-200 mt-1 leading-relaxed">
              {concept.narrative || <span className="italic text-zinc-400">Sin narrativa definida.</span>}
            </p>
          </div>

          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Tema Lírico / Mensaje
            </span>
            <p className="text-sm text-zinc-800 dark:text-zinc-200 mt-1">
              {concept.lyricTheme || <span className="italic text-zinc-400">Sin tema lírico definido.</span>}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Mood Sonoro & Directrices de Producción
            </span>
            <p className="text-sm text-zinc-800 dark:text-zinc-200 mt-1">
              {concept.soundMood || <span className="italic text-zinc-400">Sin directrices sonoras.</span>}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Fecha Objetivo T-0
              </span>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                {concept.targetDate
                  ? new Date(concept.targetDate).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      timeZone: 'UTC',
                    })
                  : 'Por definir'}
              </p>
            </div>

            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Presupuesto Asignado
              </span>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                {canEditBudget
                  ? `$${(concept.budgetUsd ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD`
                  : 'Confidencial (Label)'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Step 3: Distribution Identifiers (ISRC / UPC) */}
      <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-zinc-400 dark:text-zinc-500 font-medium">ISRC:</span>
          <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-800 dark:text-zinc-200">
            {concept.isrc || 'Pendiente de asignación'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-zinc-400 dark:text-zinc-500 font-medium">UPC:</span>
          <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-800 dark:text-zinc-200">
            {concept.upc || 'Pendiente de asignación'}
          </span>
        </div>
        {concept.frozenAt && (
          <div className="ml-auto text-zinc-400 text-xs">
            Congelado el: {new Date(concept.frozenAt).toLocaleString('es-ES')}
          </div>
        )}
      </div>
    </div>
  );
}
