/**
 * @file creative-studio-view.tsx
 * @layer Presentation
 * @description Main creative multimedia studio view with format switcher, generation tabs,
 *              and pipeline orchestrator layout. Pure React UI, zero Layer 3/4 imports.
 */

'use client';

import React from 'react';
import {
  Sparkles,
  Layers,
  Type,
  MessageSquare,
  Archive,
  Image as ImageIcon,
} from 'lucide-react';
import {
  useCreativeStudio,
  CreativeStudioTab,
} from '../../lib/hooks/use-creative-studio';

export interface CreativeStudioViewProps {
  releaseId: string;
  releaseTitle?: string;
  artistName?: string;
  initialTab?: CreativeStudioTab;
}

const TAB_CONFIG: { id: CreativeStudioTab; label: string; icon: React.ElementType }[] = [
  { id: 'PROMPT_STUDIO', label: 'Prompt Studio', icon: Sparkles },
  { id: 'BATCH_GENERATION', label: 'Lote de Variantes', icon: Layers },
  { id: 'TYPOGRAPHY', label: 'Maquetación Tipográfica', icon: Type },
  { id: 'SOCIAL_COPY', label: 'Copys de Campaña', icon: MessageSquare },
  { id: 'VAULT', label: 'Asset Vault', icon: Archive },
];

/**
 * CreativeStudioView presentation component.
 */
export function CreativeStudioView({
  releaseId,
  releaseTitle = 'Lanzamiento Musical',
  artistName = 'Artista Independiente',
  initialTab = 'PROMPT_STUDIO',
}: CreativeStudioViewProps) {
  // Step 1: Bind application hook
  const {
    activeTab,
    setActiveTab,
    selectedFormat,
    setSelectedFormat,
    aspectRatio,
    isGenerating,
    error,
    startBatchGeneration,
  } = useCreativeStudio({ releaseId, initialTab });

  return (
    <div
      className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 space-y-6"
      data-testid="creative-studio-view"
    >
      {/* Step 2: Studio Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <ImageIcon className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                Estudio Creativo Multimedia
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {releaseTitle} • <span className="font-medium text-zinc-700 dark:text-zinc-300">{artistName}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Format Selector Pills */}
        <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setSelectedFormat('COVER_1_1')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              selectedFormat === 'COVER_1_1'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
            }`}
          >
            1:1 Portada (3000px)
          </button>
          <button
            type="button"
            onClick={() => setSelectedFormat('STORY_9_16')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              selectedFormat === 'STORY_9_16'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
            }`}
          >
            9:16 Canvas / Story
          </button>
          <button
            type="button"
            onClick={() => setSelectedFormat('BANNER_16_9')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              selectedFormat === 'BANNER_16_9'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
            }`}
          >
            16:9 Banner
          </button>
        </div>
      </div>

      {/* Step 3: Studio Navigation Tabs */}
      <nav className="flex space-x-2 border-b border-zinc-100 dark:border-zinc-800 pb-2 overflow-x-auto">
        {TAB_CONFIG.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Step 4: Error Banner if present */}
      {error && (
        <div className="p-3 text-xs rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
          {error}
        </div>
      )}

      {/* Step 5: Active Tab Container */}
      <div className="pt-2">
        <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 p-8 text-center text-sm text-zinc-500">
          Panel activo: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{activeTab}</span> (Proporción: {aspectRatio})
        </div>
      </div>
    </div>
  );
}
