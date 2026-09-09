import {
  DataFrame,
  Field,
  FieldConfigSource,
  FieldType,
  GrafanaTheme2,
  InterpolateFunction,
  PanelData,
  applyFieldOverrides,
} from '@grafana/data';

const BYTES_PER_KB = 1024;
const DEFAULT_MAX_DOT_SIZE = BYTES_PER_KB * BYTES_PER_KB;

/**
 * Runs Grafana's applyFieldOverrides against PanelData so that every field
 * gains a fully-resolved `field.display` function that honors panel-level
 * fieldConfig.defaults and fieldConfig.overrides (thresholds, color mode,
 * unit, mappings, no-value, display name, decimals).
 *
 * Grafana does not populate `field.display` automatically for panel plugins;
 * every stock panel calls this itself. Without it, threshold-driven color
 * defined under Standard options never reaches the render pipeline.
 */
export function enhanceDataWithFieldConfig(
  data: PanelData,
  fieldConfig: FieldConfigSource | undefined,
  theme: GrafanaTheme2,
  replaceVariables?: InterpolateFunction
): PanelData {
  if (!data.series || data.series.length === 0) {
    return data;
  }

  try {
    const enhancedSeries = applyFieldOverrides({
      data: data.series,
      fieldConfig: fieldConfig ?? { defaults: {}, overrides: [] },
      theme,
      replaceVariables: replaceVariables ?? ((value: string) => value),
    });
    return { ...data, series: enhancedSeries };
  } catch {
    return data;
  }
}

/**
 * Finds the DataFrame field whose `name` matches the given mark ID (a node ID
 * or an edge ID such as `source__to__target`). Returns undefined if nothing
 * matches. Assumes wide-format data where each field represents a single mark.
 */
export function findFieldForMark(series: DataFrame[], markId: string): Field | undefined {
  for (const frame of series) {
    for (const field of frame.fields) {
      if (field.name === markId) {
        return field;
      }
    }
  }
  return undefined;
}

/**
 * Reads the most recent scalar value from a field. Wide-format data is
 * expected to be reduced (one value per field); when a field carries multiple
 * values we take the last non-null.
 */
export function readLatestValue(field: Field | undefined): unknown {
  if (!field || !field.values || field.values.length === 0) {
    return undefined;
  }
  for (let i = field.values.length - 1; i >= 0; i--) {
    const value = field.values[i];
    if (value != null) {
      return value;
    }
  }
  return undefined;
}

/**
 * Locates a string field by name across the provided frames and returns its
 * most recent value. Used to extract a DOT diagram string from a data query.
 */
export function findWideFormatFieldValue(frames: DataFrame[], fieldName: string): string | null {
  for (const frame of frames) {
    const dotField = frame.fields.find((f) => f.name === fieldName && f.type === FieldType.string);
    if (dotField && dotField.values.length > 0) {
      const lastValue = dotField.values[dotField.values.length - 1];
      return typeof lastValue === 'string' ? lastValue : null;
    }
  }
  return null;
}

export function validateDotSize(dotValue: string, maxSizeBytes: number): void {
  if (dotValue.length > maxSizeBytes) {
    throw new Error(
      `DOT diagram too large: ${(dotValue.length / BYTES_PER_KB).toFixed(1)} KB exceeds limit of ${(
        maxSizeBytes / BYTES_PER_KB
      ).toFixed(0)} KB`
    );
  }
}

export function extractDotFromQuery(
  series: DataFrame[],
  fieldName: string,
  maxSizeBytes: number = DEFAULT_MAX_DOT_SIZE
): string | null {
  if (!series || series.length === 0 || !fieldName) {
    return null;
  }

  const dotValue = findWideFormatFieldValue(series, fieldName);
  if (dotValue && typeof dotValue === 'string') {
    validateDotSize(dotValue, maxSizeBytes);
    return dotValue;
  }

  return null;
}
