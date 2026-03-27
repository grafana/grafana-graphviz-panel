import { GrafanaTheme2 } from '@grafana/data';
import * as d3 from 'd3-selection';
import { isDefaultColor } from './core/utils/graphvizColors';

/**
 * Applies Grafana theme styling to a rendered SVG element.
 * Modifies the SVG DOM to use theme colors for backgrounds, borders, and text.
 * Preserves custom colors that were set via Graphviz (e.g., from style mappings).
 * In edit mode, adds tooltips to nodes and edges showing their IDs.
 *
 * @param svgElement - The SVG DOM element to apply theming to
 * @param theme - The Grafana theme object containing color and typography settings
 * @param isEditMode - Whether the panel is in edit mode (adds tooltips if true)
 */
export function applySvgTheming(svgElement: SVGSVGElement, theme: GrafanaTheme2, isEditMode = false): void {
  const svg = d3.select(svgElement);

  const edgeColor = theme.colors.text.secondary;

  svg
    .style('background-color', 'transparent')
    .style('width', '100%')
    .style('height', '100%')
    .style('max-width', '100%')
    .style('max-height', '100%');

  svg.selectAll('polygon[fill="white"]').attr('fill', 'none');

  svg.selectAll('ellipse').each(function () {
    const element = d3.select(this);
    if (isDefaultColor(element.attr('stroke'))) {
      element.attr('stroke', edgeColor);
    }
    if (isDefaultColor(element.attr('fill'))) {
      element.attr('fill', theme.colors.background.secondary);
    }
  });

  svg.selectAll('g.node polygon').each(function () {
    const element = d3.select(this);
    if (isDefaultColor(element.attr('stroke'))) {
      element.attr('stroke', edgeColor);
    }
    const currentFill = element.attr('fill');
    if (currentFill !== 'none' && isDefaultColor(currentFill)) {
      element.attr('fill', theme.colors.background.secondary);
    }
  });

  svg.selectAll('g.node polyline').each(function () {
    const element = d3.select(this);
    if (isDefaultColor(element.attr('stroke'))) {
      element.attr('stroke', edgeColor);
    }
  });

  svg.selectAll('g.edge path').each(function () {
    const element = d3.select(this);
    if (isDefaultColor(element.attr('stroke'))) {
      element.attr('stroke', edgeColor);
    }
    element.attr('fill', 'none');
  });

  svg.selectAll('g.node path').each(function () {
    const pathElement = d3.select(this);
    const currentStroke = pathElement.attr('stroke');
    const currentFill = pathElement.attr('fill');

    if (isDefaultColor(currentStroke)) {
      pathElement.attr('stroke', edgeColor);
    }

    const shouldThemeFill = currentFill && currentFill !== 'none' && isDefaultColor(currentFill);
    if (shouldThemeFill) {
      pathElement.attr('fill', theme.colors.background.secondary);
    }
  });

  svg.selectAll('g.edge polygon').each(function () {
    const element = d3.select(this);
    const fillColor = element.attr('fill');
    const strokeColor = element.attr('stroke');

    const useThemeColor = isDefaultColor(fillColor) || isDefaultColor(strokeColor);
    const finalColor = useThemeColor ? edgeColor : fillColor || strokeColor;

    element.attr('fill', finalColor);
    element.attr('stroke', finalColor);
  });

  svg.selectAll('text').attr('fill', theme.colors.text.primary).attr('font-family', theme.typography.fontFamily);

  svg.selectAll('g.cluster polygon').each(function () {
    const element = d3.select(this);
    if (isDefaultColor(element.attr('stroke'))) {
      element.attr('stroke', edgeColor);
    }
    element
      .attr('fill', 'none')
      .attr('stroke-dasharray', '3,3')
      .attr('stroke-width', '1.5')
      .attr('stroke-opacity', '0.3');
  });

  svg.selectAll('g.cluster rect').each(function () {
    const element = d3.select(this);
    if (isDefaultColor(element.attr('stroke'))) {
      element.attr('stroke', edgeColor);
    }
    element
      .attr('fill', 'none')
      .attr('stroke-dasharray', '3,3')
      .attr('stroke-width', '1.5')
      .attr('stroke-opacity', '0.3');
  });

  if (isEditMode) {
    svg.selectAll('g.node').each(function () {
      const nodeGroup = d3.select(this);
      const existingTitle = nodeGroup.select('title');
      const nodeId = existingTitle.text() || 'Unknown';
      nodeGroup.selectAll('title').remove();
      nodeGroup.append('title').text(`Node ID: ${nodeId}`);
    });

    svg.selectAll('g.edge').each(function () {
      const edgeGroup = d3.select(this);
      const existingTitle = edgeGroup.select('title');

      let edgeId = 'Unknown';
      if (!existingTitle.empty()) {
        const titleText = existingTitle.text();
        edgeId = titleText.replace(/→/g, '__to__').replace(/->/g, '__to__');
      }

      edgeGroup.selectAll('title').remove();
      edgeGroup.append('title').text(`Edge ID: ${edgeId}`);
    });

    svg.selectAll('title').each(function () {
      const elem = this as SVGTitleElement;
      const parent = elem.parentNode as Element | null;
      if (parent) {
        const parentSelection = d3.select(parent);
        if (!parentSelection.classed('node') && !parentSelection.classed('edge')) {
          d3.select(elem).remove();
        }
      }
    });
  } else {
    svg.selectAll('title').remove();
  }
}
