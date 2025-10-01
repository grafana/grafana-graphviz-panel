import { useEffect, RefObject } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { renderDotToSvg } from './dot';
import { applySvgTheming } from './theming';

/**
 * Hook that orchestrates the DOT diagram rendering pipeline.
 * Handles rendering DOT to SVG and applying Grafana theme styling.
 * 
 * @param svgRef - React ref to the container element where SVG will be rendered
 * @param dotDiagram - The DOT notation string to render
 * @param rankDirection - The direction of the graph layout (TB, BT, LR, RL)
 * @param theme - The Grafana theme object for styling
 */
export function useThemedDotSvg(
  svgRef: RefObject<HTMLDivElement>,
  dotDiagram: string | undefined,
  rankDirection: string,
  theme: GrafanaTheme2
): void {
  useEffect(() => {
    if (!dotDiagram || !svgRef.current) {
      return;
    }

    const renderPipeline = async () => {
      try {
        const svg = await renderDotToSvg(dotDiagram, rankDirection);

        if (!svgRef.current) {
          return;
        }

        svgRef.current.innerHTML = svg;

        const svgElement = svgRef.current.querySelector('svg');
        if (svgElement) {
          applySvgTheming(svgElement, theme);
        }
      } catch (error) {
        if (svgRef.current) {
          svgRef.current.innerHTML = '<p>Error rendering DOT diagram</p>';
        }
      }
    };

    renderPipeline();
  }, [dotDiagram, rankDirection, theme, svgRef]);
}

