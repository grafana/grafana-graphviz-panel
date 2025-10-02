import * as graphlibDot from 'graphlib-dot';
import { EdgeStyleMapping, NodeStyleMapping } from './types';
import { DataDrivenColors } from './data';

/**
 * Applies edge style mappings to the graph.
 * 
 * @param dotString - The DOT notation string to process
 * @param edgeMappings - Array of edge style mappings to apply
 * @returns DOT string with edge style mappings applied
 */
export function applyEdgeStyleMappings(dotString: string, edgeMappings: EdgeStyleMapping[]): string {
  if (!edgeMappings || edgeMappings.length === 0) {
    return dotString;
  }

  const graph = graphlibDot.read(dotString);

  edgeMappings.forEach(mapping => {
    graph.edges().forEach((edgeObj) => {
      const edgeData = graph.edge(edgeObj);
      const edgeId = edgeData?.id || `${edgeObj.v}__to__${edgeObj.w}`;

      if (mapping.targetEdgeIds.includes(edgeId)) {
        graph.setEdge(edgeObj.v, edgeObj.w, {
          ...edgeData,
          color: mapping.strokeColor,
        });
      }
    });
  });

  return graphlibDot.write(graph);
}

/**
 * Applies node style mappings to the graph.
 * 
 * @param dotString - The DOT notation string to process
 * @param nodeMappings - Array of node style mappings to apply
 * @returns DOT string with node style mappings applied
 */
export function applyNodeStyleMappings(dotString: string, nodeMappings: NodeStyleMapping[]): string {
  if (!nodeMappings || nodeMappings.length === 0) {
    return dotString;
  }

  const graph = graphlibDot.read(dotString);

  nodeMappings.forEach(mapping => {
    mapping.targetNodeIds.forEach(nodeId => {
      if (graph.hasNode(nodeId)) {
        const nodeData = graph.node(nodeId);
        graph.setNode(nodeId, {
          ...nodeData,
          color: mapping.strokeColor,
        });
      }
    });
  });

  return graphlibDot.write(graph);
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

