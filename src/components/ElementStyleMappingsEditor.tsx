import React from 'react';
import { StandardEditorProps, SelectableValue } from '@grafana/data';
import { Button, Field, MultiSelect, ColorPicker, IconButton, Select } from '@grafana/ui';
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
  const stringFields = extractStringFields(context.data);
  const numericFields = extractNumericFields(context.data);

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

          <Field label="Match Field (Optional)" description="Field to match row by (e.g., 'Label')">
            <Select
              value={mapping.matchFieldName}
              options={[{ label: 'None (use static color)', value: undefined }, ...stringFields]}
              onChange={(selection) => updateMapping(mapping.id, { 
                matchFieldName: selection.value,
                matchValue: undefined,
                colorFieldName: undefined,
              })}
              placeholder="Select match field..."
              isClearable
            />
          </Field>

          {mapping.matchFieldName && (
            <>
              <Field label="Match Value" description="Value to match in the match field">
                <Select
                  value={mapping.matchValue}
                  options={extractFieldValues(context.data, mapping.matchFieldName)}
                  onChange={(selection) => updateMapping(mapping.id, { matchValue: selection.value })}
                  placeholder="Select value to match..."
                />
              </Field>

              {numericFields.length > 1 && (
                <Field label="Color Field" description="Numeric field whose value drives color via thresholds">
                  <Select
                    value={mapping.colorFieldName}
                    options={numericFields}
                    onChange={(selection) => updateMapping(mapping.id, { colorFieldName: selection.value })}
                    placeholder="Select color field..."
                  />
                </Field>
              )}
              {numericFields.length === 1 && !mapping.colorFieldName && (
                (() => {
                  updateMapping(mapping.id, { colorFieldName: numericFields[0].value });
                  return null;
                })()
              )}
            </>
          )}

          {!mapping.matchFieldName && (
            <Field label="Stroke Color">
              <ColorPicker
                color={mapping.strokeColor}
                onChange={(color) => updateMapping(mapping.id, { strokeColor: color })}
              />
            </Field>
          )}
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

function extractStringFields(data: any): Array<SelectableValue<string>> {
  if (!data || data.length === 0) {
    return [];
  }

  const stringFields = new Set<string>();
  
  data.forEach((frame: any) => {
    frame.fields?.forEach((field: any) => {
      if (field.name && field.type === 'string') {
        stringFields.add(field.name);
      }
    });
  });

  return Array.from(stringFields).map(name => ({
    label: name,
    value: name,
  }));
}

function extractNumericFields(data: any): Array<SelectableValue<string>> {
  if (!data || data.length === 0) {
    return [];
  }

  const numericFields = new Set<string>();
  
  data.forEach((frame: any) => {
    frame.fields?.forEach((field: any) => {
      if (field.name && field.type === 'number') {
        numericFields.add(field.name);
      }
    });
  });

  return Array.from(numericFields).map(name => ({
    label: name,
    value: name,
  }));
}

function extractFieldValues(data: any, fieldName: string): Array<SelectableValue<string>> {
  if (!data || data.length === 0 || !fieldName) {
    return [];
  }

  const values = new Set<string>();
  
  data.forEach((frame: any) => {
    const field = frame.fields?.find((f: any) => f.name === fieldName);
    if (field && field.values) {
      field.values.forEach((value: any) => {
        if (value != null) {
          values.add(String(value));
        }
      });
    }
  });

  return Array.from(values).sort().map(value => ({
    label: value,
    value: value,
  }));
}


