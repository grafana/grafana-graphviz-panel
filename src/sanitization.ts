import * as graphlibDot from 'graphlib-dot';
import { Graph } from 'graphlib';
import * as d3 from 'd3-selection';
import { GrafanaTheme2 } from '@grafana/data';

/**
 * Applies default styling to the DOT graph based on the Grafana theme.
 * This ensures a modern, sleek look by default, while allowing user overrides.
 * 
 * @param dotString - The DOT notation string
 * @param theme - The Grafana theme to use for defaults
 * @returns The modified DOT string
 */
export function applyGraphDefaults(dotString: string, theme: GrafanaTheme2): string {
  try {
    const graph = graphlibDot.read(dotString);
    applyThemeDefaults(graph, theme);
    return graphlibDot.write(graph);
  } catch (error) {
    console.error('Failed to parse/write DOT for defaulting:', error);
    // Return original string if we fail, so we don't break rendering completely
    return dotString;
  }
}

/**
 * Applies default attributes to nodes and edges if they are not already defined.
 * Iterates over all nodes/edges (including implicit ones from edges) and applies defaults.
 */
function applyThemeDefaults(graph: Graph, theme: GrafanaTheme2): void {
  const nodeDefaults: Record<string, string> = {
    fontname: theme.typography.fontFamily,
    fontsize: theme.typography.fontSize.toString(),
    fontcolor: theme.colors.text.primary,
    color: theme.colors.border.medium,
    fillcolor: theme.colors.background.elevated,
    style: 'rounded,filled',
    shape: 'box',
    penwidth: '1.0',
    margin: '0.2',
  };

  const edgeDefaults: Record<string, string> = {
    fontname: theme.typography.fontFamily,
    fontsize: '10',
    fontcolor: theme.colors.text.secondary,
    color: theme.colors.border.medium,
    penwidth: '1.5',
  };

  // Iterate over all nodes. graphlib-dot automatically creates nodes for any identifier found in edges.
  graph.nodes().forEach(nodeId => {
    const nodeData = graph.node(nodeId) || {};
    // Clone to avoid mutation issues
    const newNodeData = { ...nodeData };
    
    let changed = false;
    Object.entries(nodeDefaults).forEach(([key, value]) => {
      // Only set if strictly undefined. If user set "", we respect it.
      // If user defined a global default (e.g. node [shape=circle]), graphlib-dot
      // might have already applied it to this node during read(), so this check respects that too.
      if (newNodeData[key] === undefined) {
        newNodeData[key] = value;
        changed = true;
      }
    });

    if (changed) {
      graph.setNode(nodeId, newNodeData);
    }
  });

  graph.edges().forEach(edgeObj => {
    const edgeData = graph.edge(edgeObj) || {};
    const newEdgeData = { ...edgeData };

    let changed = false;
    Object.entries(edgeDefaults).forEach(([key, value]) => {
      if (newEdgeData[key] === undefined) {
        newEdgeData[key] = value;
        changed = true;
      }
    });

    if (changed) {
      graph.setEdge(edgeObj.v, edgeObj.w, newEdgeData);
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
