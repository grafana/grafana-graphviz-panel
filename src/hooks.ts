import { useEffect, RefObject, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { validateDotSyntax } from './validation';
import { deriveEdgeIds } from './enhancements';
import { renderDotToSvg } from './dot';
import { applySvgTheming } from './theming';

import { ValidationErrorInfo } from './validation';

export interface RenderError {
  message: string;
  errorInfo?: ValidationErrorInfo;
}

/**
 * Hook that orchestrates the DOT diagram rendering pipeline.
 * Handles validation, rendering DOT to SVG, and applying Grafana theme styling.
 * 
 * @param svgRef - React ref to the container element where SVG will be rendered
 * @param dotDiagram - The DOT notation string to render
 * @param rankDirection - The direction of the graph layout (TB, BT, LR, RL)
 * @param theme - The Grafana theme object for styling
 * @returns Error state if rendering fails
 */
export function useThemedDotSvg(
  svgRef: RefObject<HTMLDivElement>,
  dotDiagram: string | undefined,
  rankDirection: string,
  theme: GrafanaTheme2
): RenderError | null {
  const [renderError, setRenderError] = useState<RenderError | null>(null);
  useEffect(() => {
    if (!dotDiagram || !svgRef.current) {
      setRenderError(null);
      return;
    }

    const renderPipeline = async () => {
      try {
        const validationResult = await validateDotSyntax(dotDiagram);
        
        if (!validationResult.isValid) {
          setRenderError({
            message: validationResult.error || 'Unknown error',
            errorInfo: validationResult.errorInfo,
          });
          return;
        }

        const enhancedDot = deriveEdgeIds(dotDiagram);
        const svg = await renderDotToSvg(enhancedDot, rankDirection);

        if (!svgRef.current) {
          return;
        }

        svgRef.current.innerHTML = svg;

        const svgElement = svgRef.current.querySelector('svg');
        if (svgElement) {
          applySvgTheming(svgElement, theme);
        }
        
        setRenderError(null);
      } catch (error) {
        // TODO: Emit error event telemetry in this case
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setRenderError({
          message: `Unable to render diagram: ${errorMessage}`,
        });
      }
    };

    renderPipeline();
  }, [dotDiagram, rankDirection, theme, svgRef]);

  return renderError;
}

