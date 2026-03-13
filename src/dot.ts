import { Graphviz } from '@hpcc-js/wasm';
import { extractGraphContent, buildGraphAttributes } from './utils/graphvizDot';
import { isDirectedGraph } from './builderMode';

/**
 * Renders a DOT diagram to SVG format.
 *
 * @param dotDiagram - The DOT notation string to render
 * @param layoutEngine - The Graphviz layout engine to use
 * @param rankDirection - The direction of the graph layout (TB, BT, LR, RL) - only for dot engine
 * @param splineType - The spline type for edges (ortho, polyline, true)
 * @returns Promise that resolves to the SVG string
 */
export async function renderDotToSvg(
  dotDiagram: string,
  layoutEngine: string,
  rankDirection?: string,
  splineType?: string
): Promise<string> {
  const graphviz = await Graphviz.load();

  let processedDot = dotDiagram;

  if (rankDirection || splineType) {
    const directed = isDirectedGraph(dotDiagram);
    const graphType = directed ? 'digraph' : 'graph';
    const graphContent = extractGraphContent(dotDiagram);
    const attributes = buildGraphAttributes(layoutEngine, rankDirection, splineType);

    processedDot = `${graphType} G {\n  ${attributes.join(';\n  ')};\n${graphContent}\n}`;
  }

  const svg = graphviz.layout(processedDot, 'svg', layoutEngine);

  return svg;
}
