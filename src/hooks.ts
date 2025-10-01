import { useEffect, RefObject, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { validateDotSyntax } from './validation';
import { sanitizeDotColors } from './sanitization';
import { deriveEdgeIds } from './enhancements';
import { applyEdgeStyleMappings, applyNodeStyleMappings } from './mappings';
import { renderDotToSvg } from './dot';
import { applySvgTheming } from './theming';
import { EdgeStyleMapping, NodeStyleMapping } from './types';

import { ValidationErrorInfo } from './validation';

export interface RenderError {
  message: string;
  errorInfo?: ValidationErrorInfo;
}

/**
 * Hook that orchestrates the DOT diagram rendering pipeline.
 * Handles validation, enhancements, rendering DOT to SVG, and applying Grafana theme styling.
 * 
 * @param svgRef - React ref to the container element where SVG will be rendered
 * @param dotDiagram - The DOT notation string to render
 * @param rankDirection - The direction of the graph layout (TB, BT, LR, RL)
 * @param edgeMappings - Array of edge style mappings to apply
 * @param nodeMappings - Array of node style mappings to apply
 * @param theme - The Grafana theme object for styling
 * @returns Error state if rendering fails
 */
export function useThemedDotSvg(
  svgRef: RefObject<HTMLDivElement>,
  dotDiagram: string | undefined,
  rankDirection: string,
  edgeMappings: EdgeStyleMapping[],
  nodeMappings: NodeStyleMapping[],
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

        const sanitizedDot = sanitizeDotColors(dotDiagram);
        const dotWithEdgeIds = deriveEdgeIds(sanitizedDot);
        const dotWithEdgeStyles = applyEdgeStyleMappings(dotWithEdgeIds, edgeMappings);
        const dotWithNodeStyles = applyNodeStyleMappings(dotWithEdgeStyles, nodeMappings);
        const svg = await renderDotToSvg(dotWithNodeStyles, rankDirection);

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
  }, [dotDiagram, rankDirection, edgeMappings, nodeMappings, theme, svgRef]);

  return renderError;
}

