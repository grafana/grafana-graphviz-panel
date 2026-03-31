import React from 'react';
import { StandardEditorProps } from '@grafana/data';
import { CodeEditor } from '@grafana/ui';

export const DotDiagramEditor: React.FC<StandardEditorProps<string>> = ({ value, onChange }) => {
  return (
    <CodeEditor
      value={value || ''}
      language="plaintext"
      width="100%"
      height="300px"
      showLineNumbers={true}
      showMiniMap={false}
      onBlur={(newValue) => onChange(newValue)}
      onSave={(newValue) => onChange(newValue)}
    />
  );
};
