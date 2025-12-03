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
import {
  EdgeOverride,
  NodeOverride,
  RuleKind,
  NamedThreshold,
  DataFormatStrategy,
  FieldMapping,
  MappingStrategy,
} from './types';

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
  nodeOverrides: NodeOverride[],
  edgeOverrides: EdgeOverride[],
  namedThresholds: NamedThreshold[],
  theme: GrafanaTheme2
): DataDrivenColors {
  const nodeBorderColors = new Map<string, string>();
  const nodeFillColors = new Map<string, string>();
  const edgeColors = new Map<string, string>();

  if (!data.series || data.series.length === 0) {
    return { nodeBorderColors, nodeFillColors, edgeColors };
  }

  nodeOverrides.forEach((mapping) => {
    const mappingStrategy = mapping.mappingStrategy || MappingStrategy.ROW;
    const borderColorRules = mapping.rules.filter((r) => r.kind === RuleKind.STROKE_COLOR);
    const fillColorRules = mapping.rules.filter((r) => r.kind === RuleKind.FILL_COLOR);

    if (mappingStrategy === MappingStrategy.FIELD && mapping.fieldMappings) {
      borderColorRules.forEach((rule) => {
        const colors = processFieldMappingColors(
          data.series,
          mapping.fieldMappings!,
          fieldConfig,
          namedThresholds,
          rule.thresholdId,
          theme
        );
        colors.forEach((color, nodeId) => {
          nodeBorderColors.set(nodeId, color);
        });
      });

      fillColorRules.forEach((rule) => {
        const colors = processFieldMappingColors(
          data.series,
          mapping.fieldMappings!,
          fieldConfig,
          namedThresholds,
          rule.thresholdId,
          theme
        );
        colors.forEach((color, nodeId) => {
          nodeFillColors.set(nodeId, color);
        });
      });
    } else {
      borderColorRules.forEach((rule) => {
        if (mapping.matchFieldName && rule.colorFieldName) {
          mapping.targetNodeIds.forEach((nodeId: string) => {
            const matchValue = mapping.matchPattern
              ? mapping.matchPattern.replace(/\$\{id\}/g, nodeId)
              : mapping.matchValue;

            if (matchValue && mapping.matchFieldName && rule.colorFieldName) {
              const color = extractColorValue(
                data.series,
                mapping.matchFieldName,
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
        if (mapping.matchFieldName && rule.colorFieldName) {
          mapping.targetNodeIds.forEach((nodeId: string) => {
            const matchValue = mapping.matchPattern
              ? mapping.matchPattern.replace(/\$\{id\}/g, nodeId)
              : mapping.matchValue;

            if (matchValue && mapping.matchFieldName && rule.colorFieldName) {
              const color = extractColorValue(
                data.series,
                mapping.matchFieldName,
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
    }
  });

  edgeOverrides.forEach((mapping) => {
    const colorRules = mapping.rules.filter((r) => r.kind === RuleKind.STROKE_COLOR);

    colorRules.forEach((rule) => {
      if (mapping.matchFieldName && rule.colorFieldName) {
        mapping.targetEdgeIds.forEach((edgeId: string) => {
          const matchValue = mapping.matchPattern
            ? mapping.matchPattern.replace(/\$\{id\}/g, edgeId)
            : mapping.matchValue;

          if (matchValue && mapping.matchFieldName && rule.colorFieldName) {
            const color = extractColorValue(
              data.series,
              mapping.matchFieldName,
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
export function processWidthRules(data: PanelData, edgeOverrides: EdgeOverride[]): DataDrivenWidths {
  const edgeWidths = new Map<string, number>();

  if (!data.series || data.series.length === 0) {
    return { edgeWidths };
  }

  edgeOverrides.forEach((mapping) => {
    const widthRules = mapping.rules.filter((r) => r.kind === RuleKind.STROKE_WIDTH);

    widthRules.forEach((rule) => {
      if (mapping.matchFieldName && rule.widthFieldName) {
        mapping.targetEdgeIds.forEach((edgeId: string) => {
          const matchValue = mapping.matchPattern
            ? mapping.matchPattern.replace(/\$\{id\}/g, edgeId)
            : mapping.matchValue;

          if (matchValue && mapping.matchFieldName && rule.widthFieldName) {
            const width = extractWidthValue(data.series, mapping.matchFieldName, matchValue, rule.widthFieldName);

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

function findMatchedRowFromWide(
  series: DataFrame[],
  matchFieldName: string,
  matchValue: string
): Record<string, any> | undefined {
  for (const frame of series) {
    const matchField = frame.fields.find((f) => f.name === matchFieldName);

    if (!matchField) {
      continue;
    }

    const view = new DataFrameView(frame);
    for (let i = 0; i < view.length; i++) {
      const row = view.get(i);
      if (String(row[matchFieldName]) === matchValue) {
        return row;
      }
    }
  }
  return undefined;
}

function findMatchedRowFromTimeSeries(
  series: DataFrame[],
  matchFieldName: string,
  matchValue: string
): Record<string, any> | undefined {
  for (const frame of series) {
    for (const field of frame.fields) {
      if (field.labels && field.labels[matchFieldName] === matchValue) {
        const row: Record<string, any> = {};

        if (field.labels) {
          Object.entries(field.labels).forEach(([key, value]) => {
            row[key] = value;
          });
        }

        if (field.values.length > 0) {
          row[field.name] = field.values[field.values.length - 1];
        }

        return row;
      }
    }
  }
  return undefined;
}

function findMatchedRowFromMixed(
  series: DataFrame[],
  matchFieldName: string,
  matchValue: string
): Record<string, any> | undefined {
  return (
    findMatchedRowFromTimeSeries(series, matchFieldName, matchValue) ||
    findMatchedRowFromWide(series, matchFieldName, matchValue)
  );
}

export function findMatchedRow(
  series: DataFrame[],
  matchFieldName: string,
  matchValue: string
): Record<string, any> | undefined {
  const strategy = detectDataFormatStrategy(series);

  switch (strategy) {
    case DataFormatStrategy.TIMESERIES:
      return findMatchedRowFromTimeSeries(series, matchFieldName, matchValue);

    case DataFormatStrategy.MIXED:
      return findMatchedRowFromMixed(series, matchFieldName, matchValue);

    case DataFormatStrategy.WIDE:
    default:
      return findMatchedRowFromWide(series, matchFieldName, matchValue);
  }
}

export interface MatchDetectionResult {
  matchFieldName: string;
  matchPercentage: number;
  matchedIds: string[];
  unmatchedIds: string[];
}

interface FieldMatchCandidate {
  fieldName: string;
  matchedIds: string[];
  unmatchedIds: string[];
  matchPercentage: number;
}

function findMatchingIdsInWide(
  series: DataFrame[],
  fieldName: string,
  targetIds: string[]
): { matchedIds: string[]; unmatchedIds: string[] } {
  const foundIds = new Set<string>();

  for (const frame of series) {
    const field = frame.fields.find((f) => f.name === fieldName);
    if (!field) {
      continue;
    }

    const view = new DataFrameView(frame);
    for (let i = 0; i < view.length; i++) {
      const row = view.get(i);
      const fieldValue = String(row[fieldName]);

      if (targetIds.includes(fieldValue)) {
        foundIds.add(fieldValue);
      }
    }
  }

  const matchedIds = targetIds.filter((id) => foundIds.has(id));
  const unmatchedIds = targetIds.filter((id) => !foundIds.has(id));

  return { matchedIds, unmatchedIds };
}

function findMatchingIdsInTimeSeries(
  series: DataFrame[],
  labelName: string,
  targetIds: string[]
): { matchedIds: string[]; unmatchedIds: string[] } {
  const foundIds = new Set<string>();

  for (const frame of series) {
    for (const field of frame.fields) {
      if (field.labels && field.labels[labelName]) {
        const labelValue = field.labels[labelName];
        if (targetIds.includes(labelValue)) {
          foundIds.add(labelValue);
        }
      }
    }
  }

  const matchedIds = targetIds.filter((id) => foundIds.has(id));
  const unmatchedIds = targetIds.filter((id) => !foundIds.has(id));

  return { matchedIds, unmatchedIds };
}

function extractAllStringFieldNames(series: DataFrame[]): string[] {
  const fieldNames = new Set<string>();

  series.forEach((frame) => {
    frame.fields?.forEach((field) => {
      if (field.name && field.type === 'string') {
        fieldNames.add(field.name);
      }

      if (field.labels) {
        Object.keys(field.labels).forEach((labelName) => {
          fieldNames.add(labelName);
        });
      }
    });
  });

  return Array.from(fieldNames).sort();
}

function evaluateFieldMatchQuality(
  series: DataFrame[],
  fieldName: string,
  targetIds: string[],
  strategy: DataFormatStrategy
): FieldMatchCandidate {
  let matchedIds: string[] = [];
  let unmatchedIds: string[] = [];

  if (strategy === DataFormatStrategy.TIMESERIES) {
    const result = findMatchingIdsInTimeSeries(series, fieldName, targetIds);
    matchedIds = result.matchedIds;
    unmatchedIds = result.unmatchedIds;
  } else if (strategy === DataFormatStrategy.WIDE) {
    const result = findMatchingIdsInWide(series, fieldName, targetIds);
    matchedIds = result.matchedIds;
    unmatchedIds = result.unmatchedIds;
  } else if (strategy === DataFormatStrategy.MIXED) {
    const timeSeriesResult = findMatchingIdsInTimeSeries(series, fieldName, targetIds);
    const wideResult = findMatchingIdsInWide(series, fieldName, targetIds);

    const combinedMatched = new Set([...timeSeriesResult.matchedIds, ...wideResult.matchedIds]);
    matchedIds = Array.from(combinedMatched);
    unmatchedIds = targetIds.filter((id) => !combinedMatched.has(id));
  }

  const matchPercentage = targetIds.length > 0 ? (matchedIds.length / targetIds.length) * 100 : 0;

  return {
    fieldName,
    matchedIds,
    unmatchedIds,
    matchPercentage,
  };
}

export function autodetectMatchField(series: DataFrame[], targetIds: string[]): MatchDetectionResult | undefined {
  if (!series || series.length === 0 || !targetIds || targetIds.length === 0) {
    return undefined;
  }

  const strategy = detectDataFormatStrategy(series);
  const availableFieldNames = extractAllStringFieldNames(series);

  if (availableFieldNames.length === 0) {
    return undefined;
  }

  const candidates: FieldMatchCandidate[] = availableFieldNames.map((fieldName) =>
    evaluateFieldMatchQuality(series, fieldName, targetIds, strategy)
  );

  const sortedCandidates = candidates.sort((a, b) => {
    if (b.matchPercentage !== a.matchPercentage) {
      return b.matchPercentage - a.matchPercentage;
    }
    return a.fieldName.localeCompare(b.fieldName);
  });

  const bestMatch = sortedCandidates[0];

  if (bestMatch && bestMatch.matchPercentage > 0) {
    return {
      matchFieldName: bestMatch.fieldName,
      matchPercentage: bestMatch.matchPercentage,
      matchedIds: bestMatch.matchedIds,
      unmatchedIds: bestMatch.unmatchedIds,
    };
  }

  return undefined;
}

export interface FieldMappingResult {
  fieldMappings: FieldMapping[];
  matchPercentage: number;
  matchedIds: string[];
  unmatchedIds: string[];
}

export function autodetectFieldMappings(series: DataFrame[], targetIds: string[]): FieldMappingResult | undefined {
  if (!series || series.length === 0 || !targetIds || targetIds.length === 0) {
    return undefined;
  }

  const fieldMappings: FieldMapping[] = [];
  const matchedIds: string[] = [];
  const unmatchedIds: string[] = [];

  const numericFields: Array<{ name: string; frameIndex: number }> = [];
  series.forEach((frame, frameIndex) => {
    frame.fields.forEach((field) => {
      if (field.type === FieldType.number) {
        numericFields.push({ name: field.name, frameIndex });
      }
    });
  });

  targetIds.forEach((nodeId) => {
    const match = numericFields.find((f) => f.name === nodeId);

    if (match) {
      fieldMappings.push({
        nodeId,
        fieldName: match.name,
        dataFrameIndex: match.frameIndex,
      });
      matchedIds.push(nodeId);
    } else {
      unmatchedIds.push(nodeId);
    }
  });

  const matchPercentage = targetIds.length > 0 ? (matchedIds.length / targetIds.length) * 100 : 0;

  if (matchedIds.length === 0) {
    return undefined;
  }

  return {
    fieldMappings,
    matchPercentage,
    matchedIds,
    unmatchedIds,
  };
}

export function processFieldMappingColors(
  series: DataFrame[],
  fieldMappings: FieldMapping[],
  fieldConfig: FieldConfigSource,
  namedThresholds: NamedThreshold[],
  thresholdId: string | undefined,
  theme: GrafanaTheme2
): Map<string, string> {
  const colors = new Map<string, string>();

  fieldMappings.forEach((fm) => {
    const frameIndex = fm.dataFrameIndex || 0;
    if (frameIndex >= series.length) {
      return;
    }

    const frame = series[frameIndex];
    const field = frame.fields.find((f) => f.name === fm.fieldName);

    if (!field || field.type !== FieldType.number) {
      return;
    }

    const latestValue = field.values[field.values.length - 1];
    if (latestValue == null) {
      return;
    }

    let color: string | undefined;

    if (thresholdId) {
      const threshold = namedThresholds.find((t) => t.id === thresholdId);
      if (threshold) {
        color = applyThresholdToValue(latestValue, threshold);
      }
    } else if (field.display) {
      const display = field.display(latestValue);
      color = display.color;
    } else if (fieldConfig.defaults.thresholds) {
      const thresholds = fieldConfig.defaults.thresholds.steps || [];
      const sortedThresholds = [...thresholds].sort((a, b) => (b.value || 0) - (a.value || 0));

      for (const step of sortedThresholds) {
        if (latestValue >= (step.value || 0)) {
          color = step.color;
          break;
        }
      }
    }

    if (color) {
      colors.set(fm.nodeId, color);
    }
  });

  return colors;
}
