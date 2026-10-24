/**
 * @file use-csv-ingestion.ts
 * @layer Application
 * @description Application hook coordinating CSV streaming report parsing, row preview,
 *              validation issue tracking, and batch persistence. Zero direct JSX.
 */

'use client';

import { useState, useCallback } from 'react';
import {
  parseStreamingCsv,
  CsvParseResult,
  CsvParseIssue,
} from '../pipelines/analytics/csv-report-parser';
import {
  StreamingCsvRow,
  StreamingSource,
} from '../pipelines/analytics/analytics-schemas';

export type { CsvParseResult, CsvParseIssue, StreamingCsvRow, StreamingSource };

export interface UseCsvIngestionOptions {
  releaseId: string;
}

export interface UseCsvIngestionReturn {
  parseResult: CsvParseResult | null;
  isParsing: boolean;
  isIngesting: boolean;
  error: string | null;
  ingestionSuccess: boolean;
  parseFileContent: (fileContent: string) => void;
  commitBatch: (reportTitle: string) => Promise<boolean>;
  reset: () => void;
}

/**
 * Reactive hook for handling CSV streaming report ingestion and validation.
 *
 * @param options - Configuration including target releaseId
 * @returns State and handlers for parsing, previewing, and committing reports
 */
export function useCsvIngestion({ releaseId }: UseCsvIngestionOptions): UseCsvIngestionReturn {
  // Step 1: Initialize states
  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isIngesting, setIsIngesting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [ingestionSuccess, setIngestionSuccess] = useState<boolean>(false);

  // Step 2: Handle raw file content parsing
  const parseFileContent = useCallback((fileContent: string) => {
    setIsParsing(true);
    setError(null);
    setIngestionSuccess(false);

    try {
      const result = parseStreamingCsv(fileContent);
      setParseResult(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado al parsear archivo CSV');
    } finally {
      setIsParsing(false);
    }
  }, []);

  // Step 3: Commit valid rows into repository storage
  const commitBatch = useCallback(
    async (_reportTitle: string): Promise<boolean> => {
      if (!releaseId || !parseResult || parseResult.rows.length === 0) {
        setError('No hay filas válidas para persistir en este reporte');
        return false;
      }

      setIsIngesting(true);
      setError(null);

      try {
        // Step 3a: Simulated persistence batch operation
        await new Promise((resolve) => setTimeout(resolve, 300));
        setIngestionSuccess(true);
        return true;
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al guardar reporte en base de datos');
        return false;
      } finally {
        setIsIngesting(false);
      }
    },
    [releaseId, parseResult]
  );

  // Step 4: Reset state for another upload
  const reset = useCallback(() => {
    setParseResult(null);
    setIsParsing(false);
    setIsIngesting(false);
    setError(null);
    setIngestionSuccess(false);
  }, []);

  return {
    parseResult,
    isParsing,
    isIngesting,
    error,
    ingestionSuccess,
    parseFileContent,
    commitBatch,
    reset,
  };
}
