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
  
  const edgeColor = theme.colors.text.primary;
  
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
        element.attr('stroke', edgeColor);
      }
      if (isDefaultColor(element.attr('fill'))) {
        element.attr('fill', theme.colors.background.secondary);
      }
    });
  
  svg.selectAll('g.node polygon')
    .each(function() {
      const element = d3.select(this);
      if (isDefaultColor(element.attr('stroke'))) {
        element.attr('stroke', edgeColor);
      }
      if (isDefaultColor(element.attr('fill'))) {
        element.attr('fill', theme.colors.background.secondary);
      }
    });
  
  svg.selectAll('g.edge path')
    .each(function() {
      const element = d3.select(this);
      if (isDefaultColor(element.attr('stroke'))) {
        element.attr('stroke', edgeColor);
      }
      element.attr('fill', 'none');
    });
  
  svg.selectAll('g.node path')
    .each(function() {
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
  
  svg.selectAll('g.edge polygon')
    .each(function() {
      const element = d3.select(this);
      const fillColor = element.attr('fill');
      const strokeColor = element.attr('stroke');
      
      const useThemeColor = isDefaultColor(fillColor) || isDefaultColor(strokeColor);
      const finalColor = useThemeColor ? edgeColor : (fillColor || strokeColor);
      
      element.attr('fill', finalColor);
      element.attr('stroke', finalColor);
    });
  
  svg.selectAll('text')
    .attr('fill', theme.colors.text.primary)
    .attr('font-family', theme.typography.fontFamily);
  
  svg.selectAll('g.cluster polygon')
    .each(function() {
      const element = d3.select(this);
      if (isDefaultColor(element.attr('stroke'))) {
        element.attr('stroke', edgeColor);
      }
      element.attr('fill', 'none')
        .attr('stroke-dasharray', '3,3')
        .attr('stroke-width', '1.5')
        .attr('stroke-opacity', '0.3');
    });
  
  svg.selectAll('g.cluster rect')
    .each(function() {
      const element = d3.select(this);
      if (isDefaultColor(element.attr('stroke'))) {
        element.attr('stroke', edgeColor);
      }
      element.attr('fill', 'none')
        .attr('stroke-dasharray', '3,3')
        .attr('stroke-width', '1.5')
        .attr('stroke-opacity', '0.3');
    });
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
