import { fromDot, toDot } from 'ts-graphviz';
import { DataFrame, GrafanaTheme2 } from '@grafana/data';
import { getEdgeId } from '../utils/graphvizAst';
import { findFieldForMark, readLatestValue } from '../../integrations/grafanaData';
import { interpolateLabelWithVariables, hasInterpolation } from '../interpolation';

const MIN_EDGE_WIDTH = 0.1;
const MAX_EDGE_WIDTH = 5;
const EDGE_WIDTH_DIVISOR = 1.0;
const MAX_ARROW_SIZE = 1.5;

export function calculateEdgeWidthAndArrowSize(width: number): { width: number; arrowSize: number } {
  const clampedWidth = Math.min(Math.max(width, MIN_EDGE_WIDTH), MAX_EDGE_WIDTH);
  const arrowSize = Math.min(clampedWidth / EDGE_WIDTH_DIVISOR, MAX_ARROW_SIZE);
  return { width: clampedWidth, arrowSize };
}

/**
 * Field-driven edge visuals.
 *
 * For each edge in the DOT model, looks up a same-named DataFrame field
 * (using the edge's derived ID such as `source__to__target`). When a match is
 * found, applies threshold-driven color from the field's display processor
 * and edge width from the field's numeric value.
 */
export function applyFieldDrivenEdgeVisuals(dotString: string, series: DataFrame[], _theme: GrafanaTheme2): string {
  if (!series || series.length === 0) {
    return dotString;
  }

  const model = fromDot(dotString);

  for (const edge of model.edges) {
    const edgeId = getEdgeId(edge);
    if (!edgeId) {
      continue;
    }
    const field = findFieldForMark(series, edgeId);
    if (!field) {
      continue;
    }
    const value = readLatestValue(field);
    if (value == null) {
      continue;
    }

    if (field.display) {
      const display = field.display(value);
      if (display.color) {
        edge.attributes.set('color', display.color);
      }
    }

    const numericValue = Number(value);
    if (Number.isFinite(numericValue)) {
      const { width, arrowSize } = calculateEdgeWidthAndArrowSize(numericValue);
      edge.attributes.set('penwidth', width);
      edge.attributes.set('arrowsize', arrowSize);
    }
  }

  return toDot(model);
}

/**
 * Interpolates existing edge labels that contain `${fieldName}` placeholders.
 */
export function applyFieldDrivenEdgeLabels(
  dotString: string,
  series: DataFrame[],
  replaceVariables?: (value: string) => string
): string {
  if (!series || series.length === 0) {
    return dotString;
  }

  const model = fromDot(dotString);

  for (const edge of model.edges) {
    const currentLabel = edge.attributes.get('label');
    if (!currentLabel || !hasInterpolation(currentLabel)) {
      continue;
    }
    const edgeId = getEdgeId(edge);
    if (!edgeId) {
      continue;
    }
    const field = findFieldForMark(series, edgeId);
    const context = buildLabelContext(field);
    const interpolated = interpolateLabelWithVariables(currentLabel, context, replaceVariables);
    if (interpolated !== currentLabel) {
      edge.attributes.set('label', interpolated);
    }
  }

  return toDot(model);
}

function buildLabelContext(field: import('@grafana/data').Field | undefined): Record<string, any> {
  const context: Record<string, any> = {};
  if (!field) {
    return context;
  }
  const value = readLatestValue(field);
  const displayed = field.display ? field.display(value) : undefined;
  context[field.name] = displayed?.text ?? (value == null ? '' : String(value));
  context.__value = displayed?.text ?? value;
  context.__field = field.name;
  context.__displayName = field.config?.displayName ?? field.name;
  if (field.labels) {
    for (const [key, val] of Object.entries(field.labels)) {
      context[key] = val;
    }
  }
  return context;
}
