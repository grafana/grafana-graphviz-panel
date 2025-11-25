import * as graphlibDot from 'graphlib-dot';
import { Graph } from 'graphlib';

export const VALID_SHAPES = [
  'box',
  'circle',
  'ellipse',
  'diamond',
  'triangle',
  'pentagon',
  'hexagon',
  'rectangle',
  'square',
  'oval',
  'cylinder',
  'note',
  'tab',
  'folder',
  'component',
  'octagon',
  'parallelogram',
  'trapezium',
];

export const getShapeOptions = () =>
  VALID_SHAPES.map((shape) => ({
    label: shape.charAt(0).toUpperCase() + shape.slice(1),
    value: shape,
  }));

export const formatEdgeId = (source: string, target: string) => `${source}__to__${target}`;

export const parseEdgeId = (id: string): [string, string] | null => {
  const parts = id.split('__to__');
  return parts.length === 2 ? [parts[0], parts[1]] : null;
};

export const toOptional = (value: string) => value || undefined;

export interface DrawNode {
  id: string;
  label?: string;
  shape?: string;
}

export interface DrawEdge {
  source: string;
  target: string;
  label?: string;
  id?: string;
}

export function parseNodesFromDot(dotString: string): DrawNode[] {
  try {
    const graph: Graph = graphlibDot.read(dotString);
    const nodes: DrawNode[] = [];

    graph.nodes().forEach((nodeId) => {
      const nodeData = graph.node(nodeId);
      nodes.push({
        id: nodeId,
        label: nodeData?.label,
        shape: nodeData?.shape,
      });
    });

    return nodes;
  } catch (error) {
    console.error('Error parsing nodes from DOT:', error);
    return [];
  }
}

export function parseEdgesFromDot(dotString: string): DrawEdge[] {
  try {
    const graph: Graph = graphlibDot.read(dotString);
    const edges: DrawEdge[] = [];

    graph.edges().forEach((edgeObj) => {
      const edgeData = graph.edge(edgeObj);
      edges.push({
        source: edgeObj.v,
        target: edgeObj.w,
        label: edgeData?.label,
        id: edgeData?.id,
      });
    });

    return edges;
  } catch (error) {
    console.error('Error parsing edges from DOT:', error);
    return [];
  }
}

export function isDirectedGraph(dotString: string): boolean {
  return /^\s*digraph/i.test(dotString);
}

export function getExistingEdgeIds(dotString: string): string[] {
  const edges = parseEdgesFromDot(dotString);
  const isDirected = isDirectedGraph(dotString);

  const edgeIds: string[] = [];

  edges.forEach((edge) => {
    const edgeId = `${edge.source}__to__${edge.target}`;
    edgeIds.push(edgeId);

    if (!isDirected) {
      const reverseEdgeId = `${edge.target}__to__${edge.source}`;
      edgeIds.push(reverseEdgeId);
    }
  });

  return edgeIds;
}

export function addNodeToDot(dotString: string, node: { id: string; label?: string; shape?: string }): string {
  try {
    const graph: Graph = graphlibDot.read(dotString);

    const nodeAttributes: any = {};
    if (node.label) {
      nodeAttributes.label = node.label;
    }
    if (node.shape) {
      nodeAttributes.shape = node.shape;
    }

    graph.setNode(node.id, nodeAttributes);

    return graphlibDot.write(graph);
  } catch (error) {
    console.error('Error adding node to DOT:', error);
    return dotString;
  }
}

export function updateNodeInDot(
  dotString: string,
  nodeId: string,
  updates: { label?: string; shape?: string }
): string {
  try {
    const graph: Graph = graphlibDot.read(dotString);

    const existingNode = graph.node(nodeId);
    if (!existingNode) {
      console.error(`Node ${nodeId} not found in graph`);
      return dotString;
    }

    const nodeAttributes: any = { ...existingNode };

    if (updates.label !== undefined) {
      if (updates.label) {
        nodeAttributes.label = updates.label;
      } else {
        delete nodeAttributes.label;
      }
    }

    if (updates.shape !== undefined) {
      if (updates.shape) {
        nodeAttributes.shape = updates.shape;
      } else {
        delete nodeAttributes.shape;
      }
    }

    graph.setNode(nodeId, nodeAttributes);

    return graphlibDot.write(graph);
  } catch (error) {
    console.error('Error updating node in DOT:', error);
    return dotString;
  }
}

export function updateEdgeInDot(
  dotString: string,
  source: string,
  target: string,
  updates: { id?: string; label?: string }
): string {
  try {
    const graph: Graph = graphlibDot.read(dotString);

    const existingEdge = graph.edge(source, target);
    if (!existingEdge) {
      console.error(`Edge from ${source} to ${target} not found in graph`);
      return dotString;
    }

    const edgeAttributes: any = { ...existingEdge };

    if (updates.id !== undefined) {
      if (updates.id) {
        edgeAttributes.id = updates.id;
      } else {
        delete edgeAttributes.id;
      }
    }

    if (updates.label !== undefined) {
      if (updates.label) {
        edgeAttributes.label = updates.label;
      } else {
        delete edgeAttributes.label;
      }
    }

    graph.setEdge(source, target, edgeAttributes);

    return graphlibDot.write(graph);
  } catch (error) {
    console.error('Error updating edge in DOT:', error);
    return dotString;
  }
}

export function addEdgeToDot(
  dotString: string,
  edge: { source: string; target: string; label?: string; id?: string },
  newTargetNode?: { id: string; label?: string; shape?: string }
): string {
  try {
    let graph: Graph = graphlibDot.read(dotString);

    if (newTargetNode) {
      const nodeAttributes: any = {};
      if (newTargetNode.label) {
        nodeAttributes.label = newTargetNode.label;
      }
      if (newTargetNode.shape) {
        nodeAttributes.shape = newTargetNode.shape;
      }
      graph.setNode(newTargetNode.id, nodeAttributes);
    }

    const edgeAttributes: any = {};
    if (edge.id) {
      edgeAttributes.id = edge.id;
    }
    if (edge.label) {
      edgeAttributes.label = edge.label;
    }

    graph.setEdge(edge.source, edge.target, edgeAttributes);

    return graphlibDot.write(graph);
  } catch (error) {
    console.error('Error adding edge to DOT:', error);
    return dotString;
  }
}

export function deleteNodeFromDot(dotString: string, nodeId: string): string {
  try {
    const graph: Graph = graphlibDot.read(dotString);

    graph.removeNode(nodeId);

    return graphlibDot.write(graph);
  } catch (error) {
    console.error('Error deleting node from DOT:', error);
    return dotString;
  }
}

export function deleteEdgeFromDot(dotString: string, source: string, target: string): string {
  try {
    const graph: Graph = graphlibDot.read(dotString);

    graph.removeEdge(source, target);

    return graphlibDot.write(graph);
  } catch (error) {
    console.error('Error deleting edge from DOT:', error);
    return dotString;
  }
}
