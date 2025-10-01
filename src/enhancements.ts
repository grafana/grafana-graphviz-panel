import * as graphlibDot from 'graphlib-dot';
import { Graph } from 'graphlib';

/**
 * Derives and assigns IDs to edges that don't have them.
 * Generates IDs based on the source and target node names in the format: "source__to__target"
 * Preserves existing edge IDs.
 * 
 * @param dotString - The DOT notation string to process
 * @returns DOT string with edge IDs added to edges that didn't have them
 */
export function deriveEdgeIds(dotString: string): string {
  const graph = graphlibDot.read(dotString);
  
  addMissingEdgeIds(graph);
  
  return graphlibDot.write(graph);
}

/**
 * Adds IDs to edges in the graph that don't already have them.
 * Uses the graphlib API to iterate over edges and set attributes.
 */
function addMissingEdgeIds(graph: Graph): void {
  graph.edges().forEach((edgeObj) => {
    const edgeData = graph.edge(edgeObj);
    
    if (!edgeData?.id) {
      const derivedId = `${edgeObj.v}__to__${edgeObj.w}`;
      graph.setEdge(edgeObj.v, edgeObj.w, { ...edgeData, id: derivedId });
    }
  });
}

