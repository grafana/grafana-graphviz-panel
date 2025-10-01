import { GrafanaTheme2 } from '@grafana/data';
import * as d3 from 'd3-selection';

/**
 * Applies Grafana theme styling to a rendered SVG element.
 * Modifies the SVG DOM to use theme colors for backgrounds, borders, and text.
 * Preserves custom colors that were set via Graphviz (e.g., from style mappings).
 * 
 * @param svgElement - The SVG DOM element to apply theming to
 * @param theme - The Grafana theme object containing color and typography settings
 */
export function applySvgTheming(svgElement: SVGSVGElement, theme: GrafanaTheme2): void {
  const svg = d3.select(svgElement);
  
  svg.style('background-color', 'transparent')
    .style('width', '100%')
    .style('height', '100%')
    .style('max-width', '100%')
    .style('max-height', '100%');
  
  svg.selectAll('polygon[fill="white"]')
    .attr('fill', 'none');
  
  svg.selectAll('ellipse')
    .each(function() {
      const element = d3.select(this);
      if (isDefaultColor(element.attr('stroke'))) {
        element.attr('stroke', theme.colors.border.medium);
      }
      if (isDefaultColor(element.attr('fill'))) {
        element.attr('fill', theme.colors.background.secondary);
      }
    });
  
  svg.selectAll('g.node polygon')
    .each(function() {
      const element = d3.select(this);
      if (isDefaultColor(element.attr('stroke'))) {
        element.attr('stroke', theme.colors.border.medium);
      }
      if (isDefaultColor(element.attr('fill'))) {
        element.attr('fill', theme.colors.background.secondary);
      }
    });
  
  svg.selectAll('path')
    .each(function() {
      const element = d3.select(this);
      if (isDefaultColor(element.attr('stroke'))) {
        element.attr('stroke', theme.colors.border.medium);
      }
      element.attr('fill', 'none');
    });
  
  svg.selectAll('g.edge polygon')
    .each(function() {
      const element = d3.select(this);
      if (isDefaultColor(element.attr('fill'))) {
        element.attr('fill', theme.colors.border.medium);
      }
      if (isDefaultColor(element.attr('stroke'))) {
        element.attr('stroke', theme.colors.border.medium);
      }
    });
  
  svg.selectAll('text')
    .attr('fill', theme.colors.text.primary)
    .attr('font-family', theme.typography.fontFamily);
}

/**
 * Checks if a color is a default Graphviz color that should be replaced with theme colors.
 * Preserves custom colors set via DOT attributes or style mappings.
 * 
 * @param color - The color attribute value to check
 * @returns True if the color is a default that should be themed
 */
function isDefaultColor(color: string | null): boolean {
  if (!color) {
    return true;
  }
  
  const defaultColors = ['black', 'none', 'white', '#000000', '#ffffff'];
  return defaultColors.includes(color.toLowerCase());
}

