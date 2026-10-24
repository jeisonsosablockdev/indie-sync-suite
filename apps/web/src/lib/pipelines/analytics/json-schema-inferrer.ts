/**
 * @file json-schema-inferrer.ts
 * @layer Domain
 * @description Invariant schema inference engine analyzing arbitrary JSON payloads from external
 *              endpoints to recommend KPI cards, time-series charts, and category distribution widgets.
 *              Zero network I/O, zero classes.
 */

import {
  InferredWidgetConfig,
  InferredWidgetConfigSchema,
} from './analytics-schemas';

/**
 * Checks if a string resembles an ISO or standard date format.
 *
 * @param val - Candidate string to inspect
 * @returns True if string matches date or timestamp format
 */
export function isDateLikeString(val: string): boolean {
  // Step 1: Regex test for YYYY-MM-DD or ISO-8601 timestamps
  const isoPattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/;
  return isoPattern.test(val);
}

/**
 * Infers appropriate dashboard widgets based on the structure and content of a JSON object or array.
 *
 * @param payload - Arbitrary parsed JSON structure
 * @returns Array of inferred InferredWidgetConfig definitions
 */
export function inferWidgetsFromPayload(payload: unknown): InferredWidgetConfig[] {
  const widgets: InferredWidgetConfig[] = [];

  // Step 1: Reject non-object or null payloads
  if (!payload || typeof payload !== 'object') {
    return [];
  }

  // Step 2: Handle Array payloads (likely time series or item lists)
  if (Array.isArray(payload)) {
    if (payload.length > 0 && typeof payload[0] === 'object' && payload[0] !== null) {
      const sample = payload[0] as Record<string, unknown>;
      const keys = Object.keys(sample);

      // Check for timestamp/date key alongside a numeric value key
      const dateKey = keys.find((k) => /date|time|timestamp|day/i.test(k));
      const numericKey = keys.find(
        (k) => typeof sample[k] === 'number' && !/id|code/i.test(k)
      );

      if (dateKey && numericKey) {
        widgets.push(
          InferredWidgetConfigSchema.parse({
            type: 'TIME_SERIES',
            title: `Evolución de ${numericKey}`,
            dataPath: `[].${numericKey}`,
            unit: 'unidades',
          })
        );
      }

      // Check for categorical label key alongside a numeric count
      const categoryKey = keys.find((k) => typeof sample[k] === 'string' && k !== dateKey);
      if (categoryKey && numericKey) {
        widgets.push(
          InferredWidgetConfigSchema.parse({
            type: 'CATEGORY_PIE',
            title: `Distribución por ${categoryKey}`,
            dataPath: `[].${categoryKey}`,
          })
        );
      }
    }
    return widgets;
  }

  // Step 3: Handle Record/Dictionary object payloads
  const record = payload as Record<string, unknown>;

  for (const [key, value] of Object.entries(record)) {
    // If value is a plain number, suggest a KPI card
    if (typeof value === 'number' && !/id|code|status/i.test(key)) {
      widgets.push(
        InferredWidgetConfigSchema.parse({
          type: 'KPI_CARD',
          title: key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()),
          dataPath: key,
          unit: /usd|spend|cost/i.test(key) ? 'USD' : undefined,
        })
      );
    }

    // If value is an array of objects, recursively infer time-series or category
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
      const item = value[0] as Record<string, unknown>;
      const dateKey = Object.keys(item).find((k) => /date|time|timestamp/i.test(k));
      const numKey = Object.keys(item).find((k) => typeof item[k] === 'number');

      if (dateKey && numKey) {
        widgets.push(
          InferredWidgetConfigSchema.parse({
            type: 'TIME_SERIES',
            title: `Serie: ${key}`,
            dataPath: `${key}[].${numKey}`,
          })
        );
      }
    }
  }

  // Step 4: Return collected widget recommendations
  return widgets;
}
