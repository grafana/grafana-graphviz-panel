import React from 'react';
import { StandardEditorProps } from '@grafana/data';
import { Button, Field, MultiSelect, ColorPicker, IconButton } from '@grafana/ui';
import { NodeStyleMapping } from '../types';
import { css } from '@emotion/css';

interface Props extends StandardEditorProps<NodeStyleMapping[]> {}

export const NodeStyleMappingsEditor: React.FC<Props> = ({ value, onChange, context }) => {
  const mappings = value || [];

  const addMapping = () => {
    const newMapping: NodeStyleMapping = {
      id: `node-mapping-${Date.now()}`,
      targetNodeIds: [],
      strokeColor: '#0000FF',
    };
    onChange([...mappings, newMapping]);
  };

  const removeMapping = (id: string) => {
    onChange(mappings.filter(mapping => mapping.id !== id));
  };

  const updateMapping = (id: string, updates: Partial<NodeStyleMapping>) => {
    onChange(
      mappings.map(mapping =>
        mapping.id === id ? { ...mapping, ...updates } : mapping
      )
    );
  };

  const availableNodeIds = extractNodeIds(context.options?.dotDiagram);

  const mappingContainerStyle = css`
    margin-bottom: 16px;
    padding: 12px;
    border: 1px solid rgba(204, 204, 220, 0.25);
    border-radius: 4px;
  `;

  const headerStyle = css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  `;

  return (
    <div>
      {mappings.map((mapping, index) => (
        <div key={mapping.id} className={mappingContainerStyle}>
          <div className={headerStyle}>
            <strong>Node Mapping {index + 1}</strong>
            <IconButton name="trash-alt" onClick={() => removeMapping(mapping.id)} tooltip="Remove mapping" />
          </div>

          <Field label="Select Nodes">
            <MultiSelect
              value={mapping.targetNodeIds}
              options={availableNodeIds.map(id => ({ label: id, value: id }))}
              onChange={(selections) => {
                const selectedIds = selections.map(s => s.value!);
                updateMapping(mapping.id, { targetNodeIds: selectedIds });
              }}
              placeholder="Select nodes to style..."
            />
          </Field>

          <Field label="Stroke Color">
            <ColorPicker
              color={mapping.strokeColor}
              onChange={(color) => updateMapping(mapping.id, { strokeColor: color })}
            />
          </Field>
        </div>
      ))}

      <Button icon="plus" onClick={addMapping} variant="secondary">
        Add Node Mapping
      </Button>
    </div>
  );
};

/**
 * Extracts all node IDs from the DOT diagram.
 */
function extractNodeIds(dotDiagram: string | undefined): string[] {
  if (!dotDiagram) {
    return [];
  }

  const nodePattern = /(\w+)\s*\[/g;
  const nodeIds = new Set<string>();
  let match;

  while ((match = nodePattern.exec(dotDiagram)) !== null) {
    nodeIds.add(match[1]);
  }

  const edgePattern = /(\w+)\s*->\s*(\w+)/g;
  while ((match = edgePattern.exec(dotDiagram)) !== null) {
    nodeIds.add(match[1]);
    nodeIds.add(match[2]);
  }

  return Array.from(nodeIds).sort();
}

