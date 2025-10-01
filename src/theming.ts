import { GrafanaTheme2 } from '@grafana/data';

/**
 * Applies Grafana theme styling to a rendered SVG element.
 * Modifies the SVG DOM to use theme colors for backgrounds, borders, and text.
 * 
 * @param svgElement - The SVG DOM element to apply theming to
 * @param theme - The Grafana theme object containing color and typography settings
 */
export function applySvgTheming(svgElement: SVGSVGElement, theme: GrafanaTheme2): void {
  svgElement.style.backgroundColor = 'transparent';
  svgElement.style.width = '100%';
  svgElement.style.height = '100%';
  svgElement.style.maxWidth = '100%';
  svgElement.style.maxHeight = '100%';
  
  const backgroundPolygons = svgElement.querySelectorAll('polygon[fill="white"]');
  backgroundPolygons.forEach(polygon => polygon.setAttribute('fill', 'none'));
  
  const ellipseNodes = svgElement.querySelectorAll('ellipse');
  ellipseNodes.forEach(element => {
    element.setAttribute('stroke', theme.colors.border.medium);
    element.setAttribute('fill', theme.colors.background.secondary);
  });
  
  const polygonNodes = svgElement.querySelectorAll('g.node polygon');
  polygonNodes.forEach(element => {
    element.setAttribute('stroke', theme.colors.border.medium);
    element.setAttribute('fill', theme.colors.background.secondary);
  });
  
  const edgePaths = svgElement.querySelectorAll('path');
  edgePaths.forEach(element => {
    element.setAttribute('stroke', theme.colors.border.medium);
    element.setAttribute('fill', 'none');
  });
  
  const arrowheads = svgElement.querySelectorAll('g.edge polygon');
  arrowheads.forEach(element => {
    element.setAttribute('fill', theme.colors.border.medium);
    element.setAttribute('stroke', theme.colors.border.medium);
  });
  
  const textElements = svgElement.querySelectorAll('text');
  textElements.forEach(element => {
    element.setAttribute('fill', theme.colors.text.primary);
    element.setAttribute('font-family', theme.typography.fontFamily);
  });
}

