/**
 * @file sqlite-custom-dashboard-repository.ts
 * @layer Infrastructure
 * @description SQLite repository for autonomous dynamic custom API dashboards and inferred widgets
 *              (Modo Avanzado). Pure functional factory pattern, zero classes.
 */

import { DatabaseSync } from 'node:sqlite';

export type WidgetType = 'KPI_CARD' | 'TIME_SERIES' | 'CATEGORY_PIE';

export interface CustomApiDashboardRecord {
  id: string;
  releaseId: string;
  name: string;
  endpointUrl: string;
  authHeaderEncrypted?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomDashboardWidgetRecord {
  id: string;
  dashboardId: string;
  widgetType: WidgetType;
  title: string;
  dataPath: string;
  configJson?: string | null;
  orderIndex: number;
  createdAt: string;
}

export interface CreateCustomDashboardInput {
  id: string;
  releaseId: string;
  name: string;
  endpointUrl: string;
  authHeaderEncrypted?: string | null;
}

export interface CreateDashboardWidgetInput {
  id: string;
  dashboardId: string;
  widgetType: WidgetType;
  title: string;
  dataPath: string;
  configJson?: string | null;
  orderIndex?: number;
}

export interface CustomDashboardRepository {
  createDashboard: (input: CreateCustomDashboardInput) => Promise<CustomApiDashboardRecord>;
  getDashboardById: (id: string) => Promise<CustomApiDashboardRecord | null>;
  listDashboardsByReleaseId: (releaseId: string) => Promise<CustomApiDashboardRecord[]>;
  addWidget: (input: CreateDashboardWidgetInput) => Promise<CustomDashboardWidgetRecord>;
  listWidgetsByDashboardId: (dashboardId: string) => Promise<CustomDashboardWidgetRecord[]>;
  deleteDashboard: (id: string) => Promise<boolean>;
}

interface SqliteDashboardRow {
  id: string;
  release_id: string;
  name: string;
  endpoint_url: string;
  auth_header_encrypted: string | null;
  created_at: string;
  updated_at: string;
}

interface SqliteWidgetRow {
  id: string;
  dashboard_id: string;
  widget_type: WidgetType;
  title: string;
  data_path: string;
  config_json: string | null;
  order_index: number;
  created_at: string;
}

function mapDashboardRow(row: SqliteDashboardRow): CustomApiDashboardRecord {
  return {
    id: row.id,
    releaseId: row.release_id,
    name: row.name,
    endpointUrl: row.endpoint_url,
    authHeaderEncrypted: row.auth_header_encrypted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapWidgetRow(row: SqliteWidgetRow): CustomDashboardWidgetRecord {
  return {
    id: row.id,
    dashboardId: row.dashboard_id,
    widgetType: row.widget_type,
    title: row.title,
    dataPath: row.data_path,
    configJson: row.config_json,
    orderIndex: row.order_index,
    createdAt: row.created_at,
  };
}

/**
 * Functional factory instantiating the SQLite Custom Dashboard Repository.
 *
 * @param db - Native DatabaseSync instance
 * @returns Fully typed CustomDashboardRepository implementation
 */
export function createCustomDashboardRepository(db: DatabaseSync): CustomDashboardRepository {
  return {
    createDashboard: async (input: CreateCustomDashboardInput): Promise<CustomApiDashboardRecord> => {
      // Step 1: Insert dashboard record
      const stmt = db.prepare(`
        INSERT INTO custom_api_dashboards (
          id, release_id, name, endpoint_url, auth_header_encrypted,
          created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, datetime('now'), datetime('now')
        )
      `);
      stmt.run(input.id, input.releaseId, input.name, input.endpointUrl, input.authHeaderEncrypted ?? null);

      // Step 2: Fetch and return created record
      const selectStmt = db.prepare(`
        SELECT id, release_id, name, endpoint_url, auth_header_encrypted,
               created_at, updated_at
        FROM custom_api_dashboards
        WHERE id = ?
      `);
      const row = selectStmt.get(input.id) as unknown as SqliteDashboardRow | undefined;
      if (!row) {
        throw new Error(`Failed to create custom dashboard with id: ${input.id}`);
      }
      return mapDashboardRow(row);
    },

    getDashboardById: async (id: string): Promise<CustomApiDashboardRecord | null> => {
      // Step 1: Query dashboard by id
      const stmt = db.prepare(`
        SELECT id, release_id, name, endpoint_url, auth_header_encrypted,
               created_at, updated_at
        FROM custom_api_dashboards
        WHERE id = ?
      `);
      const row = stmt.get(id) as unknown as SqliteDashboardRow | undefined;
      if (!row) return null;
      return mapDashboardRow(row);
    },

    listDashboardsByReleaseId: async (releaseId: string): Promise<CustomApiDashboardRecord[]> => {
      // Step 1: Query dashboards by release
      const stmt = db.prepare(`
        SELECT id, release_id, name, endpoint_url, auth_header_encrypted,
               created_at, updated_at
        FROM custom_api_dashboards
        WHERE release_id = ?
        ORDER BY created_at DESC
      `);
      const rows = stmt.all(releaseId) as unknown as SqliteDashboardRow[];
      return rows.map(mapDashboardRow);
    },

    addWidget: async (input: CreateDashboardWidgetInput): Promise<CustomDashboardWidgetRecord> => {
      // Step 1: Insert widget definition
      const stmt = db.prepare(`
        INSERT INTO custom_dashboard_widgets (
          id, dashboard_id, widget_type, title, data_path,
          config_json, order_index, created_at
        ) VALUES (
          ?, ?, ?, ?, ?,
          ?, ?, datetime('now')
        )
      `);
      stmt.run(
        input.id,
        input.dashboardId,
        input.widgetType,
        input.title,
        input.dataPath,
        input.configJson ?? null,
        input.orderIndex ?? 0
      );

      // Step 2: Fetch and return created widget
      const selectStmt = db.prepare(`
        SELECT id, dashboard_id, widget_type, title, data_path,
               config_json, order_index, created_at
        FROM custom_dashboard_widgets
        WHERE id = ?
      `);
      const row = selectStmt.get(input.id) as unknown as SqliteWidgetRow | undefined;
      if (!row) {
        throw new Error(`Failed to add widget with id: ${input.id}`);
      }
      return mapWidgetRow(row);
    },

    listWidgetsByDashboardId: async (dashboardId: string): Promise<CustomDashboardWidgetRecord[]> => {
      // Step 1: Query widgets ordered by sequence
      const stmt = db.prepare(`
        SELECT id, dashboard_id, widget_type, title, data_path,
               config_json, order_index, created_at
        FROM custom_dashboard_widgets
        WHERE dashboard_id = ?
        ORDER BY order_index ASC, created_at ASC
      `);
      const rows = stmt.all(dashboardId) as unknown as SqliteWidgetRow[];
      return rows.map(mapWidgetRow);
    },

    deleteDashboard: async (id: string): Promise<boolean> => {
      // Step 1: Execute deletion
      const stmt = db.prepare(`DELETE FROM custom_api_dashboards WHERE id = ?`);
      const result = stmt.run(id);
      return Number(result.changes) > 0;
    },
  };
}
