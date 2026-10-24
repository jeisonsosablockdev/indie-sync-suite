/**
 * @file asset-vault-gallery.tsx
 * @layer Presentation
 * @description Unified visual deliverable repository categorized by ratio (1:1, 9:16, 16:9, Textos)
 *              featuring SHA-256 cryptographic hash badges and download actions. Pure React UI.
 */

'use client';

import React from 'react';
import { Archive, ShieldCheck, Download, Search, CheckCircle } from 'lucide-react';
import {
  useAssetVault,
  CreativeAsset,
  AssetFormat,
} from '../../lib/hooks/use-asset-vault';

export interface AssetVaultGalleryProps {
  releaseId: string;
  initialAssets?: CreativeAsset[];
  onDownloadAsset?: (asset: CreativeAsset) => void;
}

const FILTER_BUTTONS: { id: AssetFormat | 'ALL'; label: string }[] = [
  { id: 'ALL', label: 'Todos los Activos' },
  { id: 'COVER_1_1', label: 'Portadas 1:1' },
  { id: 'STORY_9_16', label: 'Stories / Canvas 9:16' },
  { id: 'BANNER_16_9', label: 'Banners 16:9' },
  { id: 'SOCIAL_COPY', label: 'Copys de Campaña' },
];

/**
 * AssetVaultGallery presentation component.
 */
export function AssetVaultGallery({
  releaseId,
  initialAssets,
  onDownloadAsset,
}: AssetVaultGalleryProps) {
  // Step 1: Bind application hook
  const {
    filteredAssets,
    selectedFilter,
    setSelectedFilter,
    searchQuery,
    setSearchQuery,
    isLoading,
    exportVaultZip,
  } = useAssetVault({ releaseId, initialAssets });

  return (
    <div
      className="space-y-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6"
      data-testid="asset-vault-gallery"
    >
      {/* Step 2: Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Archive className="w-4 h-4 text-emerald-500" />
            Repositorio Central de Activos Aprobados (Asset Vault)
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Entregables finales verificados con integridad criptográfica SHA-256 listos para distribución y DSPs.
          </p>
        </div>

        <button
          type="button"
          onClick={exportVaultZip}
          disabled={isLoading || filteredAssets.length === 0}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 transition-colors shadow-sm disabled:opacity-40"
        >
          <Download className="w-3.5 h-3.5" />
          Descargar Lote (ZIP)
        </button>
      </div>

      {/* Step 3: Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl">
          {FILTER_BUTTONS.map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => setSelectedFilter(btn.id)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                selectedFilter === btn.id
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por ID o hash..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Step 4: Visual Asset Cards */}
      {filteredAssets.length === 0 ? (
        <div className="py-16 text-center text-sm text-zinc-400 dark:text-zinc-500 italic border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
          No se encontraron activos aprobados en esta categoría.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="group rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950 hover:border-zinc-400 transition-all"
            >
              <div className="aspect-square bg-zinc-100 dark:bg-zinc-900 relative flex items-center justify-center overflow-hidden">
                <span className="text-xs text-zinc-400 font-mono">
                  {asset.format} ({asset.width}×{asset.height})
                </span>

                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] flex items-center gap-1 font-semibold">
                  <CheckCircle className="w-3 h-3" /> Aprobado
                </div>
              </div>

              <div className="p-3.5 space-y-2 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {asset.format}
                  </span>
                  <span className="text-zinc-400 text-[11px]">
                    {(asset.fileSizeBytes / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>

                {/* SHA-256 Hash Display */}
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-[11px] font-mono text-zinc-600 dark:text-zinc-400 border border-zinc-100 dark:border-zinc-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span className="truncate">{asset.contentHash}</span>
                </div>

                {onDownloadAsset && (
                  <button
                    type="button"
                    onClick={() => onDownloadAsset(asset)}
                    className="w-full mt-2 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-700 dark:text-zinc-300"
                  >
                    Descargar Activo
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
