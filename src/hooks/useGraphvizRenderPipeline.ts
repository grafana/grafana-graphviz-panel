import { useEffect, RefObject, useState } from 'react';
import { FieldConfigSource, GrafanaTheme2, InterpolateFunction, PanelData } from '@grafana/data';
import * as d3 from 'd3-selection';
import { validateDotSyntax, ValidationErrorInfo } from '../core/validation';
import { applyGraphDefaults, normalizeNodePathStyling, deriveNodeIds, deriveEdgeIds } from '../core/sanitization';
import {
  applyNodeStyleDefaults,
  applyFieldDrivenNodeVisuals,
  applyFieldDrivenNodeLabels,
  applyFieldDrivenEdgeVisuals,
  applyFieldDrivenEdgeLabels,
} from '../core/overrides';
import { enhanceDataWithFieldConfig } from '../integrations/grafanaData';
import { renderDotToSvg } from '../core/dot';
import { applySvgTheming } from '../integrations/grafanaTheme';
import { getOrCreateSvgDefinitions, applyBlurGlowFilter, applyNodeGradient } from '../core/utils/svgFilters';

export interface RenderError {
  message: string;
  errorInfo?: ValidationErrorInfo;
}

/**
 * Hook that orchestrates the Graphviz rendering pipeline.
 * Transforms DOT diagrams through validation, style defaults, field-driven
 * visuals, label interpolation, SVG rendering, and theme application.
 */
export function useGraphvizRenderPipeline(
  svgRef: RefObject<HTMLDivElement | null>,
  dotDiagram: string | undefined,
  layoutEngine: string,
  rankDirection: string,
  splineType: string | undefined,
  data: PanelData,
  fieldConfig: FieldConfigSource | undefined,
  theme: GrafanaTheme2,
  isEditMode: boolean,
  replaceVariables?: InterpolateFunction,
  scaleNodePenWidth?: boolean,
  scaleEdgePenWidth?: boolean
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

        const enhancedData = enhanceDataWithFieldConfig(data, fieldConfig, theme, replaceVariables);
        const series = enhancedData.series ?? [];

        const defaultedDot = applyGraphDefaults(dotDiagram, theme);
        const dotWithNodeIds = deriveNodeIds(defaultedDot);
        const dotWithEdgeIds = deriveEdgeIds(dotWithNodeIds);
        const dotWithNodeDefaults = applyNodeStyleDefaults(dotWithEdgeIds);

        const dotWithNodeVisuals = applyFieldDrivenNodeVisuals(dotWithNodeDefaults, series, theme, scaleNodePenWidth);
        const dotWithEdgeVisuals = applyFieldDrivenEdgeVisuals(dotWithNodeVisuals, series, theme, scaleEdgePenWidth);
        const dotWithNodeLabels = applyFieldDrivenNodeLabels(dotWithEdgeVisuals, series, replaceVariables);
        const dotWithAllLabels = applyFieldDrivenEdgeLabels(dotWithNodeLabels, series, replaceVariables);

        const svg = await renderDotToSvg(dotWithAllLabels, layoutEngine, rankDirection, splineType);

        if (!svgRef.current) {
          return;
        }

        svgRef.current.innerHTML = svg;

        const svgElement = svgRef.current.querySelector('svg');
        if (svgElement) {
          const d3Svg = d3.select(svgElement);
          normalizeNodePathStyling(d3Svg);
          applySvgTheming(svgElement, theme);

          const svgDefinitions = getOrCreateSvgDefinitions(svgElement);
          applyBlurGlowFilter(svgDefinitions, svgElement);
          applyNodeGradient(svgDefinitions, svgElement, theme);
        }

        setRenderError(null);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setRenderError({
          message: `Unable to render diagram: ${errorMessage}`,
        });
      }
    };

    renderPipeline();
  }, [
    dotDiagram,
    layoutEngine,
    rankDirection,
    splineType,
    data,
    fieldConfig,
    theme,
    svgRef,
    isEditMode,
    replaceVariables,
    scaleNodePenWidth,
    scaleEdgePenWidth,
  ]);

  return renderError;
}
