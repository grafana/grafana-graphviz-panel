import { fromDot, toDot } from 'ts-graphviz';
import { DataFrame } from '@grafana/data';
import { EdgeOverride, NodeOverride, RuleKind } from '../../types';
import { findMatchedRow, getFirstDataRow } from '../../integrations/grafanaData';
import { interpolateLabelWithVariables, hasInterpolation, interpolateLabelIfNeeded } from '../interpolation';
import { getEdgeId, findNodeById } from '../utils/graphvizAst';

const NODE_FIELD_NAMES_TO_TRY = ['node_id', 'server', 'hostname', 'name', 'id'] as const;
const EDGE_FIELD_NAME_PRIMARY = 'edge_id';
const EDGE_FIELD_NAME_SECONDARY = 'link_id';
const EDGE_FIELD_NAME_TERTIARY = 'connection';

function applyLabelToNode(
  model: any,
  nodeId: string,
  labelRules: any[],
  dataRow: Record<string, any>,
  replaceVariables?: (value: string) => string
): void {
  const node = findNodeById(model, nodeId);
  if (!node) {
    return;
  }

  const currentLabel = node.attributes.get('label');
  let finalLabel = currentLabel;

  if (labelRules.length > 0 && labelRules[0].labelTemplate) {
    finalLabel = interpolateLabelWithVariables(labelRules[0].labelTemplate, dataRow, replaceVariables);
  } else if (currentLabel && hasInterpolation(currentLabel)) {
    finalLabel = interpolateLabelWithVariables(currentLabel, dataRow, replaceVariables);
  }

  if (finalLabel !== currentLabel) {
    node.attributes.set('label', finalLabel);
  }
}

function applyLabelToEdgeHelper(
  model: any,
  edgeId: string,
  labelRules: any[],
  dataRow: Record<string, any>,
  replaceVariables?: (value: string) => string
): void {
  for (const edge of model.edges) {
    const currentEdgeId = getEdgeId(edge);

    if (currentEdgeId === edgeId) {
      const currentLabel = edge.attributes.get('label');
      let finalLabel = currentLabel;

      if (labelRules.length > 0 && labelRules[0].labelTemplate) {
        finalLabel = interpolateLabelWithVariables(labelRules[0].labelTemplate, dataRow, replaceVariables);
      } else if (currentLabel && hasInterpolation(currentLabel)) {
        finalLabel = interpolateLabelWithVariables(currentLabel, dataRow, replaceVariables);
      }

      if (finalLabel !== currentLabel) {
        edge.attributes.set('label', finalLabel);
      }
      break;
    }
  }
}

export function applyDataDrivenNodeLabels(
  dotString: string,
  nodeOverrides: NodeOverride[],
  data: any,
  replaceVariables?: (value: string) => string
): string {
  if (!data.series || data.series.length === 0) {
    return dotString;
  }

  const model = fromDot(dotString);

  for (const mapping of nodeOverrides) {
    const labelRules = mapping.rules.filter((r) => r.kind === RuleKind.LABEL);

    mapping.targetNodeIds.forEach((nodeId: string) => {
      const matchValue = mapping.matchPattern ? mapping.matchPattern.replace(/\$\{id\}/g, nodeId) : mapping.matchValue;

      if (!matchValue || !mapping.matchFieldName) {
        return;
      }

      const dataRow = findMatchedRow(data.series, mapping.matchFieldName, matchValue);

      if (!dataRow) {
        return;
      }

      applyLabelToNode(model, nodeId, labelRules, dataRow, replaceVariables);
    });
  }

  return toDot(model);
}

export function applyDataDrivenEdgeLabels(
  dotString: string,
  edgeOverrides: EdgeOverride[],
  data: any,
  replaceVariables?: (value: string) => string
): string {
  if (!data.series || data.series.length === 0) {
    return dotString;
  }

  const model = fromDot(dotString);

  for (const mapping of edgeOverrides) {
    const labelRules = mapping.rules.filter((r) => r.kind === RuleKind.LABEL);

    mapping.targetEdgeIds.forEach((edgeId: string) => {
      const matchValue = mapping.matchPattern ? mapping.matchPattern.replace(/\$\{id\}/g, edgeId) : mapping.matchValue;

      if (!matchValue || !mapping.matchFieldName) {
        return;
      }

      const dataRow = findMatchedRow(data.series, mapping.matchFieldName, matchValue);

      if (!dataRow) {
        return;
      }

      applyLabelToEdgeHelper(model, edgeId, labelRules, dataRow, replaceVariables);
    });
  }

  return toDot(model);
}

export interface DataWithSeries {
  series: DataFrame[];
}

export function interpolateAllNodeLabels(
  dotString: string,
  data: DataWithSeries,
  replaceVariables?: (value: string) => string
): string {
  if (!data.series || data.series.length === 0) {
    return dotString;
  }

  const model = fromDot(dotString);

  for (const node of model.nodes) {
    const nodeId = node.id;
    const currentLabel = node.attributes.get('label');

    if (!currentLabel || !hasInterpolation(currentLabel)) {
      continue;
    }

    let dataRow: Record<string, any> | undefined;

    for (const fieldName of NODE_FIELD_NAMES_TO_TRY) {
      dataRow = findMatchedRow(data.series, fieldName, nodeId);
      if (dataRow) {
        break;
      }
    }

    if (!dataRow) {
      dataRow = getFirstDataRow(data.series);
      if (!dataRow) {
        continue;
      }
    }

    const interpolatedLabel = interpolateLabelIfNeeded(currentLabel, dataRow, replaceVariables);
    if (interpolatedLabel && interpolatedLabel !== currentLabel) {
      node.attributes.set('label', interpolatedLabel);
    }
  }

  return toDot(model);
}

export function interpolateAllEdgeLabels(
  dotString: string,
  data: DataWithSeries,
  replaceVariables?: (value: string) => string
): string {
  if (!data.series || data.series.length === 0) {
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

    let dataRow =
      findMatchedRow(data.series, EDGE_FIELD_NAME_PRIMARY, edgeId) ||
      findMatchedRow(data.series, EDGE_FIELD_NAME_SECONDARY, edgeId) ||
      findMatchedRow(data.series, EDGE_FIELD_NAME_TERTIARY, edgeId);

    if (!dataRow) {
      dataRow = getFirstDataRow(data.series);
      if (!dataRow) {
        continue;
      }
    }

    const interpolatedLabel = interpolateLabelIfNeeded(currentLabel, dataRow, replaceVariables);
    if (interpolatedLabel && interpolatedLabel !== currentLabel) {
      edge.attributes.set('label', interpolatedLabel);
    }
  }

  return toDot(model);
}
