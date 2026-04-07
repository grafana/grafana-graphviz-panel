import React, { useRef, useCallback, useMemo, useState, useEffect } from 'react';
import { PanelProps } from '@grafana/data';
import { PanelOptions, InputMode } from 'types';
import { css, cx } from '@emotion/css';
import { useStyles2, useTheme2 } from '@grafana/ui';
import { PanelDataErrorView, locationService } from '@grafana/runtime';
import { useGraphvizRenderPipeline, useNodeEdgeHover } from '../hooks';
import { extractDotFromQuery } from '../integrations/grafanaData';
import { ErrorDisplay, EmptyDiagramDisplay } from './states';
import { BuilderModeOverlay } from './BuilderModeOverlay';
import { isEmptyDiagram } from '../core/utils/graphvizDot';
import { GraphvizTooltip } from './GraphvizTooltip';
import { resolveNodeTooltipData, resolveEdgeTooltipData } from '../integrations/grafanaTooltips';

interface GraphvizPanelProps extends PanelProps<PanelOptions> {}

const getStyles = () => {
  return {
    wrapper: css`
      position: relative;
    `,
    svg: css`
      position: absolute;
      top: 0;
      left: 0;
    `,
    textBox: css`
      position: absolute;
      bottom: 0;
      left: 0;
      padding: 10px;
    `,
  };
};

