import { fromDot, toDot } from 'ts-graphviz';
import * as d3 from 'd3-selection';
import { GrafanaTheme2 } from '@grafana/data';
import { isHtmlLabel } from './utils/graphvizDot';
import { isDefaultColor } from './utils/graphvizColors';
import { collectAllNodeIds, hasAnyHtmlLabels } from './utils/graphvizAst';

function getFontAttributes(): string[] {
  return ['fontname', 'fontsize', 'fontcolor'];
}

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
    const model = fromDot(dotString);
    applyThemeDefaults(model, theme);
    return toDot(model);
  } catch (error) {
    console.error('Failed to parse/write DOT for defaulting:', error);
    return dotString;
  }
}

/**
 * Applies default attributes to nodes and edges if they are not already defined.
 *
 * Handles both explicit nodes (declared in the DOT) and implicit nodes (only referenced in edges).
 * Uses graph-level defaults when possible to keep DOT output clean, but promotes implicit nodes
 * to explicit when necessary (e.g., when HTML labels require selective font attribute handling).
 */
const DEFAULT_PEN_WIDTH = '1.0';
const DEFAULT_MARGIN = '0.2';
const DEFAULT_NODE_STYLE = 'rounded,filled';
const DEFAULT_NODE_SHAPE = 'box';
const FILL_COLOR_ALPHA = '60';

function applyThemeDefaults(model: any, theme: GrafanaTheme2): void {
  const nodeDefaults: Record<string, string> = {
    fontname: theme.typography.fontFamily,
    fontsize: theme.typography.fontSize.toString(),
    fontcolor: theme.colors.secondary.contrastText,
    color: theme.colors.text.secondary,
    fillcolor: `${theme.colors.secondary.main}${FILL_COLOR_ALPHA}`,
    style: DEFAULT_NODE_STYLE,
    shape: DEFAULT_NODE_SHAPE,
    penwidth: DEFAULT_PEN_WIDTH,
    margin: DEFAULT_MARGIN,
  };

  const edgeDefaults: Record<string, string> = {
    fontname: theme.typography.fontFamily,
    fontsize: theme.typography.fontSize.toString(),
    fontcolor: theme.colors.secondary.contrastText,
    color: theme.colors.text.secondary,
    penwidth: DEFAULT_PEN_WIDTH,
  };

  const htmlLabelsExist = hasAnyHtmlLabels(model, isHtmlLabel);
  const fontAttrs = getFontAttributes();
  const userHasPlaintext = model.attributes.node.get('shape') === 'plaintext';

  // Attributes that are meaningless for plaintext nodes (no borders/backgrounds)
  const plaintextIncompatibleAttrs = ['style', 'fillcolor', 'color'];

  if (!htmlLabelsExist) {
    // Simple case: No HTML labels, apply all defaults at graph level
    // This keeps implicit nodes implicit and produces clean DOT output
    for (const [key, value] of Object.entries(nodeDefaults)) {
      // Skip attributes that don't make sense for plaintext shapes
      if (userHasPlaintext && plaintextIncompatibleAttrs.includes(key)) {
        continue;
      }

      if (!model.attributes.node.get(key)) {
        model.attributes.node.set(key, value as any);
      }
    }
  } else {
    // Complex case: HTML labels present, need selective handling
    // 1. Apply non-font attributes at graph level (safe for all nodes)
    for (const [key, value] of Object.entries(nodeDefaults)) {
      // Skip font attributes (handled per-node below)
      if (fontAttrs.includes(key)) {
        continue;
      }

      // Skip attributes that don't make sense for plaintext shapes
      if (userHasPlaintext && plaintextIncompatibleAttrs.includes(key)) {
        continue;
      }

      if (!model.attributes.node.get(key)) {
        model.attributes.node.set(key, value as any);
      }
    }

    // 2. Collect all unique node IDs (explicit + implicit)
    const allNodeIds = collectAllNodeIds(model);

    // 3. Apply font attributes selectively per node (skipping HTML-labeled nodes)
    for (const nodeId of allNodeIds) {
      let node = model.getNode(nodeId);

      if (!node) {
        // Promote implicit node to explicit so we can set attributes
        node = model.createNode(nodeId);
      }

      const label = node.attributes.get('label');
      const htmlLabel = isHtmlLabel(label);

      if (!htmlLabel) {
        // Apply font defaults for non-HTML nodes only
        for (const attr of fontAttrs) {
          const value = nodeDefaults[attr];
          if (!node.attributes.get(attr)) {
            node.attributes.set(attr, value as any);
          }
        }
      }
    }
  }

  // Apply edge defaults at graph level
  for (const [key, value] of Object.entries(edgeDefaults)) {
    if (!model.attributes.edge.get(key)) {
      model.attributes.edge.set(key, value as any);
    }
  }
}

/**
 * Derives and assigns IDs to nodes that don't have them.
 * Uses the node's name as its ID to ensure consistent identification.
 * Preserves existing node IDs.
 *
 * @param dotString - The DOT notation string to process
 * @returns DOT string with node IDs added to nodes that didn't have them
 */
export function deriveNodeIds(dotString: string): string {
  const model = fromDot(dotString);

  for (const node of model.nodes) {
    if (!node.attributes.get('id')) {
      node.attributes.set('id', node.id);
    }
  }

  return toDot(model);
}

/**
 * Derives and assigns IDs to edges that don't have them.
 * Generates IDs based on the source and target node names in the format: "source__to__target"
 * Preserves existing edge IDs.
 *
 * @param dotString - The DOT notation string to process
 * @returns DOT string with edge IDs added to edges that didn't have them
 */
export function deriveEdgeIds(dotString: string): string {
  const model = fromDot(dotString);

  for (const edge of model.edges) {
    if (!edge.attributes.get('id')) {
      const targets: any[] = edge.targets;
      if (targets.length >= 2) {
        const sourceId = targets[0].port ? `${targets[0].id}:${targets[0].port}` : targets[0].id;
        const targetId = targets[1].port ? `${targets[1].id}:${targets[1].port}` : targets[1].id;
        const derivedId = `${sourceId}__to__${targetId}`;
        edge.attributes.set('id', derivedId);
      }
    }
  }

  return toDot(model);
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
  svg.selectAll('g.node path').each(function () {
    const pathElement = d3.select(this);
    const currentFill = pathElement.attr('fill');

    const hasCustomFillColor = currentFill && currentFill !== 'none' && !isDefaultColor(currentFill);
    if (hasCustomFillColor) {
      pathElement.attr('data-has-custom-fill', 'true');
    }
  });
}
