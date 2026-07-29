import { fromDot, toDot } from 'ts-graphviz';
import { findNodeById } from './utils/graphvizAst';

export const ALL_GRAPHVIZ_SHAPES = new Set([
  'box',
  // 'polygon', -- requires additional attributes (sides, skew, distortion) not currently supported
  'ellipse',
  // 'oval', -- NOTE: alias of ellipse
  'circle',
  'point',
  'egg',
  'triangle',
  'plaintext',
  // 'plain', -- NOTE: alias of plaintext (enforces zero margin)
  'diamond',
  'trapezium',
  'parallelogram',
  'house',
  'pentagon',
  'hexagon',
  'septagon',
  'octagon',
  'doublecircle',
  'doubleoctagon',
  'tripleoctagon',
  'invtriangle',
  'invtrapezium',
  'invhouse',
  'Mdiamond',
  'Msquare',
  'Mcircle',
  // 'rect', -- NOTE: alias of box
  // 'rectangle', -- NOTE: alias of box
  'square',
  'star',
  // 'none', -- NOTE: alias of plaintext
  'underline',
  'cylinder',
  'note',
  'tab',
  'folder',
  'box3d',
  'component',
  'promoter',
  'cds',
  'terminator',
  'utr',
  'primersite',
  'restrictionsite',
  'fivepoverhang',
  'threepoverhang',
  'noverhang',
  'assembly',
  'signature',
  'insulator',
  'ribosite',
  'rnastab',
  'proteasesite',
  'proteinstab',
  'rpromoter',
  'rarrow',
  'larrow',
  'lpromoter',
  // 'record',  -- requires special label syntax not currently supported
  // 'Mrecord', -- requires special label syntax not currently supported
]);

export const isValidShapeName = (name: string): boolean => ALL_GRAPHVIZ_SHAPES.has(name);

const SHAPE_LABELS: Record<string, string> = {
  box: 'Box',
  polygon: 'Polygon',
  ellipse: 'Ellipse',
  oval: 'Oval',
  circle: 'Circle',
  point: 'Point',
  egg: 'Egg',
  triangle: 'Triangle',
  plaintext: 'Plain text',
  plain: 'Plain',
  diamond: 'Diamond',
  trapezium: 'Trapezium',
  parallelogram: 'Parallelogram',
  house: 'House',
  pentagon: 'Pentagon',
  hexagon: 'Hexagon',
  septagon: 'Septagon',
  octagon: 'Octagon',
  doublecircle: 'Double circle',
  doubleoctagon: 'Double octagon',
  tripleoctagon: 'Triple octagon',
  invtriangle: 'Inverted triangle',
  invtrapezium: 'Inverted trapezium',
  invhouse: 'Inverted house',
  Mdiamond: 'Diamond with diagonals',
  Msquare: 'Square with diagonals',
  Mcircle: 'Circle with diagonals',
  rect: 'Rect',
  rectangle: 'Rectangle',
  square: 'Square',
  star: 'Star',
  none: 'None',
  underline: 'Underline',
  cylinder: 'Cylinder',
  note: 'Note',
  tab: 'Tab',
  folder: 'Folder',
  box3d: 'Box (3D)',
  component: 'Component',
  promoter: 'Promoter',
  cds: 'Coding sequence (CDS)',
  terminator: 'Terminator',
  utr: 'Untranslated region (UTR)',
  primersite: 'Primer site',
  restrictionsite: 'Restriction site',
  fivepoverhang: "5' overhang",
  threepoverhang: "3' overhang",
  noverhang: 'No overhang',
  assembly: 'Assembly',
  signature: 'Signature',
  insulator: 'Insulator',
  ribosite: 'Ribosome binding site',
  rnastab: 'RNA stability',
  proteasesite: 'Protease site',
  proteinstab: 'Protein stability',
  rpromoter: 'Right promoter',
  rarrow: 'Right arrow',
  larrow: 'Left arrow',
  lpromoter: 'Left promoter',
  record: 'Record',
  Mrecord: 'Record (rounded)',
};

