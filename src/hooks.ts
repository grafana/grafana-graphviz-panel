import { useEffect, RefObject, useState } from 'react';
import { GrafanaTheme2, PanelData, FieldConfigSource } from '@grafana/data';
import { validateDotSyntax, ValidationErrorInfo } from './validation';
import { sanitizeDotColors } from './sanitization';
import { deriveEdgeIds } from './enhancements';
import { applyEdgeStyleMappings, applyNodeStyleMappings, applyDataDrivenColors, applyDataDrivenWidths } from './mappings';
import { processDataFieldBindings, processWidthRules } from './data';
import { renderDotToSvg } from './dot';
import { applySvgTheming } from './theming';
import { EdgeMapping, NodeMapping } from './types';

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
 * @param data - Panel data from datasource
 * @param fieldConfig - Field configuration including thresholds
 * @param theme - The Grafana theme object for styling
 * @returns Error state if rendering fails
 */
export function useThemedDotSvg(
  svgRef: RefObject<HTMLDivElement>,
  dotDiagram: string | undefined,
  layoutEngine: string,
  rankDirection: string,
  edgeMappings: EdgeMapping[],
  nodeMappings: NodeMapping[],
  data: PanelData,
  fieldConfig: FieldConfigSource,
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
        
        const dataDrivenColors = processDataFieldBindings(data, fieldConfig, nodeMappings, edgeMappings, theme);
        const dotWithDataColors = applyDataDrivenColors(dotWithNodeStyles, dataDrivenColors);
        
        const dataDrivenWidths = processWidthRules(data, edgeMappings);
        const dotWithDataWidths = applyDataDrivenWidths(dotWithDataColors, dataDrivenWidths);
        
        const svg = await renderDotToSvg(dotWithDataWidths, layoutEngine, rankDirection);

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
  }, [dotDiagram, layoutEngine, rankDirection, edgeMappings, nodeMappings, data, fieldConfig, theme, svgRef]);

  return renderError;
}

