import * as graphlibDot from 'graphlib-dot';
import { EdgeStyleMapping, NodeStyleMapping } from './types';

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

