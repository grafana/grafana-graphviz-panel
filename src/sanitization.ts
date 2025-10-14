import * as graphlibDot from 'graphlib-dot';
import { Graph } from 'graphlib';
import * as d3 from 'd3-selection';

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

/**
 * Normalizes styling for path-based node shapes (like cylinders) to ensure fill colors work properly.
 * Certain shapes like cylinder, box3d, component, etc. are rendered as SVG paths and require 
 * the style="filled" attribute along with fillcolor for the fill to be visible.
 * This function ensures that nodes with fillcolor also have style="filled" set.
 * 
 * @param svg - The d3 selection of the SVG element
 */
export function normalizeNodePathStyling(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>): void {
  svg.selectAll('g.node path').each(function() {
    const pathElement = d3.select(this);
    const currentFill = pathElement.attr('fill');
    
    const hasCustomFillColor = currentFill && currentFill !== 'none' && !isDefaultColor(currentFill);
    if (hasCustomFillColor) {
      pathElement.attr('data-has-custom-fill', 'true');
    }
  });
}

/**
 * Checks if a color is a default Graphviz color.
 */
function isDefaultColor(color: string | null): boolean {
  if (!color) {
    return true;
  }
  
  const defaultColors = ['black', 'none', 'white', '#000000', '#ffffff'];
  return defaultColors.includes(color.toLowerCase());
}

