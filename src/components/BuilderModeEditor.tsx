import React from 'react';
import { StandardEditorProps } from '@grafana/data';
import { Button, InlineFieldRow, InlineField } from '@grafana/ui';

interface BuilderModeEditorValue {
  addNodeTrigger?: number;
  addEdgeTrigger?: number;
}

export const BuilderModeEditor: React.FC<StandardEditorProps<BuilderModeEditorValue>> = ({ onChange }) => {
  const handleAddNode = () => {
    onChange({ addNodeTrigger: Date.now() });
  };

  const handleAddEdge = () => {
    onChange({ addEdgeTrigger: Date.now() });
  };

  return (
    <InlineFieldRow>
      <InlineField grow>
        <Button variant="secondary" icon="plus" onClick={handleAddNode} fullWidth>
          Add Node
        </Button>
      </InlineField>
      <InlineField grow>
        <Button variant="secondary" icon="arrow-right" onClick={handleAddEdge} fullWidth>
          Add Edge
        </Button>
      </InlineField>
    </InlineFieldRow>
  );
};
