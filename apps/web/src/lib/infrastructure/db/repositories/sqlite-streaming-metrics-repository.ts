/**
 * @file sqlite-streaming-metrics-repository.ts
 * @layer Infrastructure
 * @description SQLite repository for streaming CSV reports, time-series metrics ingestion,
 *              and KPI aggregations. Pure functional factory pattern, zero classes.
 */

import { DatabaseSync } from 'node:sqlite';

export type StreamingSource = 'SPOTIFY' | 'APPLE_MUSIC' | 'DISTROKID' | 'GENERIC_CSV';

export interface StreamingReportRecord {
  id: string;
  releaseId: string;
  fileName: string;
  rowCount: number;
  sourcePlatform: StreamingSource;
  createdAt: string;
}

export interface StreamingMetricRecord {
  id: string;
  reportId?: string | null;
  releaseId: string;
  metricDate: string;
  streams: number;
  listeners: number;
  saves: number;
  countryCode: string;
  platform: string;
  createdAt: string;
}

export interface CreateReportInput {
  id: string;
  releaseId: string;
  fileName: string;
  rowCount: number;
  sourcePlatform: StreamingSource;
}

export interface StreamingMetricRowInput {
  id: string;
  metricDate: string;
  streams: number;
  listeners: number;
  saves: number;
  countryCode?: string;
  platform?: string;
}

export interface StreamingMetricsSummary {
  totalStreams: number;
  totalListeners: number;
  totalSaves: number;
  startDate: string | null;
  endDate: string | null;
  topCountries: Array<{ countryCode: string; streams: number }>;
}

export interface StreamingMetricsRepository {
  createReport: (input: CreateReportInput) => Promise<StreamingReportRecord>;
  ingestMetricsBatch: (reportId: string, releaseId: string, rows: StreamingMetricRowInput[]) => Promise<number>;
  getMetricsSummary: (releaseId: string, startDate?: string, endDate?: string) => Promise<StreamingMetricsSummary>;
  listMetricsByReleaseId: (releaseId: string) => Promise<StreamingMetricRecord[]>;
}

interface SqliteReportRow {
  id: string;
  release_id: string;
  file_name: string;
  row_count: number;
  source_platform: StreamingSource;
  created_at: string;
}

interface SqliteMetricRow {
  id: string;
  report_id: string | null;
  release_id: string;
  metric_date: string;
  streams: number;
  listeners: number;
  saves: number;
  country_code: string;
  platform: string;
  created_at: string;
}

function mapReportRow(row: SqliteReportRow): StreamingReportRecord {
  return {
    id: row.id,
    releaseId: row.release_id,
    fileName: row.file_name,
    rowCount: row.row_count,
    sourcePlatform: row.source_platform,
    createdAt: row.created_at,
  };
}

function mapMetricRow(row: SqliteMetricRow): StreamingMetricRecord {
  return {
    id: row.id,
    reportId: row.report_id,
    releaseId: row.release_id,
    metricDate: row.metric_date,
    streams: row.streams,
    listeners: row.listeners,
    saves: row.saves,
    countryCode: row.country_code,
    platform: row.platform,
    createdAt: row.created_at,
  };
}

/**
 * Functional factory instantiating the SQLite Streaming Metrics Repository.
 *
 * @param db - Native DatabaseSync instance
 * @returns Fully typed StreamingMetricsRepository implementation
 */
export function createStreamingMetricsRepository(db: DatabaseSync): StreamingMetricsRepository {
  return {
    createReport: async (input: CreateReportInput): Promise<StreamingReportRecord> => {
      // Step 1: Insert report header
      const stmt = db.prepare(`
        INSERT INTO streaming_reports (
          id, release_id, file_name, row_count, source_platform, created_at
        ) VALUES (
          ?, ?, ?, ?, ?, datetime('now')
        )
      `);

      stmt.run(input.id, input.releaseId, input.fileName, input.rowCount, input.sourcePlatform);

      // Step 2: Fetch created record
      const selectStmt = db.prepare(`
        SELECT id, release_id, file_name, row_count, source_platform, created_at
        FROM streaming_reports
        WHERE id = ?
      `);
      const row = selectStmt.get(input.id) as unknown as SqliteReportRow | undefined;
      if (!row) {
        throw new Error(`Failed to create streaming report for id: ${input.id}`);
      }
      return mapReportRow(row);
    },

    ingestMetricsBatch: async (
      reportId: string,
      releaseId: string,
      rows: StreamingMetricRowInput[]
    ): Promise<number> => {
      // Step 1: Execute batch insert in transactional context
      const insertStmt = db.prepare(`
        INSERT INTO streaming_metrics (
          id, report_id, release_id, metric_date, streams,
          listeners, saves, country_code, platform, created_at
        ) VALUES (
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, datetime('now')
        )
      `);

      let insertedCount = 0;
      for (const row of rows) {
        insertStmt.run(
          row.id,
          reportId,
          releaseId,
          row.metricDate,
          row.streams,
          row.listeners,
          row.saves,
          row.countryCode ?? 'GLOBAL',
          row.platform ?? 'SPOTIFY'
        );
        insertedCount++;
      }

      return insertedCount;
    },

    getMetricsSummary: async (
      releaseId: string,
      startDate?: string,
      endDate?: string
    ): Promise<StreamingMetricsSummary> => {
      // Step 1: Build aggregation query with optional date filters
      const conditions: string[] = ['release_id = ?'];
      const values: string[] = [releaseId];

      if (startDate) {
        conditions.push('metric_date >= ?');
        values.push(startDate);
      }
      if (endDate) {
        conditions.push('metric_date <= ?');
        values.push(endDate);
      }

      const summarySql = `
        SELECT
          COALESCE(SUM(streams), 0) as totalStreams,
          COALESCE(SUM(listeners), 0) as totalListeners,
          COALESCE(SUM(saves), 0) as totalSaves,
          MIN(metric_date) as startDate,
          MAX(metric_date) as endDate
        FROM streaming_metrics
        WHERE ${conditions.join(' AND ')}
      `;

      const summaryRow = db.prepare(summarySql).get(...values) as unknown as {
        totalStreams: number;
        totalListeners: number;
        totalSaves: number;
        startDate: string | null;
        endDate: string | null;
      };

      // Step 2: Query top countries breakdown
      const countriesSql = `
        SELECT country_code as countryCode, SUM(streams) as streams
        FROM streaming_metrics
        WHERE ${conditions.join(' AND ')}
        GROUP BY country_code
        ORDER BY streams DESC
        LIMIT 5
      `;
      const countryRows = db.prepare(countriesSql).all(...values) as unknown as Array<{
        countryCode: string;
        streams: number;
      }>;

      return {
        totalStreams: Number(summaryRow.totalStreams ?? 0),
        totalListeners: Number(summaryRow.totalListeners ?? 0),
        totalSaves: Number(summaryRow.totalSaves ?? 0),
        startDate: summaryRow.startDate,
        endDate: summaryRow.endDate,
        topCountries: countryRows,
      };
    },

    listMetricsByReleaseId: async (releaseId: string): Promise<StreamingMetricRecord[]> => {
      // Step 1: Query raw metric rows ordered chronologically
      const stmt = db.prepare(`
        SELECT id, report_id, release_id, metric_date, streams,
               listeners, saves, country_code, platform, created_at
        FROM streaming_metrics
        WHERE release_id = ?
        ORDER BY metric_date ASC
      `);
      const rows = stmt.all(releaseId) as unknown as SqliteMetricRow[];
      return rows.map(mapMetricRow);
    },
  };
}
