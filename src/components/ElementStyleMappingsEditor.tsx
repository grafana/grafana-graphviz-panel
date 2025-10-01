import React from 'react';
import { StandardEditorProps } from '@grafana/data';
import { Button, Field, MultiSelect, ColorPicker, IconButton } from '@grafana/ui';
import { EdgeStyleMapping } from '../types';
import { css } from '@emotion/css';

interface Props extends StandardEditorProps<EdgeStyleMapping[]> {}

export const EdgeStyleMappingsEditor: React.FC<Props> = ({ value, onChange, context }) => {
  const mappings = value || [];

  const addMapping = () => {
    const newMapping: EdgeStyleMapping = {
      id: `edge-mapping-${Date.now()}`,
      targetEdgeIds: [],
      strokeColor: '#FF0000',
    };
    onChange([...mappings, newMapping]);
  };

  const removeMapping = (id: string) => {
    onChange(mappings.filter(mapping => mapping.id !== id));
  };

  const updateMapping = (id: string, updates: Partial<EdgeStyleMapping>) => {
    onChange(
      mappings.map(mapping =>
        mapping.id === id ? { ...mapping, ...updates } : mapping
      )
    );
  };

  const availableEdgeIds = extractEdgeIds(context.options?.dotDiagram);

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
            <strong>Edge Mapping {index + 1}</strong>
            <IconButton name="trash-alt" onClick={() => removeMapping(mapping.id)} tooltip="Remove mapping" />
          </div>

          <Field label="Select Edges">
            <MultiSelect
              value={mapping.targetEdgeIds}
              options={availableEdgeIds.map(id => ({ label: id, value: id }))}
              onChange={(selections) => {
                const selectedIds = selections.map(s => s.value!);
                updateMapping(mapping.id, { targetEdgeIds: selectedIds });
              }}
              placeholder="Select edges to style..."
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
        Add Edge Mapping
      </Button>
    </div>
  );
};

/**
 * Extracts all edge IDs from the DOT diagram.
 */
function extractEdgeIds(dotDiagram: string | undefined): string[] {
  if (!dotDiagram) {
    return [];
  }

  const edgeIdPattern = /(\w+)\s*->\s*(\w+)(?:\s*\[([^\]]*)\])?/g;
  const edgeIds: string[] = [];
  let match;

  while ((match = edgeIdPattern.exec(dotDiagram)) !== null) {
    const source = match[1];
    const target = match[2];
    const attributes = match[3];

    if (attributes && attributes.includes('id=')) {
      const idMatch = attributes.match(/id\s*=\s*"?([^",\]]+)"?/);
      if (idMatch) {
        edgeIds.push(idMatch[1]);
      }
    } else {
      edgeIds.push(`${source}__to__${target}`);
    }
  }

  return edgeIds;
}


