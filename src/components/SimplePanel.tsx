import React, { useRef, useCallback } from 'react';
import { PanelProps } from '@grafana/data';
import { SimpleOptions, InputMode } from 'types';
import { css, cx } from '@emotion/css';
import { useStyles2, useTheme2 } from '@grafana/ui';
import { PanelDataErrorView } from '@grafana/runtime';
import { useThemedDotSvg, useFetchDotFromUrl } from '../hooks';
import { ErrorDisplay } from './ErrorDisplay';
import { BuilderModeOverlay } from './BuilderModeOverlay';
import { EmptyDiagramDisplay } from './EmptyDiagramDisplay';
import { isEmptyDiagram } from '../utils/graphvizDot';

interface Props extends PanelProps<SimpleOptions> {}

const getStyles = () => {
  return {
    wrapper: css`
      font-family: Open Sans;
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

  const { dotContent, isLoading, fetchError } = useFetchDotFromUrl(
    options.dotDiagramUrl,
    options.inputMode || InputMode.CODE
  );

  const effectiveDotDiagram = options.inputMode === InputMode.URL ? dotContent || '' : options.dotDiagram;
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

  if (data.series.length === 0) {
    return <PanelDataErrorView fieldConfig={fieldConfig} panelId={id} data={data} needsStringField />;
  }

  if (fetchError) {
    return (
      <ErrorDisplay
        errorMessage={fetchError}
        dotDiagram={effectiveDotDiagram}
        layoutEngine={options.layoutEngine}
        inputMode={options.inputMode || InputMode.CODE}
        isEditMode={isEditMode}
      />
    );
  }

  if (isLoading) {
    return (
      <div
        className={cx(
          styles.wrapper,
          css`
            width: ${width}px;
            height: ${height}px;
            display: flex;
            justify-content: center;
            align-items: center;
          `
        )}
      >
        <div>Loading DOT diagram from URL...</div>
      </div>
    );
  }

  if (isEmpty) {
    if (isBuilderMode) {
      return (
        <div
          style={{
            position: 'relative',
            width: `${width}px`,
            height: `${height}px`,
          }}
          data-testid="mesh-panel"
        >
          <div style={{ position: 'absolute', width: '100%', height: '100%' }}>
            <EmptyDiagramDisplay
              dotDiagram={effectiveDotDiagram}
              layoutEngine={options.layoutEngine}
              inputMode={options.inputMode || InputMode.CODE}
              panelId={id}
              isEditMode={isEditMode}
            />
          </div>
          <BuilderModeOverlay
            svgRef={svgRef}
            dotDiagram={options.dotDiagram}
            onChange={handleDotChange}
            onClearTriggers={handleClearTriggers}
            addNodeTrigger={options.builderModeActions?.addNodeTrigger}
            layoutEngine={options.layoutEngine}
            activeTool={options.builderModeActions?.activeTool}
          />
        </div>
      );
    }

    return (
      <EmptyDiagramDisplay
        dotDiagram={effectiveDotDiagram}
        layoutEngine={options.layoutEngine}
        inputMode={options.inputMode || InputMode.CODE}
        panelId={id}
        isEditMode={isEditMode}
      />
    );
  }

  if (renderError && !isEmpty) {
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
      data-testid="graphviz-panel"
    >
      <div
        ref={svgRef}
        className={styles.svg}
        data-testid="graphviz-panel-svg"
        style={{
          width,
          height,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      />

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
