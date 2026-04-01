import { fromDot, toDot } from 'ts-graphviz';
import { NodeOverride, RuleKind } from '../../types';
import { DataDrivenColors } from '../../integrations/grafanaData';
import { findNodeById, getEdgeId } from '../utils/graphvizAst';
import { addStyleToCommaList } from './color';
import { getEffectiveNodeAttribute } from '../utils/graphvizAttributes';

export function applyNodeStyleOverrides(dotString: string, nodeOverrides: NodeOverride[]): string {
  return applyStyleMappings(dotString, nodeOverrides);
}

function applyStyleMappings(dotString: string, nodeOverrides: NodeOverride[]): string {
  const model = fromDot(dotString);

  applyClusterStyleMappings(model);
  applyUserNodeOverrides(model, nodeOverrides);

  return toDot(model);
}

function applyUserNodeOverrides(model: any, nodeOverrides: NodeOverride[]): void {
  if (nodeOverrides && nodeOverrides.length > 0) {
    for (const mapping of nodeOverrides) {
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
              const existingStyle = getEffectiveNodeAttribute(node, model, 'style');
              const newStyle = addStyleToCommaList(existingStyle, 'filled');

              node.attributes.set('fillcolor', rule.staticColor);
              node.attributes.set('style', newStyle as any);
            }
          });
        }
      });
    }
  }
}

const CLUSTER_PREFIX = 'cluster_';
const DEFAULT_NODE_FONT_SIZE = '15';
const DEFAULT_NODE_WIDTH = '1.6';
const DEFAULT_NODE_HEIGHT = '0.8';
const DEFAULT_NODE_FONT_NAME = 'Arial';

function applyClusterStyleMappings(model: any): void {
  for (const node of model.nodes) {
    if (node.id.startsWith(CLUSTER_PREFIX)) {
      continue;
    }

    if (!node.attributes.get('fontsize')) {
      node.attributes.set('fontsize', DEFAULT_NODE_FONT_SIZE);
    }

    if (!node.attributes.get('width')) {
      node.attributes.set('width', DEFAULT_NODE_WIDTH);
    }
    if (!node.attributes.get('height')) {
      node.attributes.set('height', DEFAULT_NODE_HEIGHT);
    }

    // NOTE: margin is now set by applyGraphDefaults() in sanitization.ts
    // Don't override it here - graph-level defaults from sanitization should take precedence

    if (!node.attributes.get('fontname')) {
      node.attributes.set('fontname', DEFAULT_NODE_FONT_NAME);
    }
  }
}

export function applyDataDrivenColors(dotString: string, dataDrivenColors: DataDrivenColors): string {
  const model = fromDot(dotString);

  for (const [nodeId, color] of dataDrivenColors.nodeBorderColors) {
    const node = findNodeById(model, nodeId);
    if (node) {
      node.attributes.set('color', color);
    }
  }

  for (const [nodeId, color] of dataDrivenColors.nodeFillColors) {
    const node = findNodeById(model, nodeId);
    if (node) {
      const existingStyle = getEffectiveNodeAttribute(node, model, 'style');
      const newStyle = addStyleToCommaList(existingStyle, 'filled');

      node.attributes.set('fillcolor', color);
      node.attributes.set('style', newStyle as any);
    }
  }

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
