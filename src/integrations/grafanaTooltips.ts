import { PanelData, TimeZone, dateTimeFormat } from '@grafana/data';
import { NodeOverride, EdgeOverride, RuleKind } from '../types';
import { findMatchedRow } from './grafanaData';
import { resolveTemplate, resolveDataLinks, ResolvedDataLink } from '../core/interpolation';

export interface TooltipData {
  title?: string;
  content: string;
  links: ResolvedDataLink[];
}

function parseEdgeId(edgeId: string): { source: string; target: string } {
  const parts = edgeId.split('__to__');
  return {
    source: parts[0] || '',
    target: parts[1] || '',
  };
}

export function resolveNodeTooltipData(
  nodeId: string,
  overrides: NodeOverride[],
  data: PanelData,
  replaceVariables: (str: string) => string,
  timeZone?: TimeZone
): TooltipData | null {
  const matchedOverrides = overrides.filter((o) => o.targetNodeIds.includes(nodeId));

  if (matchedOverrides.length === 0) {
    return null;
  }

  let lastTooltipRule = null;
  let lastRowData: Record<string, any> | null = null;
  let lastContext = null;

  for (const override of matchedOverrides) {
    const tooltipRule = override.rules.find((r) => r.kind === RuleKind.TOOLTIP);

    if (!tooltipRule) {
      continue;
    }

    const matchValue = override.matchPattern
      ? override.matchPattern.replace(/\$\{id\}/g, nodeId)
      : override.matchValue || nodeId;

    const hasFieldNameMatch = override.matchFieldName !== undefined;
    const rowData = hasFieldNameMatch ? findMatchedRow(data.series, override.matchFieldName!, matchValue) : {};
    const rowLookupFailed = !rowData && hasFieldNameMatch;

    if (rowLookupFailed) {
      continue;
    }

    lastTooltipRule = tooltipRule;
    lastRowData = rowData || null;
    lastContext = { nodeId };
  }

  if (!lastTooltipRule || !lastContext) {
    return null;
  }

  const contentTemplate = lastTooltipRule.content?.templates?.[0];
  const content = contentTemplate
    ? resolveTemplate(contentTemplate, lastRowData || {}, lastContext, replaceVariables)
    : '';

  const tooltipLinks = lastTooltipRule.footer?.links || [];
  const links = resolveDataLinks(tooltipLinks, lastRowData || {}, lastContext, replaceVariables);

  if (!content.trim() && links.length === 0) {
    return null;
  }

  let title: string | undefined;
  const showId = lastTooltipRule.header?.showId !== false;
  const showTimestamp = lastTooltipRule.header?.showTimestamp && lastRowData && lastRowData.Time !== undefined;

  if (showTimestamp || showId) {
    const titleParts: string[] = [];
    if (showTimestamp) {
      const formattedTime = dateTimeFormat(lastRowData!.Time, { timeZone });
      titleParts.push(`Time: ${formattedTime}`);
    }
    if (showId) {
      titleParts.push(`Node: ${nodeId}`);
    }
    title = titleParts.join('\n');
  }

  return {
    title,
    content,
    links,
  };
}

export function resolveEdgeTooltipData(
  edgeId: string,
  overrides: EdgeOverride[],
  data: PanelData,
  replaceVariables: (str: string) => string,
  timeZone?: TimeZone
): TooltipData | null {
  const matchedOverrides = overrides.filter((o) => o.targetEdgeIds.includes(edgeId));

  if (matchedOverrides.length === 0) {
    return null;
  }

  const { source, target } = parseEdgeId(edgeId);
  let lastTooltipRule = null;
  let lastRowData: Record<string, any> | null = null;
  let lastContext = null;

  for (const override of matchedOverrides) {
    const tooltipRule = override.rules.find((r) => r.kind === RuleKind.TOOLTIP);

    if (!tooltipRule) {
      continue;
    }

    const matchValue = override.matchPattern
      ? override.matchPattern.replace(/\$\{id\}/g, edgeId)
      : override.matchValue || edgeId;

    const hasFieldNameMatch = override.matchFieldName !== undefined;
    const rowData = hasFieldNameMatch ? findMatchedRow(data.series, override.matchFieldName!, matchValue) : {};
    const rowLookupFailed = !rowData && hasFieldNameMatch;

    if (rowLookupFailed) {
      continue;
    }

    lastTooltipRule = tooltipRule;
    lastRowData = rowData || null;
    lastContext = {
      edgeId,
      source,
      target,
    };
  }

  if (!lastTooltipRule || !lastContext) {
    return null;
  }

  const contentTemplate = lastTooltipRule.content?.templates?.[0];
  const content = contentTemplate
    ? resolveTemplate(contentTemplate, lastRowData || {}, lastContext, replaceVariables)
    : '';

  const tooltipLinks = lastTooltipRule.footer?.links || [];
  const links = resolveDataLinks(tooltipLinks, lastRowData || {}, lastContext, replaceVariables);

  if (!content.trim() && links.length === 0) {
    return null;
  }

  let title: string | undefined;
  const showId = lastTooltipRule.header?.showId !== false;
  const showTimestamp = lastTooltipRule.header?.showTimestamp && lastRowData && lastRowData.Time !== undefined;

  if (showTimestamp || showId) {
    const titleParts: string[] = [];
    if (showTimestamp) {
      const formattedTime = dateTimeFormat(lastRowData!.Time, { timeZone });
      titleParts.push(`Time: ${formattedTime}`);
    }
    if (showId) {
      titleParts.push(`Edge: ${source} → ${target}`);
    }
    title = titleParts.join('\n');
  }

  return {
    title,
    content,
    links,
  };
}