export const getShapeOptions = () =>
  Array.from(ALL_GRAPHVIZ_SHAPES).map((shape) => ({
    label: SHAPE_LABELS[shape] ?? shape.charAt(0).toUpperCase() + shape.slice(1),
    value: shape,
  }));

export const formatEdgeId = (source: string, target: string, sourcePort?: string, targetPort?: string): string => {
  const sourceId = sourcePort ? `${source}:${sourcePort}` : source;
  const targetId = targetPort ? `${target}:${targetPort}` : target;
  return `${sourceId}__to__${targetId}`;
};

export const parseEdgeId = (
  id: string
): { source: string; sourcePort?: string; target: string; targetPort?: string } | null => {
  const parts = id.split('__to__');
  if (parts.length !== 2) {
    return null;
  }

  const parseNodeWithPort = (str: string): { node: string; port?: string } => {
    const colonIndex = str.indexOf(':');
    if (colonIndex === -1) {
      return { node: str };
    }
    return {
      node: str.substring(0, colonIndex),
      port: str.substring(colonIndex + 1),
    };
  };

  const sourceParsed = parseNodeWithPort(parts[0]);
  const targetParsed = parseNodeWithPort(parts[1]);

  return {
    source: sourceParsed.node,
    sourcePort: sourceParsed.port,
    target: targetParsed.node,
    targetPort: targetParsed.port,
  };
};

export const toOptional = (value: string) => value || undefined;

export interface DrawNode {
  id: string;
  label?: string;
  shape?: string;
}

export interface DrawEdge {
  source: string;
  sourcePort?: string;
  target: string;
  targetPort?: string;
  label?: string;
  id?: string;
}

export function parseNodesFromDot(dotString: string): DrawNode[] {
  try {
    const model = fromDot(dotString);
    const nodes: DrawNode[] = [];

    for (const node of model.nodes) {
      nodes.push({
        id: node.id,
        label: node.attributes.get('label'),
        shape: node.attributes.get('shape'),
      });
    }

    return nodes;
  } catch (error) {
    console.error('Error parsing nodes from DOT:', error);
    return [];
  }
}

