import {
  PanelData,
  FieldConfigSource,
  GrafanaTheme2,
  DataFrame,
  FieldType,
  DataFrameView,
  isTimeSeriesFrame,
  FieldWithIndex,
} from '@grafana/data';
import { EdgeMapping, NodeMapping, RuleKind, NamedThreshold, DataFormatStrategy } from './types';

export interface DataDrivenColors {
  nodeBorderColors: Map<string, string>;
  nodeFillColors: Map<string, string>;
  edgeColors: Map<string, string>;
}

export interface DataDrivenWidths {
  edgeWidths: Map<string, number>;
}

/**
 * Detects the data format strategy based on the structure of the data frames.
 */
export function detectDataFormatStrategy(series: DataFrame[]): DataFormatStrategy {
  if (!series || series.length === 0) {
    return DataFormatStrategy.WIDE;
  }

  const hasTimeSeriesData = series.some((frame) => isTimeSeriesFrame(frame));
  const hasWideData = series.some((frame) => frame.fields.length > 1 && frame.length > 0);

  if (hasTimeSeriesData && hasWideData) {
    return DataFormatStrategy.MIXED;
  } else if (hasTimeSeriesData) {
    return DataFormatStrategy.TIMESERIES;
  } else {
    return DataFormatStrategy.WIDE;
  }
}

/**
 * Processes data field bindings from rules and applies thresholds to determine colors for nodes and edges.
 */
export function processDataFieldBindings(
  data: PanelData,
  fieldConfig: FieldConfigSource,
  nodeMappings: NodeMapping[],
  edgeMappings: EdgeMapping[],
  namedThresholds: NamedThreshold[],
  theme: GrafanaTheme2
): DataDrivenColors {
  const nodeBorderColors = new Map<string, string>();
  const nodeFillColors = new Map<string, string>();
  const edgeColors = new Map<string, string>();

  if (!data.series || data.series.length === 0) {
    return { nodeBorderColors, nodeFillColors, edgeColors };
  }

  nodeMappings.forEach((mapping) => {
    const borderColorRules = mapping.rules.filter((r) => r.kind === RuleKind.STROKE_COLOR);
    const fillColorRules = mapping.rules.filter((r) => r.kind === RuleKind.FILL_COLOR);

    borderColorRules.forEach((rule) => {
      if (rule.matchFieldName && rule.colorFieldName) {
        mapping.targetNodeIds.forEach((nodeId: string) => {
          const matchValue = rule.matchPattern ? rule.matchPattern.replace(/\$\{id\}/g, nodeId) : rule.matchValue;

          if (matchValue && rule.matchFieldName && rule.colorFieldName) {
            const color = extractColorValue(
              data.series,
              rule.matchFieldName,
              matchValue,
              rule.colorFieldName,
              fieldConfig,
              namedThresholds,
              rule.thresholdId,
              theme
            );

            if (color) {
              nodeBorderColors.set(nodeId, color);
            }
          }
        });
      }
    });

    fillColorRules.forEach((rule) => {
      if (rule.matchFieldName && rule.colorFieldName) {
        mapping.targetNodeIds.forEach((nodeId: string) => {
          const matchValue = rule.matchPattern ? rule.matchPattern.replace(/\$\{id\}/g, nodeId) : rule.matchValue;

          if (matchValue && rule.matchFieldName && rule.colorFieldName) {
            const color = extractColorValue(
              data.series,
              rule.matchFieldName,
              matchValue,
              rule.colorFieldName,
              fieldConfig,
              namedThresholds,
              rule.thresholdId,
              theme
            );

            if (color) {
              nodeFillColors.set(nodeId, color);
            }
          }
        });
      }
    });
  });

  edgeMappings.forEach((mapping) => {
    const colorRules = mapping.rules.filter((r) => r.kind === RuleKind.STROKE_COLOR);

    colorRules.forEach((rule) => {
      if (rule.matchFieldName && rule.colorFieldName) {
        mapping.targetEdgeIds.forEach((edgeId: string) => {
          const matchValue = rule.matchPattern ? rule.matchPattern.replace(/\$\{id\}/g, edgeId) : rule.matchValue;

          if (matchValue && rule.matchFieldName && rule.colorFieldName) {
            const color = extractColorValue(
              data.series,
              rule.matchFieldName,
              matchValue,
              rule.colorFieldName,
              fieldConfig,
              namedThresholds,
              rule.thresholdId,
              theme
            );

            if (color) {
              edgeColors.set(edgeId, color);
            }
          }
        });
      }
    });
  });

  return { nodeBorderColors, nodeFillColors, edgeColors };
}

/**
 * Processes width rules from edge mappings to determine stroke widths.
 */
