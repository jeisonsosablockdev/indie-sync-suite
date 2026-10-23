/**
 * @file archetype-selector-modal.tsx
 * @layer Presentation
 * @description Modal dialog for selecting an Archetype template (Single, EP, Album, Remix)
 *              and initializing release phases and projected schedule.
 */

'use client';

import React, { useState } from 'react';
import {
  ArchetypeTemplate,
  ARCHETYPE_TEMPLATES,
} from '../../lib/pipelines/planner/archetype-templates';

export interface ArchetypeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: ArchetypeTemplate) => void;
}

export function ArchetypeSelectorModal({
  isOpen,
  onClose,
  onSelect,
}: ArchetypeSelectorModalProps) {
  const [selectedArchetype, setSelectedArchetype] = useState<ArchetypeTemplate['id']>('SINGLE');

  if (!isOpen) return null;

  const currentTemplate = ARCHETYPE_TEMPLATES[selectedArchetype];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="archetype-modal-title"
      data-testid="archetype-selector-modal"
    >
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden p-6 space-y-6">
        {/* Step 1: Dialog Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div>
            <h3 id="archetype-modal-title" className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Seleccionar Arquetipo de Lanzamiento
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Elige una plantilla base para proyectar fases, hitos críticos y tareas relativas a T-0.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition text-lg leading-none"
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        {/* Step 2: Archetype Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.keys(ARCHETYPE_TEMPLATES) as Array<ArchetypeTemplate['id']>).map(type => {
            const template = ARCHETYPE_TEMPLATES[type];
            const isSelected = selectedArchetype === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedArchetype(type)}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300'
                }`}
                data-testid={`archetype-tab-${type.toLowerCase()}`}
              >
                <span className="text-xs font-bold uppercase tracking-wider">{template.name}</span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                  {template.durationWeeks} semanas
                </span>
              </button>
            );
          })}
        </div>

        {/* Step 3: Selected Archetype Details */}
        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {currentTemplate.name}
            </h4>
            <span className="text-xs font-mono text-zinc-500">
              3 Fases · {currentTemplate.tasks.length} Tareas Totales
            </span>
          </div>

          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {currentTemplate.description}
          </p>

          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-4 text-xs">
            <div>
              <span className="text-zinc-400">Hitos Gatekeeper:</span>{' '}
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                {currentTemplate.tasks.filter(t => t.isGatekeeper).length}
              </span>
            </div>
            <div>
              <span className="text-zinc-400">Margen Pre-Release:</span>{' '}
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                {Math.abs(Math.min(...currentTemplate.tasks.map(t => t.offsetDays)))} días
              </span>
            </div>
          </div>
        </div>

        {/* Step 4: Dialog Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              onSelect(currentTemplate);
              onClose();
            }}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-sm"
            data-testid="confirm-archetype-btn"
          >
            Aplicar Arquetipo
          </button>
        </div>
      </div>
    </div>
  );
}
