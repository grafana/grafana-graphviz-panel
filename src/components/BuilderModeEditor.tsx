import React, { useState } from 'react';
import { StandardEditorProps, SelectableValue } from '@grafana/data';
import { Button, ButtonGroup, Tooltip } from '@grafana/ui';
import { BuilderTool, SimpleOptions, BuilderModeActions } from '../types';

const TOOL_OPTIONS: Array<SelectableValue<BuilderTool>> = [
  {
    value: BuilderTool.NODE,
    label: 'Node',
    icon: 'plus-square',
    description: 'Add a new node',
  },
  {
    value: BuilderTool.EDGE,
    label: 'Edge',
    icon: 'arrow-from-right',
    description: 'Create edges between nodes',
  },
  {
    value: BuilderTool.EDIT,
    label: 'Edit',
    icon: 'pen',
    description: 'Edit node or edge properties',
  },
  {
    value: BuilderTool.DELETE,
    label: 'Delete',
    icon: 'trash-alt',
    description: 'Delete nodes or edges',
  },
];

export const BuilderModeEditor: React.FC<StandardEditorProps<BuilderModeActions, any, SimpleOptions>> = ({
  value,
  onChange,
}) => {
  const [activeTool, setActiveTool] = useState<BuilderTool>(value?.activeTool || BuilderTool.EDIT);

  const handleToolChange = (newTool: BuilderTool) => {
    setActiveTool(newTool);

    if (newTool === BuilderTool.NODE) {
      onChange({ ...value, activeTool: newTool, addNodeTrigger: Date.now() });
    } else {
      onChange({ ...value, activeTool: newTool });
    }
  };

  const getButtonTestId = (toolValue: BuilderTool): string => {
    switch (toolValue) {
      case BuilderTool.NODE:
        return 'diagram-new-node';
      case BuilderTool.EDGE:
        return 'diagram-new-edge';
      case BuilderTool.EDIT:
        return 'diagram-edit-elements';
      case BuilderTool.DELETE:
        return 'diagram-delete-elements';
      default:
        return `diagram-tool-${toolValue}`;
    }
  };

  return (
    <ButtonGroup>
      {TOOL_OPTIONS.map((tool) => (
        <Tooltip key={tool.value} content={tool.description || ''} placement="top">
          <Button
            data-testid={getButtonTestId(tool.value!)}
            icon={tool.icon as any}
            variant={activeTool === tool.value ? 'primary' : 'secondary'}
            onClick={() => handleToolChange(tool.value!)}
            aria-label={tool.label || ''}
          />
        </Tooltip>
      ))}
    </ButtonGroup>
  );
};
