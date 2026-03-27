import { useEffect, RefObject, useState } from 'react';
import { GrafanaTheme2, PanelData, FieldConfigSource } from '@grafana/data';
import * as d3 from 'd3-selection';
import { validateDotSyntax, ValidationErrorInfo } from '../core/validation';
import { applyGraphDefaults, normalizeNodePathStyling, deriveEdgeIds } from '../core/sanitization';
import {
  applyEdgeStyleOverrides,
  applyNodeStyleOverrides,
  applyDataDrivenColors,
  applyDataDrivenWidths,
  applyDataDrivenNodeLabels,
  applyDataDrivenEdgeLabels,
  interpolateAllNodeLabels,
  interpolateAllEdgeLabels,
} from '../core/overrides';
import { processDataFieldBindings, processWidthRules } from '../data';
import { renderDotToSvg } from '../core/dot';
import { applySvgTheming } from '../theming';
import { getOrCreateSvgDefinitions, applyBlurGlowFilter, applyNodeGradient } from '../core/utils/svgFilters';
import { EdgeOverride, NodeOverride, NamedThreshold } from '../types';

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
 * @param edgeOverrides - Array of edge style mappings to apply
 * @param nodeOverrides - Array of node style mappings to apply
 * @param data - Panel data from datasource
 * @param fieldConfig - Field configuration including thresholds
 * @param theme - The Grafana theme object for styling
 * @param replaceVariables - Function to replace dashboard variables
 * @returns Error state if rendering fails
 */
export function useThemedDotSvg(
  svgRef: RefObject<HTMLDivElement | null>,
  dotDiagram: string | undefined,
  layoutEngine: string,
  rankDirection: string,
  splineType: string | undefined,
  edgeOverrides: EdgeOverride[],
  nodeOverrides: NodeOverride[],
  namedThresholds: NamedThreshold[],
  data: PanelData,
  fieldConfig: FieldConfigSource,
  theme: GrafanaTheme2,
  isEditMode: boolean,
  replaceVariables?: (value: string) => string
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

        const defaultedDot = applyGraphDefaults(dotDiagram, theme);
        const dotWithEdgeIds = deriveEdgeIds(defaultedDot);
        const dotWithEdgeStyles = applyEdgeStyleOverrides(dotWithEdgeIds, edgeOverrides);
        const dotWithNodeStyles = applyNodeStyleOverrides(dotWithEdgeStyles, nodeOverrides);

        const dataDrivenColors = processDataFieldBindings(
          data,
          fieldConfig,
          nodeOverrides,
          edgeOverrides,
          namedThresholds,
          theme
        );
        const dotWithDataColors = applyDataDrivenColors(dotWithNodeStyles, dataDrivenColors);

        const dataDrivenWidths = processWidthRules(data, edgeOverrides);
        const dotWithDataWidths = applyDataDrivenWidths(dotWithDataColors, dataDrivenWidths);

        const dotWithNodeLabels = applyDataDrivenNodeLabels(dotWithDataWidths, nodeOverrides, data, replaceVariables);
        const dotWithEdgeLabels = applyDataDrivenEdgeLabels(dotWithNodeLabels, edgeOverrides, data, replaceVariables);

        const dotWithAllNodeLabels = interpolateAllNodeLabels(dotWithEdgeLabels, data, replaceVariables);
        const dotWithAllLabels = interpolateAllEdgeLabels(dotWithAllNodeLabels, data, replaceVariables);

        const svg = await renderDotToSvg(dotWithAllLabels, layoutEngine, rankDirection, splineType);

        if (!svgRef.current) {
          return;
        }

        svgRef.current.innerHTML = svg;

        const svgElement = svgRef.current.querySelector('svg');
        if (svgElement) {
          const d3Svg = d3.select(svgElement);
          normalizeNodePathStyling(d3Svg);
          applySvgTheming(svgElement, theme, isEditMode);

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
    edgeOverrides,
    nodeOverrides,
    namedThresholds,
    data,
    fieldConfig,
    theme,
    svgRef,
    isEditMode,
    replaceVariables,
  ]);

  return renderError;
}
