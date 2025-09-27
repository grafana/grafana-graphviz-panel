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
  const styles = useStyles2(getStyles);
  const theme = useTheme2();
  const svgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!options.dotDiagram || !svgRef.current) return;

    Graphviz.load().then((graphviz) => {
      const dotWithRankdir = `digraph G {\n  rankdir=${options.rankDirection};\n${options.dotDiagram.replace(/digraph\s+\w*\s*\{/, '').replace(/}$/, '')}\n}`;
      const svg = graphviz.layout(dotWithRankdir, 'svg', 'dot');
      if (svgRef.current) {
        svgRef.current.innerHTML = svg;
        const svgElement = svgRef.current.querySelector('svg');
        if (svgElement) {
          svgElement.style.backgroundColor = 'transparent';
          svgElement.style.width = '100%';
          svgElement.style.height = '100%';
          svgElement.style.maxWidth = '100%';
          svgElement.style.maxHeight = '100%';
          
          const backgroundPolygons = svgElement.querySelectorAll('polygon[fill="white"]');
          backgroundPolygons.forEach(polygon => polygon.setAttribute('fill', 'none'));
          
          const ellipseNodes = svgElement.querySelectorAll('ellipse');
          ellipseNodes.forEach(element => {
            element.setAttribute('stroke', theme.colors.border.medium);
            element.setAttribute('fill', theme.colors.background.secondary);
          });
          
          const polygonNodes = svgElement.querySelectorAll('g.node polygon');
          polygonNodes.forEach(element => {
            element.setAttribute('stroke', theme.colors.border.medium);
            element.setAttribute('fill', theme.colors.background.secondary);
          });
          
          const edgePaths = svgElement.querySelectorAll('path');
          edgePaths.forEach(element => {
            element.setAttribute('stroke', theme.colors.border.medium);
            element.setAttribute('fill', 'none');
          });
          
          const arrowheads = svgElement.querySelectorAll('g.edge polygon');
          arrowheads.forEach(element => {
            element.setAttribute('fill', theme.colors.border.medium);
            element.setAttribute('stroke', theme.colors.border.medium);
          });
          
          const textElements = svgElement.querySelectorAll('text');
          textElements.forEach(element => {
            element.setAttribute('fill', theme.colors.text.primary);
            element.setAttribute('font-family', theme.typography.fontFamily);
          });
        }
      }
    }).catch(() => {
      if (svgRef.current) {
        svgRef.current.innerHTML = '<p>Error rendering DOT diagram</p>';
      }
    });
  }, [options.dotDiagram, options.rankDirection]);

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

    </div>
  );
};
