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
    value: BuilderTool.MOVE,
    label: 'Move',
    icon: 'expand-arrows-alt',
    description: 'Move nodes',
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
  context,
}) => {
  const [activeTool, setActiveTool] = useState<BuilderTool>(value?.activeTool || BuilderTool.EDIT);

  const layoutEngine = (context.options as SimpleOptions)?.layoutEngine;
  const canMove = layoutEngine === 'neato' || layoutEngine === 'fdp';

  const handleToolChange = (newTool: BuilderTool) => {
    if (newTool === BuilderTool.MOVE && !canMove) {
      return;
    }

    setActiveTool(newTool);

    if (newTool === BuilderTool.NODE) {
      onChange({ ...value, activeTool: newTool, addNodeTrigger: Date.now() });
    } else {
      onChange({ ...value, activeTool: newTool });
    }
  };

  const getTooltipContent = (tool: SelectableValue<BuilderTool>) => {
    if (tool.value === BuilderTool.MOVE && !canMove) {
      return 'Move nodes (Network layout only)';
    }
    return tool.description || '';
  };

  return (
    <ButtonGroup>
      {TOOL_OPTIONS.map((tool) => {
        const isDisabled = tool.value === BuilderTool.MOVE && !canMove;
        return (
          <Tooltip key={tool.value} content={getTooltipContent(tool)} placement="top">
            <Button
              icon={tool.icon as any}
              variant={activeTool === tool.value ? 'primary' : 'secondary'}
              onClick={() => handleToolChange(tool.value!)}
              aria-label={tool.label || ''}
              disabled={isDisabled}
            />
          </Tooltip>
        );
      })}
    </ButtonGroup>
  );
};
