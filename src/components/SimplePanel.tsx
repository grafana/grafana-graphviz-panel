import React, { useRef } from 'react';
import { PanelProps } from '@grafana/data';
import { SimpleOptions, DiagramSourceType } from 'types';
import { css, cx } from '@emotion/css';
import { useStyles2, useTheme2 } from '@grafana/ui';
import { PanelDataErrorView } from '@grafana/runtime';
import { useThemedDotSvg, useFetchDotFromUrl } from '../hooks';
import { ErrorDisplay } from './ErrorDisplay';

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

export const SimplePanel: React.FC<Props> = ({ options, data, width, height, fieldConfig, id }) => {
  const styles = useStyles2(getStyles);
  const theme = useTheme2();
  const svgRef = useRef<HTMLDivElement>(null);

  const { dotContent, isLoading, fetchError } = useFetchDotFromUrl(
    options.dotDiagramUrl,
    options.diagramSourceType || DiagramSourceType.CODE
  );

  const effectiveDotDiagram =
    options.diagramSourceType === DiagramSourceType.URL ? dotContent || '' : options.dotDiagram;

  const renderError = useThemedDotSvg(
    svgRef,
    effectiveDotDiagram,
    options.layoutEngine,
    options.rankDirection,
    options.edgeMappings || [],
    options.nodeMappings || [],
    data,
    fieldConfig,
    theme
  );

  if (data.series.length === 0) {
    return <PanelDataErrorView fieldConfig={fieldConfig} panelId={id} data={data} needsStringField />;
  }

  if (fetchError) {
    return <ErrorDisplay errorMessage={fetchError} />;
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

  if (renderError) {
    return <ErrorDisplay errorMessage={renderError.message} errorInfo={renderError.errorInfo} />;
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
    >
      <div
        ref={svgRef}
        className={styles.svg}
        style={{ 
          width, 
          height, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center' 
        }}
      />

    </div>
  );
};
