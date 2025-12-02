import * as graphlibDot from 'graphlib-dot';
import { Graph } from 'graphlib';
import { EdgeOverride, NodeOverride, RuleKind } from './types';
import { DataDrivenColors, DataDrivenWidths, findMatchedRow } from './data';
import { interpolateLabel, hasInterpolation } from './interpolation';

/**
 * Applies edge mappings (static color rules) to the graph.
 *
 * @param dotString - The DOT notation string to process
 * @param edgeOverrides - Array of edge mappings to apply
 * @returns DOT string with edge mappings applied
 */
export function applyEdgeStyleOverrides(dotString: string, edgeOverrides: EdgeOverride[]): string {
  if (!edgeOverrides || edgeOverrides.length === 0) {
    return dotString;
  }

  const graph = graphlibDot.read(dotString);

  edgeOverrides.forEach((mapping) => {
    const colorRules = mapping.rules.filter((r) => r.kind === RuleKind.STROKE_COLOR);

    colorRules.forEach((rule) => {
      if (rule.staticColor) {
        graph.edges().forEach((edgeObj) => {
          const edgeData = graph.edge(edgeObj);
          const edgeId = edgeData?.id || `${edgeObj.v}__to__${edgeObj.w}`;

          if (mapping.targetEdgeIds.includes(edgeId)) {
            graph.setEdge(edgeObj.v, edgeObj.w, {
              ...edgeData,
              color: rule.staticColor,
            });
          }
        });
      }
    });
  });

  return graphlibDot.write(graph);
}

export function applyNodeStyleOverrides(dotString: string, nodeOverrides: NodeOverride[]): string {
  return applyStyleMappings(dotString, nodeOverrides);
}

function applyLabelToNode(graph: Graph, nodeId: string, labelRules: any[], dataRow: Record<string, any>): void {
  if (!graph.hasNode(nodeId)) {
    return;
  }

  const nodeData = graph.node(nodeId);
  let finalLabel = nodeData.label;

  if (labelRules.length > 0 && labelRules[0].labelTemplate) {
    finalLabel = interpolateLabel(labelRules[0].labelTemplate, dataRow);
  } else if (nodeData.label && hasInterpolation(nodeData.label)) {
    finalLabel = interpolateLabel(nodeData.label, dataRow);
  }

  if (finalLabel !== nodeData.label) {
    graph.setNode(nodeId, {
      ...nodeData,
      label: finalLabel,
    });
  }
}

function applyLabelToEdge(graph: Graph, edgeId: string, labelRules: any[], dataRow: Record<string, any>): void {
  graph.edges().forEach((edgeObj) => {
    const edgeData = graph.edge(edgeObj);
    const currentEdgeId = edgeData?.id || `${edgeObj.v}__to__${edgeObj.w}`;

    if (currentEdgeId !== edgeId) {
      return;
    }

    let finalLabel = edgeData.label;

    if (labelRules.length > 0 && labelRules[0].labelTemplate) {
      finalLabel = interpolateLabel(labelRules[0].labelTemplate, dataRow);
    } else if (edgeData.label && hasInterpolation(edgeData.label)) {
      finalLabel = interpolateLabel(edgeData.label, dataRow);
    }

    if (finalLabel !== edgeData.label) {
      graph.setEdge(edgeObj.v, edgeObj.w, {
        ...edgeData,
        label: finalLabel,
      });
    }
  });
}

export function applyDataDrivenNodeLabels(dotString: string, nodeOverrides: NodeOverride[], data: any): string {
  if (!data.series || data.series.length === 0) {
    return dotString;
  }

  const graph = graphlibDot.read(dotString);

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

      applyLabelToNode(graph, nodeId, labelRules, dataRow);
    });
  });

  return graphlibDot.write(graph);
}

export function applyDataDrivenEdgeLabels(dotString: string, edgeOverrides: EdgeOverride[], data: any): string {
  if (!data.series || data.series.length === 0) {
    return dotString;
  }

  const graph = graphlibDot.read(dotString);

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

      applyLabelToEdge(graph, edgeId, labelRules, dataRow);
    });
  });

  return graphlibDot.write(graph);
}

/**
 * Applies all style mappings to a DOT string.
 * Handles DOT marshalling/unmarshalling and coordinates between different mapping types.
 */
function applyStyleMappings(dotString: string, nodeOverrides: NodeOverride[]): string {
  const graph = graphlibDot.read(dotString);

  applyClusterStyleMappings(graph);
  applyUserNodeOverrides(graph, nodeOverrides);

  return graphlibDot.write(graph);
}

/**
 * Applies user-defined node mappings to the graph.
 */
