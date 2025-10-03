import { Graphviz } from '@hpcc-js/wasm';

/**
 * Renders a DOT diagram to SVG format.
 * 
 * @param dotDiagram - The DOT notation string to render
 * @param layoutEngine - The Graphviz layout engine to use
 * @param rankDirection - The direction of the graph layout (TB, BT, LR, RL) - only for dot engine
 * @returns Promise that resolves to the SVG string
 */
export async function renderDotToSvg(
  dotDiagram: string,
  layoutEngine: string,
  rankDirection?: string
): Promise<string> {
  const graphviz = await Graphviz.load();
  
  let processedDot = dotDiagram;
  
  if (layoutEngine === 'dot' && rankDirection) {
    const isDirected = /^\s*digraph/i.test(dotDiagram);
    const graphType = isDirected ? 'digraph' : 'graph';
    const graphContent = dotDiagram.replace(/^\s*(di)?graph\s+\w*\s*\{/, '').replace(/}\s*$/, '');
    
    processedDot = `${graphType} G {\n  rankdir=${rankDirection};\n${graphContent}\n}`;
  }
  
  const svg = graphviz.layout(processedDot, 'svg', layoutEngine);
  
  return svg;
}

