import React, { useEffect, useRef } from 'react';
import { PanelProps } from '@grafana/data';
import { SimpleOptions } from 'types';
import { css, cx } from '@emotion/css';
import { useStyles2, useTheme2 } from '@grafana/ui';
import { PanelDataErrorView } from '@grafana/runtime';
import { Graphviz } from '@hpcc-js/wasm';

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
  const theme = useTheme2();
  const styles = useStyles2(getStyles);
  const svgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!options.dotDiagram || !svgRef.current) return;

    Graphviz.load().then((graphviz) => {
      const svg = graphviz.layout(options.dotDiagram, 'svg', 'dot');
      if (svgRef.current) {
        svgRef.current.innerHTML = svg;
      }
    }).catch(() => {
      if (svgRef.current) {
        svgRef.current.innerHTML = '<p>Error rendering DOT diagram</p>';
      }
    });
  }, [options.dotDiagram]);

  if (data.series.length === 0) {
    return <PanelDataErrorView fieldConfig={fieldConfig} panelId={id} data={data} needsStringField />;
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

      <div className={styles.textBox}>
        {options.showSeriesCount && (
          <div data-testid="simple-panel-series-counter">Number of series: {data.series.length}</div>
        )}
      </div>
    </div>
  );
};
