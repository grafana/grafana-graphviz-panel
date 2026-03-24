import { fromDot, toDot } from 'ts-graphviz';
import { EdgeOverride, NodeOverride, RuleKind } from './types';
import { DataDrivenColors, DataDrivenWidths, findMatchedRow } from './data';
import { interpolateLabelWithVariables, hasInterpolation } from './interpolation';
import { getEdgeId, findNodeById } from './utils/graphvizAst';

export function addStyleToCommaList(existingStyle: string | null, newStyle: string): string {
  const current = existingStyle || '';
  return current.includes(newStyle) ? current : `${current ? current + ',' : ''}${newStyle}`;
}

export function calculateEdgeWidthAndArrowSize(width: number): { width: number; arrowSize: number } {
  const clampedWidth = Math.min(Math.max(width, 0.1), 5);
  const arrowSize = Math.min(clampedWidth / 1.0, 1.5);
  return { width: clampedWidth, arrowSize };
}

export function applyEdgeStyleOverrides(dotString: string, edgeOverrides: EdgeOverride[]): string {
  if (!edgeOverrides || edgeOverrides.length === 0) {
    return dotString;
  }

  const model = fromDot(dotString);

  edgeOverrides.forEach((mapping) => {
    const colorRules = mapping.rules.filter((r) => r.kind === RuleKind.STROKE_COLOR);

    colorRules.forEach((rule) => {
      if (rule.staticColor) {
        for (const edge of model.edges) {
          const targets: any[] = edge.targets;
          for (let i = 0; i < targets.length - 1; i++) {
            const edgeId = getEdgeId(edge);

            if (edgeId && mapping.targetEdgeIds.includes(edgeId)) {
              edge.attributes.set('color', rule.staticColor);
            }
          }
        }
      }
    });
  });

  return toDot(model);
}

export function applyNodeStyleOverrides(dotString: string, nodeOverrides: NodeOverride[]): string {
  return applyStyleMappings(dotString, nodeOverrides);
}

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

  nodeOverrides.forEach((mapping) => {
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
  });

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

  edgeOverrides.forEach((mapping) => {
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
  });

  return toDot(model);
}

function applyStyleMappings(dotString: string, nodeOverrides: NodeOverride[]): string {
  const model = fromDot(dotString);

  applyClusterStyleMappings(model);
  applyUserNodeOverrides(model, nodeOverrides);

  return toDot(model);
}

function applyUserNodeOverrides(model: any, nodeOverrides: NodeOverride[]): void {
  if (nodeOverrides && nodeOverrides.length > 0) {
    nodeOverrides.forEach((mapping) => {
      const borderColorRules = mapping.rules.filter((r) => r.kind === RuleKind.STROKE_COLOR);
      const fillColorRules = mapping.rules.filter((r) => r.kind === RuleKind.FILL_COLOR);

      borderColorRules.forEach((rule) => {
        if (rule.staticColor) {
          mapping.targetNodeIds.forEach((nodeId: string) => {
            const node = findNodeById(model, nodeId);
            if (node) {
              node.attributes.set('color', rule.staticColor);
            }
          });
        }
      });

      fillColorRules.forEach((rule) => {
        if (rule.staticColor) {
          mapping.targetNodeIds.forEach((nodeId: string) => {
            const node = findNodeById(model, nodeId);
            if (node) {
              const existingStyle = node.attributes.get('style');
              const newStyle = addStyleToCommaList(existingStyle, 'filled');

              node.attributes.set('fillcolor', rule.staticColor);
              node.attributes.set('style', newStyle as any);
            }
          });
        }
      });
    });
  }
}

function applyClusterStyleMappings(model: any): void {
  for (const node of model.nodes) {
    if (node.id.startsWith('cluster_')) {
      continue;
    }

    if (!node.attributes.get('fontsize')) {
      node.attributes.set('fontsize', '15');
    }

    if (!node.attributes.get('width')) {
      node.attributes.set('width', '1.6');
    }
    if (!node.attributes.get('height')) {
      node.attributes.set('height', '0.8');
    }

    // NOTE: margin is now set by applyGraphDefaults() in sanitization.ts
    // Don't override it here - graph-level defaults from sanitization should take precedence

    if (!node.attributes.get('fontname')) {
      node.attributes.set('fontname', 'Arial');
    }
  }
}

export function applyDataDrivenColors(dotString: string, dataDrivenColors: DataDrivenColors): string {
  const model = fromDot(dotString);

  dataDrivenColors.nodeBorderColors.forEach((color, nodeId) => {
    const node = findNodeById(model, nodeId);
    if (node) {
      node.attributes.set('color', color);
    }
  });

  dataDrivenColors.nodeFillColors.forEach((color, nodeId) => {
    const node = findNodeById(model, nodeId);
    if (node) {
      const existingStyle = node.attributes.get('style');
      const newStyle = addStyleToCommaList(existingStyle, 'filled');

      node.attributes.set('fillcolor', color);
      node.attributes.set('style', newStyle as any);
    }
  });

  for (const edge of model.edges) {
    const edgeId = getEdgeId(edge);

    if (edgeId) {
      const color = dataDrivenColors.edgeColors.get(edgeId);
      if (color) {
        edge.attributes.set('color', color);
      }
    }
  }

  return toDot(model);
}

export function applyDataDrivenWidths(dotString: string, dataDrivenWidths: DataDrivenWidths): string {
  const model = fromDot(dotString);

  for (const edge of model.edges) {
    const edgeId = getEdgeId(edge);

    if (edgeId) {
      const width = dataDrivenWidths.edgeWidths.get(edgeId);
      if (width !== undefined) {
        const { width: clampedWidth, arrowSize } = calculateEdgeWidthAndArrowSize(width);

        edge.attributes.set('penwidth', clampedWidth);
        edge.attributes.set('arrowsize', arrowSize);
      }
    }
  }

  return toDot(model);
}
