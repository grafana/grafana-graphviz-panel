import { fromDot, toDot } from 'ts-graphviz';
import { DataFrame, GrafanaTheme2 } from '@grafana/data';
import { collectAllNodeIds, findNodeById } from '../utils/graphvizAst';
import { addStyleToCommaList } from './color';
import { getEffectiveNodeAttribute } from '../utils/graphvizAttributes';
import { findFieldForMark, readLatestValue } from '../../integrations/grafanaData';
import { interpolateLabelWithVariables, hasInterpolation } from '../interpolation';

const CLUSTER_PREFIX = 'cluster_';
const DEFAULT_NODE_FONT_SIZE = '15';
const DEFAULT_NODE_WIDTH = '1.6';
const DEFAULT_NODE_HEIGHT = '0.8';
const DEFAULT_NODE_FONT_NAME = 'Arial';

/**
 * Sets Graphviz cluster-level typography defaults that don't depend on data.
 * These are applied whether or not any data is present.
 */
export function applyNodeStyleDefaults(dotString: string): string {
  const model = fromDot(dotString);

  for (const node of model.nodes) {
    if (node.id.startsWith(CLUSTER_PREFIX)) {
      continue;
    }
    if (!node.attributes.get('fontsize')) {
      node.attributes.set('fontsize', DEFAULT_NODE_FONT_SIZE as any);
    }
    if (!node.attributes.get('width')) {
      node.attributes.set('width', DEFAULT_NODE_WIDTH as any);
    }
    if (!node.attributes.get('height')) {
      node.attributes.set('height', DEFAULT_NODE_HEIGHT as any);
    }
    if (!node.attributes.get('fontname')) {
      node.attributes.set('fontname', DEFAULT_NODE_FONT_NAME as any);
    }
  }

  return toDot(model);
}

/**
 * Field-driven node styling.
 *
 * For each node in the DOT model, looks up a same-named DataFrame field. When
 * a match is found, invokes the field's display processor (populated by
 * enhanceDataWithFieldConfig) and applies the resulting fill color. This is
 * the pure-fieldConfig path: threshold color, per-field overrides, unit, and
 * mappings all live on the field itself.
 */
export function applyFieldDrivenNodeVisuals(dotString: string, series: DataFrame[], _theme: GrafanaTheme2): string {
  if (!series || series.length === 0) {
    return dotString;
  }

  const model = fromDot(dotString);

  for (const nodeId of collectAllNodeIds(model)) {
    const field = findFieldForMark(series, nodeId);
    if (!field || !field.display) {
      continue;
    }
    const value = readLatestValue(field);
    if (value == null) {
      continue;
    }
    const display = field.display(value);
    if (!display.color) {
      continue;
    }

    const node = findNodeById(model, nodeId);
    if (!node) {
      continue;
    }
    const existingStyle = getEffectiveNodeAttribute(node, model, 'style');
    const newStyle = addStyleToCommaList(existingStyle, 'filled');
    node.attributes.set('fillcolor', display.color);
    node.attributes.set('style', newStyle as any);
  }

  return toDot(model);
}

/**
 * Interpolates existing node labels that contain `${fieldName}` placeholders.
 * Field lookups first check for a field whose name matches the node's ID; if
 * present, any of its labels or the field's own name may be referenced.
 */
export function applyFieldDrivenNodeLabels(
  dotString: string,
  series: DataFrame[],
  replaceVariables?: (value: string) => string
): string {
  if (!series || series.length === 0) {
    return dotString;
  }

  const model = fromDot(dotString);

  for (const node of model.nodes) {
    const currentLabel = node.attributes.get('label');
    if (!currentLabel || !hasInterpolation(currentLabel)) {
      continue;
    }

    const field = findFieldForMark(series, node.id);
    const context = buildLabelContext(field);
    const interpolated = interpolateLabelWithVariables(currentLabel, context, replaceVariables);
    if (interpolated !== currentLabel) {
      node.attributes.set('label', interpolated);
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