export function processWidthRules(data: PanelData, edgeMappings: EdgeMapping[]): DataDrivenWidths {
  const edgeWidths = new Map<string, number>();

  if (!data.series || data.series.length === 0) {
    return { edgeWidths };
  }

  edgeMappings.forEach((mapping) => {
    const widthRules = mapping.rules.filter((r) => r.kind === RuleKind.STROKE_WIDTH);

    widthRules.forEach((rule) => {
      if (rule.matchFieldName && rule.widthFieldName) {
        mapping.targetEdgeIds.forEach((edgeId: string) => {
          const matchValue = rule.matchPattern ? rule.matchPattern.replace(/\$\{id\}/g, edgeId) : rule.matchValue;

          if (matchValue && rule.matchFieldName && rule.widthFieldName) {
            const width = extractWidthValue(data.series, rule.matchFieldName, matchValue, rule.widthFieldName);

            if (width !== undefined) {
              edgeWidths.set(edgeId, width);
            }
          }
        });
      } else if (rule.staticWidth !== undefined) {
        mapping.targetEdgeIds.forEach((edgeId: string) => {
          edgeWidths.set(edgeId, rule.staticWidth!);
        });
      }
    });
  });

  return { edgeWidths };
}

/**
 * Generic factory function that creates a finder for WIDE/table data.
 * Uses partial application to bind a processor function that transforms the found value.
 */
function createWideFinder<T>(processor: (value: number, field: FieldWithIndex) => T | undefined) {
  return (series: DataFrame[], matchFieldName: string, matchValue: string, valueFieldName: string): T | undefined => {
    for (const frame of series) {
      let matchFieldIndex = -1;
      let valueFieldIndex = -1;

      for (let i = 0; i < frame.fields.length; i++) {
        if (frame.fields[i].name === matchFieldName) {
          matchFieldIndex = i;
        }
        if (frame.fields[i].name === valueFieldName && frame.fields[i].type === FieldType.number) {
          valueFieldIndex = i;
        }
      }

      if (matchFieldIndex === -1 || valueFieldIndex === -1) {
        continue;
      }

      const valueField = frame.fields[valueFieldIndex];

      const view = new DataFrameView(frame);
      for (let i = 0; i < view.length; i++) {
        const row = view.get(i);
        if (String(row[matchFieldName]) === matchValue) {
          const numericValue = row[valueFieldName];
          if (numericValue != null) {
            const fieldWithIndex: FieldWithIndex = { ...valueField, index: valueFieldIndex };
            const result = processor(numericValue, fieldWithIndex);
            if (result !== undefined) {
              return result;
            }
          }
        }
      }
    }
    return undefined;
  };
}

/**
 * Extract width value from pure WIDE data (table rows).
 * Created via partial application of the wide finder.
 */
const extractWidthFromWide = createWideFinder<number>((value) => Number(value));

/**
 * Creates a color processor that applies thresholds and display transformations.
 */
function createColorProcessor(namedThresholds: NamedThreshold[], thresholdId: string | undefined) {
  return (value: number, field: FieldWithIndex): string | undefined => {
    if (thresholdId) {
      const threshold = namedThresholds.find((t) => t.id === thresholdId);
      if (threshold) {
        return applyThresholdToValue(value, threshold);
      }
    }

    const display = field.display ? field.display(value) : { color: undefined };
    return display.color;
  };
}

/**
 * Extract color value from pure WIDE data (table rows).
 * Creates a specialized finder with threshold context.
 */
function extractColorFromWide(
  series: DataFrame[],
  matchFieldName: string,
  matchValue: string,
  colorFieldName: string,
  fieldConfig: FieldConfigSource,
  namedThresholds: NamedThreshold[],
  thresholdId: string | undefined,
  theme: GrafanaTheme2
): string | undefined {
  const finder = createWideFinder<string>(createColorProcessor(namedThresholds, thresholdId));
  return finder(series, matchFieldName, matchValue, colorFieldName);
}

function applyThresholdToValue(value: number, threshold: NamedThreshold): string | undefined {
  const sortedSteps = [...threshold.steps].sort((a, b) => b.value - a.value);

  for (const step of sortedSteps) {
    if (value >= step.value) {
      return step.color;
    }
  }

  return sortedSteps[sortedSteps.length - 1]?.color;
}

/**
 * Extract color value from MIXED data (try TIMESERIES, fallback to WIDE).
 */