export const GraphvizPanel: React.FC<GraphvizPanelProps> = ({
  options,
  data,
  width,
  height,
  fieldConfig,
  id,
  eventBus,
  onOptionsChange,
  replaceVariables,
  renderCounter,
  timeZone,
}) => {
  const styles = useStyles2(getStyles);
  const theme = useTheme2();
  const svgRef = useRef<HTMLDivElement>(null);

  // Use locationService like Canvas panel does for consistent edit mode detection
  // See: https://github.com/grafana/grafana/blob/main/public/app/plugins/panel/canvas/CanvasPanel.tsx
  const searchParams = locationService.getSearchObject();
  const isEditMode = searchParams.editPanel !== undefined || searchParams.viewPanel !== undefined;
  const isActuallyEditing = searchParams.editPanel !== undefined;

  const [queryError, setQueryError] = useState<string | null>(null);
  const [svgRendered, setSvgRendered] = useState(0);

  const effectiveDotDiagram = useMemo(() => {
    let dotDiagram = '';

    if (options.inputMode === InputMode.QUERY) {
      try {
        const dot = extractDotFromQuery(
          data.series,
          options.dotQueryConfig?.fieldName || 'dot_diagram',
          options.dotQueryConfig?.maxSizeBytes
        );
        setQueryError(null);
        dotDiagram = dot || '';
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to extract DOT diagram from query';
        setQueryError(errorMessage);
        return '';
      }
    } else {
      setQueryError(null);
      dotDiagram = options.dotDiagram;
    }

    return replaceVariables(dotDiagram);
    // NOTE: `renderCounter` is provided by Grafana and increments when dashboard variables change,
    //       this ensures the diagram re-renders with updated variable values
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.inputMode, options.dotDiagram, options.dotQueryConfig, data.series, replaceVariables, renderCounter]);

  const isEmpty = isEmptyDiagram(effectiveDotDiagram);
  const isBuilderMode = options.inputMode === InputMode.BUILDER && isActuallyEditing;

  const [tooltipHovered, setTooltipHovered] = useState(false);

  const { hoverState, clearPinned } = useNodeEdgeHover(svgRef, true, svgRendered);

  const tooltipData = useMemo(() => {
    if (!hoverState.id) {
      return null;
    }

    let result = null;
    if (hoverState.type === 'node') {
      result = resolveNodeTooltipData(hoverState.id, options.nodeOverrides || [], data, replaceVariables, timeZone);
    } else if (hoverState.type === 'edge') {
      result = resolveEdgeTooltipData(hoverState.id, options.edgeOverrides || [], data, replaceVariables, timeZone);
    }

    return result;
  }, [hoverState, options.nodeOverrides, options.edgeOverrides, data, replaceVariables, timeZone]);

  const showTooltip = (hoverState.id !== null || tooltipHovered) && tooltipData !== null;

  const renderError = useGraphvizRenderPipeline(
    svgRef,
    isEmpty ? undefined : effectiveDotDiagram,
    options.layoutEngine,
    options.rankDirection,
    options.splineType,
    options.edgeOverrides || [],
    options.nodeOverrides || [],
    options.namedThresholds || [],
    data,
    fieldConfig,
    theme,
    isEditMode,
    replaceVariables
  );

  // Trigger a state update after SVG is rendered to re-run hover hook
  useEffect(() => {
    if (!isEmpty && !renderError && svgRef.current) {
      let attempts = 0;
      const maxAttempts = 20; // Try for up to 1 second (20 * 50ms)
      let timerId: NodeJS.Timeout | null = null;

      const checkForSvg = () => {
        const svg = svgRef.current?.querySelector('svg');
        if (svg) {
          setSvgRendered((prev) => prev + 1);
        } else {
          attempts++;
          if (attempts < maxAttempts) {
            timerId = setTimeout(checkForSvg, 50);
          } else {
          }
        }
      };

      timerId = setTimeout(checkForSvg, 50);
      return () => {
        if (timerId) {
          clearTimeout(timerId);
        }
      };
    }
    return undefined;
  }, [isEmpty, renderError, effectiveDotDiagram]);

  // Handle global clicks to close pinned tooltip
  useEffect(() => {
    if (!hoverState.isPinned) {
      return;
    }

    const handleGlobalClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const isClickInsideInteractiveElement =
        target.closest('[data-portal]') || target.closest('g.node') || target.closest('g.edge');

      if (isClickInsideInteractiveElement) {
        return;
      }
      clearPinned();
    };

    document.addEventListener('click', handleGlobalClick);
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [hoverState.isPinned, clearPinned]);

  const handleDotChange = useCallback(
    (newDotDiagram: string) => {
      onOptionsChange({
        ...options,
        dotDiagram: newDotDiagram,
      });
    },
    [options, onOptionsChange]
  );

  const handleClearTriggers = useCallback(() => {
    onOptionsChange({
      ...options,
      builderModeActions: {
        addNodeTrigger: undefined,
      },
    });
  }, [options, onOptionsChange]);

  const handleAddNode = useCallback(() => {
    onOptionsChange({
      ...options,
      builderModeActions: {
        ...options.builderModeActions,
        addNodeTrigger: Date.now(),
        activeTool: options.builderModeActions?.activeTool,
      },
    });
  }, [options, onOptionsChange]);

  if (data.series.length === 0) {
    return <PanelDataErrorView fieldConfig={fieldConfig} panelId={id} data={data} needsStringField />;
  }

  if (queryError) {
    const fieldName = options.dotQueryConfig?.fieldName || 'dot_diagram';
    const errorWithContext = `${queryError}\n\nConfigured field name: "${fieldName}"`;
    return (
      <ErrorDisplay
        errorMessage={errorWithContext}
        dotDiagram={effectiveDotDiagram}
        layoutEngine={options.layoutEngine}
        inputMode={options.inputMode || InputMode.CODE}
        isEditMode={isEditMode}
      />
    );
  }

  const showEmptyState = isEmpty && !isBuilderMode;
  const showErrorState = renderError && !isEmpty;

  if (showEmptyState) {
    return (
      <div
        className={cx(
          styles.wrapper,
          css`
            width: ${width}px;
            height: ${height}px;
          `
        )}
      >
        <EmptyDiagramDisplay
          dotDiagram={effectiveDotDiagram}
          layoutEngine={options.layoutEngine}
          inputMode={options.inputMode || InputMode.CODE}
          isEditMode={isEditMode}
          onAddNode={handleAddNode}
        />
      </div>
    );
  }

  if (showErrorState) {
    return (
      <ErrorDisplay
        errorMessage={renderError.message}
        errorInfo={renderError.errorInfo}
        dotDiagram={effectiveDotDiagram}
        layoutEngine={options.layoutEngine}
        inputMode={options.inputMode || InputMode.CODE}
        isEditMode={isEditMode}
      />
    );
  }

  return (
    <div
      className={cx(
        styles.wrapper,
        css`
          width: ${width}px;
          height: ${height}px;
        `
      )}
      data-testid={isEmpty && isBuilderMode ? 'graphviz-panel-builder-empty' : 'graphviz-panel-rendered'}
    >
      <div
        ref={svgRef}
        className={styles.svg}
        data-testid="graphviz-panel-rendered-svg"
        style={{
          width,
          height,
          display: isEmpty ? 'none' : 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      />

      {isEmpty && isBuilderMode && (
        <div style={{ position: 'absolute', width: '100%', height: '100%' }}>
          <EmptyDiagramDisplay
            dotDiagram={effectiveDotDiagram}
            layoutEngine={options.layoutEngine}
            inputMode={options.inputMode || InputMode.CODE}
            isEditMode={isEditMode}
            onAddNode={handleAddNode}
          />
        </div>
      )}

      {isBuilderMode && (
        <BuilderModeOverlay
          svgRef={svgRef}
          dotDiagram={options.dotDiagram}
          onChange={handleDotChange}
          onClearTriggers={handleClearTriggers}
          addNodeTrigger={options.builderModeActions?.addNodeTrigger}
          layoutEngine={options.layoutEngine}
          activeTool={options.builderModeActions?.activeTool}
        />
      )}

      {showTooltip && tooltipData && (
        <GraphvizTooltip
          data={tooltipData}
          position={hoverState.position}
          isPinned={hoverState.isPinned}
          onMouseEnter={() => setTooltipHovered(true)}
          onMouseLeave={() => setTooltipHovered(false)}
          onClose={clearPinned}
        />
      )}
    </div>
  );
};
