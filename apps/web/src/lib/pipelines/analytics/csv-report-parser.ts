/**
 * @file csv-report-parser.ts
 * @layer Domain
 * @description Deterministic and fault-tolerant CSV parser for music streaming analytics reports
 *              (Spotify for Artists, DistroKid, TuneCore, Generic). Zero network I/O, zero classes.
 */

import {
  StreamingCsvRow,
  StreamingCsvRowSchema,
  StreamingSource,
} from './analytics-schemas';

export interface CsvParserOptions {
  fallbackPlatform?: string;
  defaultCountryCode?: string;
}

export interface CsvParseIssue {
  rowIndex: number;
  message: string;
  rawContent: string;
}

export interface CsvParseResult {
  detectedSource: StreamingSource;
  rows: StreamingCsvRow[];
  errors: CsvParseIssue[];
  totalRowsRead: number;
}

/**
 * Detects the dialect and delimiter of the raw CSV content.
 *
 * @param headerLine - First line containing header column names
 * @returns Detected delimiter (comma or semicolon)
 */
export function detectDelimiter(headerLine: string): ',' | ';' {
  // Step 1: Count occurrences of comma vs semicolon in header
  const commaCount = (headerLine.match(/,/g) || []).length;
  const semicolonCount = (headerLine.match(/;/g) || []).length;

  // Step 2: Return delimiter with higher frequency
  return semicolonCount > commaCount ? ';' : ',';
}

/**
 * Detects streaming report platform source based on column naming patterns.
 *
 * @param headers - Array of trimmed column names from CSV header
 * @returns Identified StreamingSource enum value
 */
export function detectSourcePlatform(headers: string[]): StreamingSource {
  // Step 1: Normalize header names to lowercase
  const normalized = headers.map((h) => h.toLowerCase().trim().replace(/['"]/g, ''));

  // Step 2: Check for Spotify specific headers
  if (normalized.some((h) => h.includes('spotify') || (h.includes('streams') && h.includes('listeners')))) {
    return 'SPOTIFY';
  }

  // Step 3: Check for DistroKid specific headers
  if (normalized.some((h) => h.includes('distrokid') || h.includes('store') || h.includes('isrc'))) {
    return 'DISTROKID';
  }

  // Step 4: Default to generic CSV format
  return 'GENERIC_CSV';
}

/**
 * Splits a single CSV row safely respecting double quotes.
 *
 * @param line - Raw CSV row string
 * @param delimiter - Delimiter character
 * @returns Array of raw cell strings
 */
export function splitCsvRow(line: string, delimiter: ',' | ';'): string[] {
  // Step 1: Tokenize row characters respecting quotes
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current.trim());

  // Step 2: Strip surrounding quotes from cells
  return cells.map((cell) => cell.replace(/^"|"$/g, '').trim());
}

/**
 * Parses raw CSV content into validated StreamingCsvRow records without crashing on corrupt rows.
 *
 * @param rawCsv - Full text content of the uploaded CSV report
 * @param options - Optional configuration for default values
 * @returns CsvParseResult containing valid rows, errors, and metadata
 */
export function parseStreamingCsv(
  rawCsv: string,
  options: CsvParserOptions = {}
): CsvParseResult {
  // Step 1: Normalize line endings and filter empty lines
  const lines = rawCsv
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return {
      detectedSource: 'GENERIC_CSV',
      rows: [],
      errors: [{ rowIndex: 0, message: 'CSV vacío sin contenido', rawContent: '' }],
      totalRowsRead: 0,
    };
  }

  // Step 2: Parse headers and detect source dialect
  const delimiter = detectDelimiter(lines[0]);
  const headers = splitCsvRow(lines[0], delimiter);
  const detectedSource = detectSourcePlatform(headers);

  // Step 3: Map header names to column index
  const headerMap = new Map<string, number>();
  headers.forEach((h, index) => {
    headerMap.set(h.toLowerCase().trim().replace(/[^a-z0-9_]/g, ''), index);
  });

  const validRows: StreamingCsvRow[] = [];
  const errors: CsvParseIssue[] = [];

  // Step 4: Iterate and validate each data row
  for (let i = 1; i < lines.length; i++) {
    const rowLine = lines[i];
    const cells = splitCsvRow(rowLine, delimiter);

    try {
      const dateVal =
        cells[headerMap.get('date') ?? headerMap.get('metricdate') ?? headerMap.get('fecha') ?? 0] ||
        new Date().toISOString().slice(0, 10);
      const streamsVal = parseInt(
        cells[headerMap.get('streams') ?? headerMap.get('reproducciones') ?? 1] || '0',
        10
      );
      const listenersVal = parseInt(
        cells[headerMap.get('listeners') ?? headerMap.get('oyentes') ?? 2] || '0',
        10
      );
      const savesVal = parseInt(
        cells[headerMap.get('saves') ?? headerMap.get('guardados') ?? 3] || '0',
        10
      );
      const countryVal =
        cells[headerMap.get('country') ?? headerMap.get('countrycode') ?? headerMap.get('pais') ?? 4] ||
        options.defaultCountryCode ||
        'GLOBAL';
      const platformVal =
        cells[headerMap.get('platform') ?? headerMap.get('plataforma') ?? 5] ||
        options.fallbackPlatform ||
        detectedSource;

      const candidate = {
        metricDate: dateVal.slice(0, 10),
        streams: Number.isNaN(streamsVal) ? 0 : streamsVal,
        listeners: Number.isNaN(listenersVal) ? 0 : listenersVal,
        saves: Number.isNaN(savesVal) ? 0 : savesVal,
        countryCode: countryVal.toUpperCase(),
        platform: platformVal.toUpperCase(),
      };

      const parsed = StreamingCsvRowSchema.parse(candidate);
      validRows.push(parsed);
    } catch (err: unknown) {
      errors.push({
        rowIndex: i + 1,
        message: err instanceof Error ? err.message : 'Error al parsear fila',
        rawContent: rowLine,
      });
    }
  }

  // Step 5: Return structured parsing result
  return {
    detectedSource,
    rows: validRows,
    errors,
    totalRowsRead: lines.length - 1,
  };
}