function extractColorFromMixed(
  series: DataFrame[],
  matchFieldName: string,
  matchValue: string,
  colorFieldName: string,
  fieldConfig: FieldConfigSource,
  namedThresholds: NamedThreshold[],
  thresholdId: string | undefined,
  theme: GrafanaTheme2
): string | undefined {
  const timeSeriesResult = extractColorFromTimeSeries(
    series,
    matchFieldName,
    matchValue,
    colorFieldName,
    namedThresholds,
    thresholdId
  );

  if (timeSeriesResult !== undefined) {
    return timeSeriesResult;
  }

  return extractColorFromWide(
    series,
    matchFieldName,
    matchValue,
    colorFieldName,
    fieldConfig,
    namedThresholds,
    thresholdId,
    theme
  );
}

/**
 * Central dispatcher for color extraction using explicit strategy pattern.
 */
function extractColorValue(
  series: DataFrame[],
  matchFieldName: string,
  matchValue: string,
  colorFieldName: string,
  fieldConfig: FieldConfigSource,
  namedThresholds: NamedThreshold[],
  thresholdId: string | undefined,
  theme: GrafanaTheme2
): string | undefined {
  const strategy = detectDataFormatStrategy(series);

  switch (strategy) {
    case DataFormatStrategy.TIMESERIES:
      return extractColorFromTimeSeries(
        series,
        matchFieldName,
        matchValue,
        colorFieldName,
        namedThresholds,
        thresholdId
      );

    case DataFormatStrategy.MIXED:
      return extractColorFromMixed(
        series,
        matchFieldName,
        matchValue,
        colorFieldName,
        fieldConfig,
        namedThresholds,
        thresholdId,
        theme
      );

    case DataFormatStrategy.WIDE:
    default:
      return extractColorFromWide(
        series,
        matchFieldName,
        matchValue,
        colorFieldName,
        fieldConfig,
        namedThresholds,
        thresholdId,
        theme
      );
  }
}

/**
 * Extract width value from MIXED data (try TIMESERIES, fallback to WIDE).
 */
function extractWidthFromMixed(
  series: DataFrame[],
  matchFieldName: string,
  matchValue: string,
  widthFieldName: string
): number | undefined {
  const timeSeriesResult = extractWidthFromTimeSeries(series, matchFieldName, matchValue, widthFieldName);

  if (timeSeriesResult !== undefined) {
    return timeSeriesResult;
  }

  return extractWidthFromWide(series, matchFieldName, matchValue, widthFieldName);
}

/**
 * Central dispatcher for width extraction using explicit strategy pattern.
 */
function extractWidthValue(
  series: DataFrame[],
  matchFieldName: string,
  matchValue: string,
  widthFieldName: string
): number | undefined {
  const strategy = detectDataFormatStrategy(series);

  switch (strategy) {
    case DataFormatStrategy.TIMESERIES:
      return extractWidthFromTimeSeries(series, matchFieldName, matchValue, widthFieldName);

    case DataFormatStrategy.MIXED:
      return extractWidthFromMixed(series, matchFieldName, matchValue, widthFieldName);

    case DataFormatStrategy.WIDE:
    default:
      return extractWidthFromWide(series, matchFieldName, matchValue, widthFieldName);
  }
}

/**
 * Generic factory function that creates a finder for TIMESERIES data.
 * Uses partial application to bind a processor function that transforms the found value.
 */
function createTimeSeriesFinder<T>(processor: (value: number, field: FieldWithIndex) => T | undefined) {
  return (series: DataFrame[], matchFieldName: string, matchValue: string, valueFieldName: string): T | undefined => {
    for (const frame of series) {
      for (let i = 0; i < frame.fields.length; i++) {
        const field = frame.fields[i];

        if (field.labels && field.labels[matchFieldName] === matchValue) {
          if (field.name === valueFieldName && field.type === FieldType.number) {
            const latestValue = field.values[field.values.length - 1];

            if (latestValue != null) {
              const fieldWithIndex: FieldWithIndex = { ...field, index: i };
              const result = processor(latestValue, fieldWithIndex);
              if (result !== undefined) {
                return result;
              }
            }
          }
        }
      }
    }
    return undefined;
  };
}

/**
 * Extract width value from pure TIMESERIES data (field.labels only).
 * Created via partial application of the time series finder.
 */
const extractWidthFromTimeSeries = createTimeSeriesFinder<number>((value) => Number(value));

/**
 * Extract color value from pure TIMESERIES data (field.labels only).
 * Creates a specialized finder with threshold context.
 */
function extractColorFromTimeSeries(
  series: DataFrame[],
  matchFieldName: string,
  matchValue: string,
  colorFieldName: string,
  namedThresholds: NamedThreshold[],
  thresholdId: string | undefined
): string | undefined {
  const finder = createTimeSeriesFinder<string>(createColorProcessor(namedThresholds, thresholdId));
  return finder(series, matchFieldName, matchValue, colorFieldName);
}
