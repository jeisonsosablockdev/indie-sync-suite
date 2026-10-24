/**
 * @file csv-report-uploader.tsx
 * @layer Presentation
 * @description Drag-and-drop CSV analytics uploader with dialect inspection, row preview,
 *              corrupt row warning displays, and batch persistence action. Pure React UI, zero Layer 3/4 imports.
 */

'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useCsvIngestion } from '../../lib/hooks/use-csv-ingestion';

export interface CsvReportUploaderProps {
  releaseId: string;
  onSuccess?: () => void;
  className?: string;
}

/**
 * CsvReportUploader presentation component.
 *
 * @param props - Component props including target releaseId
 * @returns JSX Element rendering drag-and-drop report ingestion wizard
 */
export function CsvReportUploader({
  releaseId,
  onSuccess,
  className = '',
}: CsvReportUploaderProps): React.JSX.Element {
  // Step 1: Bind application hook
  const {
    parseResult,
    isParsing,
    isIngesting,
    error,
    ingestionSuccess,
    parseFileContent,
    commitBatch,
    reset,
  } = useCsvIngestion({ releaseId });

  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const [reportTitle, setReportTitle] = useState<string>('Reporte de Streaming');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2: Handle raw file ingestion
  const processFile = useCallback(
    (file: File) => {
      setReportTitle(file.name.replace(/\.[^/.]+$/, ''));
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
          parseFileContent(text);
        }
      };
      reader.readAsText(file);
    },
    [parseFileContent]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        processFile(e.dataTransfer.files[0]);
      }
    },
    [processFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        processFile(e.target.files[0]);
      }
    },
    [processFile]
  );

  // Step 3: Handle batch confirmation
  const handleCommit = async () => {
    const success = await commitBatch(reportTitle);
    if (success) {
      onSuccess?.();
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Step 4: Drag and drop dropzone */}
      {!parseResult && !ingestionSuccess && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragActive(true);
          }}
          onDragLeave={() => setIsDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-indigo-500 bg-indigo-500/5'
              : 'border-border/60 hover:border-border hover:bg-muted/30'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center gap-2">
            <UploadCloud className="h-10 w-10 text-muted-foreground" />
            <h4 className="text-sm font-semibold text-foreground">
              Sube tu reporte analítico CSV
            </h4>
            <p className="text-xs text-muted-foreground max-w-sm">
              Arrastra un archivo exportado de Spotify for Artists, Apple Music, DistroKid o formato genérico.
            </p>
          </div>
        </div>
      )}

      {/* Step 5: Loading State during parsing */}
      {isParsing && (
        <div className="flex items-center justify-center p-6 gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
          <span>Analizando dialecto y estructurando filas...</span>
        </div>
      )}

      {/* Step 6: Parsing Preview & Ingestion Controls */}
      {parseResult && !ingestionSuccess && (
        <div className="p-4 rounded-xl border border-border/50 bg-card/40 space-y-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-indigo-500" />
              <div>
                <h4 className="text-sm font-bold text-foreground">{reportTitle}</h4>
                <p className="text-xs text-muted-foreground">
                  Plataforma detectada: <span className="font-semibold text-foreground">{parseResult.detectedSource}</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={reset}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Cambiar archivo
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-background/50 border border-border/40">
              <span className="text-muted-foreground">Filas válidas reconocidas:</span>
              <p className="text-base font-bold text-emerald-500">{parseResult.rows.length}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-background/50 border border-border/40">
              <span className="text-muted-foreground">Filas con advertencia/error:</span>
              <p className="text-base font-bold text-amber-500">{parseResult.errors.length}</p>
            </div>
          </div>

          {/* Validation warnings list */}
          {parseResult.errors.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-500 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Advertencias de validación ({parseResult.errors.length} filas descartadas):</span>
              </div>
              <ul className="list-disc pl-5 max-h-24 overflow-y-auto space-y-0.5">
                {parseResult.errors.slice(0, 5).map((err, idx) => (
                  <li key={idx}>
                    Fila {err.rowIndex}: {err.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={reset}
              className="px-3 py-1.5 rounded-lg border border-border/60 text-xs text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void handleCommit()}
              disabled={isIngesting || parseResult.rows.length === 0}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
            >
              {isIngesting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Persistiendo lote...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Importar {parseResult.rows.length} Registros
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 7: Ingestion Success Notification */}
      {ingestionSuccess && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-center space-y-2">
          <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
          <h4 className="text-sm font-bold text-foreground">¡Reporte importado con éxito!</h4>
          <p className="text-xs text-muted-foreground">
            Las métricas fueron consolidadas en el almacenamiento local SQLite.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-2 text-xs font-medium text-indigo-500 hover:underline"
          >
            Subir otro reporte
          </button>
        </div>
      )}
    </div>
  );
}
