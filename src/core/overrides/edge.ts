import { fromDot, toDot } from 'ts-graphviz';
import { DataFrame, Field, GrafanaTheme2 } from '@grafana/data';
import { getEdgeId } from '../utils/graphvizAst';
import { findFieldForMark, readLatestValue } from '../../integrations/grafanaData';
import { interpolateLabelWithVariables, hasInterpolation } from '../interpolation';
import { mapValueToPenWidth, resolveValueBounds, PenWidthMapping } from '../utils/graphvizAttributes';

export const PEN_WIDTH_SCALE_MIN = 1;
export const PEN_WIDTH_SCALE_MAX = 10;

/**
 * Field-driven edge visuals.
 *
 * For each edge in the DOT model, looks up a same-named DataFrame field
 * (using the edge's derived ID such as `source__to__target`). When a match is
 * found, applies threshold-driven color from the field's display processor.
 * When edge pen-width scaling is enabled at the panel level, also applies a
 * data-driven `penwidth` computed via linear min->max scaling, with bounds
 * auto-detected across all edge-matching fields.
 */
export function applyFieldDrivenEdgeVisuals(
  dotString: string,
  series: DataFrame[],
  _theme: GrafanaTheme2,
  scalePenWidth?: boolean
): string {
  if (!series || series.length === 0) {
    return dotString;
  }

  const model = fromDot(dotString);
  const edgeFields = collectMarkFields(series, model.edges, (edge) => getEdgeId(edge) ?? '');
  const bounds = scalePenWidth ? resolveValueBounds(edgeFields, {}) : {};

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

    if (scalePenWidth) {
      const penWidth = computePenWidth(value, bounds);
      if (penWidth != null) {
        edge.attributes.set('penwidth', penWidth);
      }
    }
  }

  return toDot(model);
}

/**
 * Computes a Graphviz penwidth from a numeric field value using linear
 * scaling into the hard-coded output range [PEN_WIDTH_SCALE_MIN,
 * PEN_WIDTH_SCALE_MAX]. Returns null when scaling cannot be resolved.
 */
export function computePenWidth(value: unknown, bounds: { min?: number; max?: number }): number | null {
  const mapping: PenWidthMapping = {
    valueMin: bounds.min,
    valueMax: bounds.max,
    widthMin: PEN_WIDTH_SCALE_MIN,
    widthMax: PEN_WIDTH_SCALE_MAX,
  };
  return mapValueToPenWidth(Number(value), mapping);
}

/**
 * Collects the set of DataFrame fields that correspond to the marks
 * (nodes or edges) in the diagram. Used to compute a shared value range
 * across all marks that will share the pen-width scale.
 */
export function collectMarkFields<TMark>(
  series: DataFrame[],
  marks: Iterable<TMark>,
  getId: (mark: TMark) => string
): Field[] {
  const ids = new Set<string>();
  for (const mark of marks) {
    const id = getId(mark);
    if (id) {
      ids.add(id);
    }
  }
  const fields: Field[] = [];
  for (const frame of series) {
    for (const field of frame.fields) {
      if (ids.has(field.name)) {
        fields.push(field);
      }
    }
  }
  return fields;
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
