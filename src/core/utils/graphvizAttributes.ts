export function getEffectiveNodeAttribute(node: any, model: any, attrName: string): string | null {
  const nodeValue = node.attributes.get(attrName);
  if (nodeValue != null) {
    return nodeValue;
  }

  const graphValue = model.attributes.node.get(attrName);
  if (graphValue != null) {
    return graphValue;
  }

  return null;
}

export function getEffectiveEdgeAttribute(edge: any, model: any, attrName: string): string | null {
  const edgeValue = edge.attributes.get(attrName);
  if (edgeValue != null) {
    return edgeValue;
  }

  const graphValue = model.attributes.edge.get(attrName);
  if (graphValue != null) {
    return graphValue;
  }

  return null;
}

export interface PenWidthMapping {
  valueMin?: number;
  valueMax?: number;
  widthMin: number;
  widthMax: number;
}

const HARD_MIN_WIDTH = 0;
const HARD_MAX_WIDTH = 50;

/**
 * Linearly maps a numeric field value to a Graphviz penwidth given a mapping
 * config. Values are clamped to [widthMin, widthMax] and the result is clamped
 * to [HARD_MIN_WIDTH, HARD_MAX_WIDTH] to prevent pathological rendering.
 * Returns null if the mapping cannot be computed (missing bounds, degenerate
 * range, non-finite input).
 */
export function mapValueToPenWidth(value: number, mapping: PenWidthMapping): number | null {
  if (!Number.isFinite(value)) {
    return null;
  }
  const { valueMin, valueMax, widthMin, widthMax } = mapping;
  if (valueMin == null || valueMax == null) {
    return null;
  }
  if (!Number.isFinite(valueMin) || !Number.isFinite(valueMax)) {
    return null;
  }
  if (!Number.isFinite(widthMin) || !Number.isFinite(widthMax)) {
    return null;
  }
  const range = valueMax - valueMin;
  if (range === 0) {
    const clamped = Math.min(Math.max(widthMin, HARD_MIN_WIDTH), HARD_MAX_WIDTH);
    return clamped;
  }
  const normalized = (value - valueMin) / range;
  const clampedNormalized = Math.min(Math.max(normalized, 0), 1);
  const width = widthMin + clampedNormalized * (widthMax - widthMin);
  return Math.min(Math.max(width, HARD_MIN_WIDTH), HARD_MAX_WIDTH);
}

/**
 * Extracts min/max value bounds across a set of fields. Prefers explicit
 * per-field min/max from `field.config`; falls back to the observed numeric
 * range across all provided values. Returns undefined for a bound if it
 * cannot be determined.
 */
export function resolveValueBounds(
  fields: Array<{ config?: { min?: number | null; max?: number | null }; values: unknown[] | ArrayLike<unknown> }>,
  explicit: { min?: number; max?: number }
): { min?: number; max?: number } {
  let min: number | undefined = explicit.min;
  let max: number | undefined = explicit.max;

  if (min != null && max != null) {
    return { min, max };
  }

  let observedMin = Number.POSITIVE_INFINITY;
  let observedMax = Number.NEGATIVE_INFINITY;
  let sawValue = false;

  for (const field of fields) {
    if (min == null && field.config?.min != null) {
      min = field.config.min;
    }
    if (max == null && field.config?.max != null) {
      max = field.config.max;
    }
    const values = field.values;
    const length = (values as ArrayLike<unknown>).length ?? 0;
    for (let i = 0; i < length; i++) {
      const num = Number((values as ArrayLike<unknown>)[i]);
      if (!Number.isFinite(num)) {
        continue;
      }
      if (num < observedMin) {
        observedMin = num;
      }
      if (num > observedMax) {
        observedMax = num;
      }
      sawValue = true;
    }
  }

  if (min == null && sawValue) {
    min = observedMin;
  }
  if (max == null && sawValue) {
    max = observedMax;
  }
  return { min, max };
}
