import { DataFrame, Field, InterpolateFunction, TimeZone, dateTimeFormat } from '@grafana/data';
import { findFieldForMark, readLatestValue } from './grafanaData';
import { ResolvedDataLink } from '../core/interpolation';

const INTERPOLATION_REGEX = /\$\{([^}]+)\}/g;

export interface TooltipData {
  title?: string;
  content: string;
  links: ResolvedDataLink[];
}

function parseEdgeId(edgeId: string): { source: string; target: string } {
  const parts = edgeId.split('__to__');
  return { source: parts[0] || '', target: parts[1] || '' };
}

function buildContext(field: Field | undefined, reserved: Record<string, string>): Record<string, unknown> {
  const context: Record<string, unknown> = { ...reserved };
  if (!field) {
    return context;
  }
  const value = readLatestValue(field);
  const display = field.display ? field.display(value) : undefined;
  context[field.name] = display?.text ?? (value == null ? '' : String(value));
  context.__value = display?.text ?? value;
  context.__field = field.name;
  context.__displayName = field.config?.displayName ?? field.name;
  if (field.labels) {
    for (const [key, val] of Object.entries(field.labels)) {
      context[key] = val;
    }
  }
  return context;
}

function interpolate(
  template: string,
  context: Record<string, unknown>,
  replaceVariables?: InterpolateFunction
): string {
  let result = template;
  if (replaceVariables) {
    result = replaceVariables(result);
  }
  return result.replace(INTERPOLATION_REGEX, (_match, key) => {
    const value = context[key];
    if (value == null) {
      return '';
    }
    return String(value);
  });
}

/**
 * Resolves tooltip content for a node using a panel-level template. The
 * template can reference `${__value}`, `${__field}`, `${__displayName}`,
 * `${__nodeId}`, and any field labels or the field's own name.
 */
export function resolveNodeTooltipData(
  nodeId: string,
  template: string | undefined,
  series: DataFrame[],
  replaceVariables?: InterpolateFunction,
  timeZone?: TimeZone
): TooltipData | null {
  if (!template || template.trim().length === 0) {
    return null;
  }

  const field = findFieldForMark(series, nodeId);
  const value = field ? readLatestValue(field) : undefined;
  const context = buildContext(field, { __nodeId: nodeId });

  const content = interpolate(template, context, replaceVariables);
  if (!content.trim()) {
    return null;
  }

  const titleParts = [`Node: ${nodeId}`];
  if (field && typeof value === 'number' && value != null) {
    // Include time hint only if labels contain a Time entry (rare in wide form)
    const timeLabel = field.labels?.Time;
    if (timeLabel) {
      titleParts.unshift(`Time: ${dateTimeFormat(timeLabel, { timeZone })}`);
    }
  }

  return {
    title: titleParts.join('\n'),
    content,
    links: [],
  };
}

/**
 * Resolves tooltip content for an edge using a panel-level template.
 * Supports `${__edgeId}`, `${__source}`, `${__target}` reserved placeholders.
 */
export function resolveEdgeTooltipData(
  edgeId: string,
  template: string | undefined,
  series: DataFrame[],
  replaceVariables?: InterpolateFunction,
  _timeZone?: TimeZone
): TooltipData | null {
  if (!template || template.trim().length === 0) {
    return null;
  }

  const { source, target } = parseEdgeId(edgeId);
  const field = findFieldForMark(series, edgeId);
  const context = buildContext(field, { __edgeId: edgeId, __source: source, __target: target });

  const content = interpolate(template, context, replaceVariables);
  if (!content.trim()) {
    return null;
  }

  return {
    title: `Edge: ${source} \u2192 ${target}`,
    content,
    links: [],
  };
}
