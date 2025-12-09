import * as graphlibDot from 'graphlib-dot';

export function isEmptyDiagram(dotDiagram: string): boolean {
  if (!dotDiagram || dotDiagram.trim() === '') {
    return true;
  }

  try {
    const graph = graphlibDot.read(dotDiagram);
    const nodes = graph.nodes();

    return nodes.length === 0;
  } catch {
    return false;
  }
}
