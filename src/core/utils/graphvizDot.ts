import { fromDot } from 'ts-graphviz';
import { LayoutEngine } from '../../types';

interface GraphContainer {
  nodes: Iterable<unknown>;
  edges: Iterable<unknown>;
  subgraphs?: Iterable<GraphContainer>;
}

﻿function hasGraphContent(graph: GraphContainer): boolean {
﻿  const hasNodes = Array.from(graph.nodes).length > 0;
﻿  const hasEdges = Array.from(graph.edges).length > 0;
﻿  if (hasNodes || hasEdges) {
﻿    return true;
﻿  }
﻿  
﻿  return Array.from(graph.subgraphs ?? [])
﻿    .some(hasGraphContent);
﻿  }

export function isEmptyDiagram(dotDiagram: string): boolean {
  if (!dotDiagram || dotDiagram.trim() === '') {
    return true;
  }

  try {
    const model = fromDot(dotDiagram);

    return !hasGraphContent(model);
  } catch {
    return false;
  }
}

export function isHtmlLabel(label: any): boolean {
  if (!label) {
    return false;
  }
  const str = String(label).trim();
  return /^<[A-Z]/.test(str);
}

export function isRecordLabel(label: any): boolean {
  if (!label) {
    return false;
  }
  return String(label).includes('|');
}

export function extractGraphContent(dotString: string): string {
  return dotString.replace(/^\s*(di)?graph\s+("[^"]*"|\w*)\s*\{/, '').replace(/}\s*$/, '');
}

export function buildGraphAttributes(layoutEngine: string, rankDirection?: string, splineType?: string): string[] {
  switch (layoutEngine) {
    case LayoutEngine.HIERARCHICAL:
      return [`rankdir=${rankDirection}`, `splines=${splineType}`];

    case LayoutEngine.NETWORK:
    case LayoutEngine.FORCE_DIRECTED:
    case LayoutEngine.CIRCULAR:
      return ['overlap="scalexy"', 'sep="+20"', `splines=${splineType}`];

    default:
      return [];
  }
}
