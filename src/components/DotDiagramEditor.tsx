import React from 'react';
import { StandardEditorProps } from '@grafana/data';
import { TextArea } from '@grafana/ui';
import { css } from '@emotion/css';

export const DotDiagramEditor: React.FC<StandardEditorProps<string>> = ({ value, onChange }) => {
  const textAreaStyles = css`
    font-family: monospace;
  `;

  return (
    <TextArea
      value={value || ''}
      onChange={(e) => onChange(e.currentTarget.value)}
      placeholder="Enter DOT diagram syntax..."
      rows={10}
      className={textAreaStyles}
    />
  );
};
