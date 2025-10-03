import * as graphlibDot from 'graphlib-dot';
import { Graph } from 'graphlib';

/**
 * Sanitizes DOT input by removing color-related attributes.
 * This ensures all colors come from either theme or style mappings, not from user DOT input.
 * 
 * @param dotString - The DOT notation string to sanitize
 * @returns DOT string with color attributes removed
 */
export function sanitizeDotColors(dotString: string): string {
  const graph = graphlibDot.read(dotString);
  
  removeColorAttributes(graph);
  
  return graphlibDot.write(graph);
}

/**
 * Removes color-related attributes from all nodes and edges in the graph.
 */
function removeColorAttributes(graph: Graph): void {
  const colorAttributes = [
    'color',
    'fillcolor',
    'fontcolor',
    'bgcolor',
    'pencolor',
  ];

  const styleAttributes = [
    'style',
  ];

  graph.nodes().forEach(nodeId => {
    const nodeData = graph.node(nodeId);
    if (nodeData) {
      const sanitized = { ...nodeData };
      colorAttributes.forEach(attr => delete sanitized[attr]);
      styleAttributes.forEach(attr => delete sanitized[attr]);
      graph.setNode(nodeId, sanitized);
    }
  });

  graph.edges().forEach(edgeObj => {
    const edgeData = graph.edge(edgeObj);
    if (edgeData) {
      const sanitized = { ...edgeData };
      colorAttributes.forEach(attr => delete sanitized[attr]);
      styleAttributes.forEach(attr => delete sanitized[attr]);
      graph.setEdge(edgeObj.v, edgeObj.w, sanitized);
    }
  });
}

