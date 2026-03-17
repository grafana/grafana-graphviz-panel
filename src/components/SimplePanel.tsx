import React, { useRef, useCallback, useMemo, useState } from 'react';
import { PanelProps } from '@grafana/data';
import { SimpleOptions, InputMode } from 'types';
import { css, cx } from '@emotion/css';
import { useStyles2, useTheme2 } from '@grafana/ui';
import { PanelDataErrorView } from '@grafana/runtime';
import { useThemedDotSvg } from '../hooks';
import { extractDotFromQuery } from '../data';
import { ErrorDisplay } from './ErrorDisplay';
import { BuilderModeOverlay } from './BuilderModeOverlay';
import { EmptyDiagramDisplay } from './EmptyDiagramDisplay';
import { isEmptyDiagram } from '../utils/graphvizDot';

interface Props extends PanelProps<SimpleOptions> {}

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

export const SimplePanel: React.FC<Props> = ({
  options,
  data,
  width,
  height,
  fieldConfig,
  id,
  eventBus,
  onOptionsChange,
}) => {
  const styles = useStyles2(getStyles);
  const theme = useTheme2();
  const svgRef = useRef<HTMLDivElement>(null);
  const isEditMode =
    typeof window !== 'undefined' &&
    (window.location.search.includes('editPanel=') || window.location.search.includes('viewPanel='));

  const [queryError, setQueryError] = useState<string | null>(null);

  const effectiveDotDiagram = useMemo(() => {
    if (options.inputMode === InputMode.QUERY) {
      try {
        const dot = extractDotFromQuery(
          data.series,
          options.dotQueryConfig?.fieldName || 'dot_diagram',
          options.dotQueryConfig?.maxSizeBytes
        );
        setQueryError(null);
        return dot || '';
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to extract DOT diagram from query';
        setQueryError(errorMessage);
        return '';
      }
    }
    setQueryError(null);
    return options.dotDiagram;
  }, [options.inputMode, options.dotDiagram, options.dotQueryConfig, data.series]);

  const isEmpty = isEmptyDiagram(effectiveDotDiagram);
  const isBuilderMode = options.inputMode === InputMode.BUILDER && isEditMode;

  const renderError = useThemedDotSvg(
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
    isEditMode
  );

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
    </div>
  );
};
