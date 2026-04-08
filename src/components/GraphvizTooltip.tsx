/**
 * Tooltip component for Graphviz nodes and edges.
 * Uses VizTooltipContainer from Grafana's public API for smart positioning and viewport boundary detection.
 */

import React from 'react';
import { VizTooltipContainer, Portal, IconButton, useStyles2 } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { css, cx } from '@emotion/css';
import { TooltipData } from '../integrations/grafanaTooltips';

interface GraphvizTooltipProps {
  data: TooltipData;
  position: { x: number; y: number };
  isPinned: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClose: () => void;
}

export const GraphvizTooltip: React.FC<GraphvizTooltipProps> = ({
  data,
  position,
  isPinned,
  onMouseEnter,
  onMouseLeave,
  onClose,
}) => {
  const styles = useStyles2(getStyles);

  return (
    <Portal>
      <VizTooltipContainer
        position={position}
        offset={{ x: 10, y: 10 }}
        allowPointerEvents={isPinned}
        className={cx(styles.container, isPinned && styles.pinned)}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        data-portal="graphviz-tooltip"
      >
        {isPinned && (
          <div className={styles.closeButton}>
            <IconButton name="times" onClick={onClose} tooltip="Close" size="sm" variant="secondary" />
          </div>
        )}

        {data.title && (
          <div className={styles.header}>
            {data.title.split('\n').map((line, i) => {
              const colonIndex = line.indexOf(':');
              if (colonIndex === -1) {
                return <div key={i}>{line || '\u00A0'}</div>;
              }
              const prefix = line.substring(0, colonIndex + 1);
              const value = line.substring(colonIndex + 1);
              return (
                <div key={i}>
                  <span className={styles.headerPrefix}>{prefix}</span>
                  {value}
                </div>
              );
            })}
          </div>
        )}

        {data.content && (
          <div className={cx(styles.content, !data.title && styles.contentNoHeader)}>
            {data.content.split('\n').map((line, i) => (
              <div key={i} className={styles.contentRow}>
                {line || '\u00A0'}
              </div>
            ))}
          </div>
        )}

        {data.links.map((link, i) => (
          <div key={i} className={styles.linkSection}>
            <a
              href={link.url}
              target={link.openInNewTab ? '_blank' : '_self'}
              rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
              className={styles.link}
              onClick={(e) => e.stopPropagation()}
            >
              {link.title}
            </a>
          </div>
        ))}
      </VizTooltipContainer>
    </Portal>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    borderRadius: '8px',
    maxWidth: '400px',
    padding: 0,
    whiteSpace: 'pre',
    fontSize: theme.typography.bodySmall.fontSize,
  }),
  pinned: css({
    boxShadow: theme.shadows.z3,
  }),
  closeButton: css({
    position: 'absolute',
    top: theme.spacing(0.5),
    right: theme.spacing(0.5),
    zIndex: 1,
  }),
  // NOTE: VizTooltipHeader is not exported from @grafana/ui:
  // https://github.com/grafana/grafana/blob/main/packages/grafana-ui/src/components/VizTooltip/VizTooltipHeader.tsx
  header: css({
    padding: theme.spacing(1),
    paddingRight: theme.spacing(5),
    lineHeight: 1,
    fontWeight: theme.typography.fontWeightMedium,
    color: theme.colors.text.primary,
    whiteSpace: 'normal',
  }),
  headerPrefix: css({
    fontWeight: theme.typography.fontWeightRegular,
    color: theme.colors.text.secondary,
  }),
  // NOTE: VizTooltipContent is not exported from @grafana/ui:
  // https://github.com/grafana/grafana/blob/main/packages/grafana-ui/src/components/VizTooltip/VizTooltipContent.tsx
  content: css({
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    borderTop: `1px solid ${theme.colors.border.weak}`,
    padding: theme.spacing(1),
  }),
  contentNoHeader: css({
    borderTop: 'none',
  }),
  // NOTE: VizTooltipRow is not exported from @grafana/ui:
  // https://github.com/grafana/grafana/blob/main/packages/grafana-ui/src/components/VizTooltip/VizTooltipRow.tsx
  contentRow: css({
    color: theme.colors.text.secondary,
    whiteSpace: 'normal',
    lineHeight: 1.4,
  }),
  // NOTE: VizTooltipFooter is not exported from @grafana/ui:
  // https://github.com/grafana/grafana/blob/main/packages/grafana-ui/src/components/VizTooltip/VizTooltipFooter.tsx
  linkSection: css({
    borderTop: `1px solid ${theme.colors.border.medium}`,
    padding: theme.spacing(1),
  }),
  // NOTE: DataLinkButton styles not exported from @grafana/ui:
  // https://github.com/grafana/grafana/blob/main/packages/grafana-ui/src/components/DataLinks/DataLinkButton.tsx
  link: css({
    cursor: 'pointer',
    color: theme.colors.text.link,
    textDecoration: 'none',
    display: 'block',
    whiteSpace: 'normal',
    textAlign: 'left',
    padding: 0,
    '&:hover': {
      textDecoration: 'underline',
    },
  }),
});