function applyUserNodeOverrides(graph: Graph, nodeOverrides: NodeOverride[]): void {
  if (nodeOverrides && nodeOverrides.length > 0) {
    nodeOverrides.forEach((mapping) => {
      const borderColorRules = mapping.rules.filter((r) => r.kind === RuleKind.STROKE_COLOR);
      const fillColorRules = mapping.rules.filter((r) => r.kind === RuleKind.FILL_COLOR);

      borderColorRules.forEach((rule) => {
        if (rule.staticColor) {
          mapping.targetNodeIds.forEach((nodeId: string) => {
            if (graph.hasNode(nodeId)) {
              const nodeData = graph.node(nodeId);
              graph.setNode(nodeId, {
                ...nodeData,
                color: rule.staticColor,
              });
            }
          });
        }
      });

      fillColorRules.forEach((rule) => {
        if (rule.staticColor) {
          mapping.targetNodeIds.forEach((nodeId: string) => {
            if (graph.hasNode(nodeId)) {
              const nodeData = graph.node(nodeId);
              // Preserve existing style (e.g. 'rounded') when adding 'filled'
              const existingStyle = nodeData.style || '';
              const newStyle = existingStyle.includes('filled') ? existingStyle : `${existingStyle ? existingStyle + ',' : ''}filled`;
              
              graph.setNode(nodeId, {
                ...nodeData,
                fillcolor: rule.staticColor,
                style: newStyle,
              });
            }
          });
        }
      });
    });
  }
}

/**
 * Applies cluster style mappings to all nodes for better readability and padding.
 * Sets reasonable font size, node dimensions, and margins to prevent text overflow
 * and improve visual appearance.
 */
function applyClusterStyleMappings(graph: Graph): void {
  graph.nodes().forEach((nodeId: string) => {
    if (nodeId.startsWith('cluster_')) {
      return;
    }

    const nodeData = graph.node(nodeId);
    if (nodeData) {
      const updatedData = { ...nodeData };

      if (!updatedData.fontsize) {
        updatedData.fontsize = '15';
      }

      if (!updatedData.width) {
        updatedData.width = '1.6';
      }
      if (!updatedData.height) {
        updatedData.height = '0.8';
      }

      if (!updatedData.margin) {
        updatedData.margin = '0.015,0.005';
      }

      if (!updatedData.fontname) {
        updatedData.fontname = 'Arial';
      }

      graph.setNode(nodeId, updatedData);
    }
  });
}

/**
 * Applies data-driven colors from field bindings to nodes and edges.
 * Data-driven colors override static colors.
 *
 * @param dotString - The DOT notation string to process
 * @param dataDrivenColors - Colors calculated from data fields and thresholds
 * @returns DOT string with data-driven colors applied
 */
export function applyDataDrivenColors(dotString: string, dataDrivenColors: DataDrivenColors): string {
  const graph = graphlibDot.read(dotString);

  dataDrivenColors.nodeBorderColors.forEach((color, nodeId) => {
    if (graph.hasNode(nodeId)) {
      const nodeData = graph.node(nodeId);
      graph.setNode(nodeId, {
        ...nodeData,
        color,
      });
    }
  });

  dataDrivenColors.nodeFillColors.forEach((color, nodeId) => {
    if (graph.hasNode(nodeId)) {
      const nodeData = graph.node(nodeId);
      // Preserve existing style (e.g. 'rounded') when adding 'filled'
      const existingStyle = nodeData.style || '';
      const newStyle = existingStyle.includes('filled') ? existingStyle : `${existingStyle ? existingStyle + ',' : ''}filled`;

      graph.setNode(nodeId, {
        ...nodeData,
        fillcolor: color,
        style: newStyle,
      });
    }
  });

  graph.edges().forEach((edgeObj) => {
    const edgeData = graph.edge(edgeObj);
    const edgeId = edgeData?.id || `${edgeObj.v}__to__${edgeObj.w}`;

    const color = dataDrivenColors.edgeColors.get(edgeId);
    if (color) {
      graph.setEdge(edgeObj.v, edgeObj.w, {
        ...edgeData,
        color,
      });
    }
  });

  return graphlibDot.write(graph);
}

/**
 * Applies data-driven widths from width rules to edges.
 *
 * @param dotString - The DOT notation string to process
 * @param dataDrivenWidths - Widths calculated from data fields
 * @returns DOT string with widths applied
 */
export function applyDataDrivenWidths(dotString: string, dataDrivenWidths: DataDrivenWidths): string {
  const graph = graphlibDot.read(dotString);

  graph.edges().forEach((edgeObj) => {
    const edgeData = graph.edge(edgeObj);
    const edgeId = edgeData?.id || `${edgeObj.v}__to__${edgeObj.w}`;

    const width = dataDrivenWidths.edgeWidths.get(edgeId);
    if (width !== undefined) {
      const clampedWidth = Math.min(Math.max(width, 0.1), 5);
      const arrowSize = Math.min(clampedWidth / 1.0, 1.5);

      graph.setEdge(edgeObj.v, edgeObj.w, {
        ...edgeData,
        penwidth: clampedWidth,
        arrowsize: arrowSize,
      });
    }
  });

  return graphlibDot.write(graph);
}
