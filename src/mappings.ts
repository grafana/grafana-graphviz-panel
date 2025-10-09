import * as graphlibDot from 'graphlib-dot';
import { Graph } from 'graphlib';
import { EdgeMapping, NodeMapping, RuleKind } from './types';
import { DataDrivenColors, DataDrivenWidths } from './data';

/**
 * Applies edge mappings (static color rules) to the graph.
 * 
 * @param dotString - The DOT notation string to process
 * @param edgeMappings - Array of edge mappings to apply
 * @returns DOT string with edge mappings applied
 */
export function applyEdgeStyleMappings(dotString: string, edgeMappings: EdgeMapping[]): string {
  if (!edgeMappings || edgeMappings.length === 0) {
    return dotString;
  }

  const graph = graphlibDot.read(dotString);

  edgeMappings.forEach(mapping => {
    const colorRules = mapping.rules.filter(r => r.kind === RuleKind.STROKE_COLOR);
    
    colorRules.forEach(rule => {
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

/**
 * Applies node mappings (static color rules) to the graph.
 * 
 * @param dotString - The DOT notation string to process
 * @param nodeMappings - Array of node mappings to apply
 * @returns DOT string with node mappings applied
 */
export function applyNodeStyleMappings(dotString: string, nodeMappings: NodeMapping[]): string {
  return applyStyleMappings(dotString, nodeMappings);
}

/**
 * Applies all style mappings to a DOT string.
 * Handles DOT marshalling/unmarshalling and coordinates between different mapping types.
 */
function applyStyleMappings(dotString: string, nodeMappings: NodeMapping[]): string {
  const graph = graphlibDot.read(dotString);

  applyClusterStyleMappings(graph);
  applyUserNodeMappings(graph, nodeMappings);

  return graphlibDot.write(graph);
}

/**
 * Applies user-defined node mappings to the graph.
 */
function applyUserNodeMappings(graph: Graph, nodeMappings: NodeMapping[]): void {
  if (nodeMappings && nodeMappings.length > 0) {
    nodeMappings.forEach(mapping => {
      const colorRules = mapping.rules.filter(r => r.kind === RuleKind.STROKE_COLOR);
      
      colorRules.forEach(rule => {
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

  dataDrivenColors.nodeColors.forEach((color, nodeId) => {
    if (graph.hasNode(nodeId)) {
      const nodeData = graph.node(nodeId);
      graph.setNode(nodeId, {
        ...nodeData,
        color,
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
