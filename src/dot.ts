import { Graphviz } from '@hpcc-js/wasm';

/**
 * Renders a DOT diagram to SVG format.
 * 
 * @param dotDiagram - The DOT notation string to render
 * @param rankDirection - The direction of the graph layout (TB, BT, LR, RL)
 * @returns Promise that resolves to the SVG string
 */
export async function renderDotToSvg(dotDiagram: string, rankDirection: string): Promise<string> {
  const graphviz = await Graphviz.load();
  
  const dotWithRankdir = `digraph G {\n  rankdir=${rankDirection};\n${dotDiagram.replace(/digraph\s+\w*\s*\{/, '').replace(/}$/, '')}\n}`;
  const svg = graphviz.layout(dotWithRankdir, 'svg', 'dot');
  
  return svg;
}