export function parseEdgesFromDot(dotString: string): DrawEdge[] {
  try {
    const model = fromDot(dotString);
    const edges: DrawEdge[] = [];

    for (const edge of model.edges) {
      const targets: any[] = edge.targets;
      if (targets.length >= 2) {
        edges.push({
          source: targets[0].id,
          sourcePort: targets[0].port,
          target: targets[1].id,
          targetPort: targets[1].port,
          label: edge.attributes.get('label'),
          id: edge.attributes.get('id'),
        });
      }
    }

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

  for (const edge of edges) {
    const edgeId = formatEdgeId(edge.source, edge.target, edge.sourcePort, edge.targetPort);
    edgeIds.push(edgeId);

    if (!isDirected) {
      const reverseEdgeId = formatEdgeId(edge.target, edge.source, edge.targetPort, edge.sourcePort);
      edgeIds.push(reverseEdgeId);
    }
  }

  return edgeIds;
}

export function addNodeToDot(dotString: string, node: { id: string; label?: string; shape?: string }): string {
  try {
    const isEmpty = !dotString.trim();
    const model = isEmpty ? fromDot('digraph G {}') : fromDot(dotString);

    const newNode = model.createNode(node.id);
    if (node.label) {
      newNode.attributes.set('label', node.label);
    }
    if (node.shape) {
      newNode.attributes.set('shape', node.shape);
    }

    return toDot(model);
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
    const model = fromDot(dotString);

    const node = findNodeById(model, nodeId);
    if (!node) {
      console.error(`Node ${nodeId} not found in graph`);
      return dotString;
    }

    if (updates.label !== undefined) {
      if (updates.label) {
        node.attributes.set('label', updates.label);
      } else {
        node.attributes.delete('label');
      }
    }

    if (updates.shape !== undefined) {
      if (updates.shape) {
        node.attributes.set('shape', updates.shape);
      } else {
        node.attributes.delete('shape');
      }
    }

    return toDot(model);
  } catch (error) {
    console.error('Error updating node in DOT:', error);
    return dotString;
  }
}

export function updateEdgeInDot(
  dotString: string,
  source: string,
  target: string,
  updates: { id?: string; label?: string },
  sourcePort?: string,
  targetPort?: string
): string {
  try {
    const model = fromDot(dotString);

    let foundEdge: any = null;
    for (const edge of model.edges) {
      const targets: any[] = edge.targets;
      if (
        targets.length >= 2 &&
        targets[0].id === source &&
        targets[1].id === target &&
        targets[0].port === sourcePort &&
        targets[1].port === targetPort
      ) {
        foundEdge = edge;
        break;
      }
    }

    if (!foundEdge) {
      const portInfo = sourcePort || targetPort ? ` (with ports)` : '';
      console.error(`Edge from ${source} to ${target}${portInfo} not found in graph`);
      return dotString;
    }

    if (updates.id !== undefined) {
      if (updates.id) {
        foundEdge.attributes.set('id', updates.id);
      } else {
        foundEdge.attributes.delete('id');
      }
    }

    if (updates.label !== undefined) {
      if (updates.label) {
        foundEdge.attributes.set('label', updates.label);
      } else {
        foundEdge.attributes.delete('label');
      }
    }

    return toDot(model);
  } catch (error) {
    console.error('Error updating edge in DOT:', error);
    return dotString;
  }
}

export function addEdgeToDot(
  dotString: string,
  edge: { source: string; sourcePort?: string; target: string; targetPort?: string; label?: string; id?: string },
  newTargetNode?: { id: string; label?: string; shape?: string }
): string {
  try {
    const model = fromDot(dotString);

    if (newTargetNode) {
      const node = model.createNode(newTargetNode.id);
      if (newTargetNode.label) {
        node.attributes.set('label', newTargetNode.label);
      }
      if (newTargetNode.shape) {
        node.attributes.set('shape', newTargetNode.shape);
      }
    }

    const sourceTarget = edge.sourcePort ? `${edge.source}:${edge.sourcePort}` : edge.source;
    const targetTarget = edge.targetPort ? `${edge.target}:${edge.targetPort}` : edge.target;

    const newEdge = model.createEdge([sourceTarget, targetTarget]);
    if (edge.id) {
      newEdge.attributes.set('id', edge.id);
    }
    if (edge.label) {
      newEdge.attributes.set('label', edge.label);
    }

    return toDot(model);
  } catch (error) {
    console.error('Error adding edge to DOT:', error);
    return dotString;
  }
}

export function deleteNodeFromDot(dotString: string, nodeId: string): string {
  try {
    const model = fromDot(dotString);

    const node = findNodeById(model, nodeId);
    if (node) {
      model.removeNode(node as any);
    }

    return toDot(model);
  } catch (error) {
    console.error('Error deleting node from DOT:', error);
    return dotString;
  }
}

export function deleteEdgeFromDot(
  dotString: string,
  source: string,
  target: string,
  sourcePort?: string,
  targetPort?: string
): string {
  try {
    const model = fromDot(dotString);

    for (const edge of model.edges) {
      const targets: any[] = edge.targets;
      if (
        targets.length >= 2 &&
        targets[0].id === source &&
        targets[1].id === target &&
        targets[0].port === sourcePort &&
        targets[1].port === targetPort
      ) {
        model.removeEdge(edge);
        break;
      }
    }

    return toDot(model);
  } catch (error) {
    console.error('Error deleting edge from DOT:', error);
    return dotString;
  }
}
