import React from 'react';
import { StandardEditorProps, SelectableValue } from '@grafana/data';
import { Button, Field, MultiSelect, ColorPicker, IconButton, Select } from '@grafana/ui';
import { NodeMapping, StrokeColorRule, Rule, RuleKind } from '../types';
import { css } from '@emotion/css';

interface Props extends StandardEditorProps<NodeMapping[]> {}

export const NodeMappingsEditor: React.FC<Props> = ({ value, onChange, context }) => {
  const mappings = value || [];

  const addMapping = () => {
    const newMapping: NodeMapping = {
      id: `node-mapping-${Date.now()}`,
      targetNodeIds: [],
      rules: [],
    };
    onChange([...mappings, newMapping]);
  };

  const removeMapping = (id: string) => {
    onChange(mappings.filter(mapping => mapping.id !== id));
  };

  const updateMapping = (id: string, updates: Partial<NodeMapping>) => {
    onChange(
      mappings.map(mapping =>
        mapping.id === id ? { ...mapping, ...updates } : mapping
      )
    );
  };

  const addColorRule = (mappingId: string) => {
    const mapping = mappings.find(m => m.id === mappingId);
    if (mapping) {
      const newRule: StrokeColorRule = {
        kind: RuleKind.STROKE_COLOR,
        staticColor: '#FF0000',
      };
      updateMapping(mappingId, { rules: [...mapping.rules, newRule] });
    }
  };

  const updateRule = (mappingId: string, ruleIndex: number, updates: Partial<Rule>) => {
    const mapping = mappings.find(m => m.id === mappingId);
    if (mapping) {
      const updatedRules = mapping.rules.map((rule, idx) =>
        idx === ruleIndex ? { ...rule, ...updates } : rule
      );
      updateMapping(mappingId, { rules: updatedRules });
    }
  };

  const removeRule = (mappingId: string, ruleIndex: number) => {
    const mapping = mappings.find(m => m.id === mappingId);
    if (mapping) {
      const updatedRules = mapping.rules.filter((_, idx) => idx !== ruleIndex);
      updateMapping(mappingId, { rules: updatedRules });
    }
  };

  const availableNodeIds = extractNodeIds(context.options?.dotDiagram);
  const stringFields = extractStringFields(context.data);
  const numericFields = extractNumericFields(context.data);

  const mappingContainerStyle = css`
    margin-bottom: 16px;
    padding: 12px;
    border: 1px solid rgba(204, 204, 220, 0.25);
    border-radius: 4px;
  `;

  const ruleContainerStyle = css`
    margin-top: 12px;
    padding: 12px;
    background: rgba(100, 100, 100, 0.1);
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
              placeholder="Select nodes..."
            />
          </Field>

          {mapping.rules.map((rule, ruleIndex) => (
            <div key={ruleIndex} className={ruleContainerStyle}>
              <div className={headerStyle}>
                <strong>Color Rule</strong>
                <IconButton name="trash-alt" onClick={() => removeRule(mapping.id, ruleIndex)} tooltip="Remove rule" size="sm" />
              </div>

              {rule.kind === RuleKind.STROKE_COLOR && (
                <>
                  <Field label="Match Field (Optional)">
                    <Select
                      value={rule.matchFieldName}
                      options={[{ label: 'None (static color)', value: undefined }, ...stringFields]}
                      onChange={(selection) => updateRule(mapping.id, ruleIndex, {
                        matchFieldName: selection.value,
                        matchValue: undefined,
                        colorFieldName: undefined,
                      })}
                      placeholder="Select match field..."
                      isClearable
                    />
                  </Field>

                  {rule.matchFieldName && (
                    <>
                      <Field label="Match Value">
                        <Select
                          value={rule.matchValue}
                          options={extractFieldValues(context.data, rule.matchFieldName)}
                          onChange={(selection) => updateRule(mapping.id, ruleIndex, { matchValue: selection.value })}
                          placeholder="Select value..."
                        />
                      </Field>

                      {numericFields.length > 1 && (
                        <Field label="Color Field">
                          <Select
                            value={rule.colorFieldName}
                            options={numericFields}
                            onChange={(selection) => updateRule(mapping.id, ruleIndex, { colorFieldName: selection.value })}
                            placeholder="Select color field..."
                          />
                        </Field>
                      )}
                      {numericFields.length === 1 && !rule.colorFieldName && (
                        (() => {
                          updateRule(mapping.id, ruleIndex, { colorFieldName: numericFields[0].value });
                          return null;
                        })()
                      )}
                    </>
                  )}

                  {!rule.matchFieldName && (
                    <Field label="Static Color">
                      <ColorPicker
                        color={rule.staticColor || '#FF0000'}
                        onChange={(color) => updateRule(mapping.id, ruleIndex, { staticColor: color })}
                      />
                    </Field>
                  )}
                </>
              )}
            </div>
          ))}

          <Button icon="plus" onClick={() => addColorRule(mapping.id)} variant="secondary" size="sm">
            Add Color Rule
          </Button>
        </div>
      ))}

      <Button icon="plus" onClick={addMapping} variant="secondary">
        Add Node Mapping
      </Button>
    </div>
  );
};

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

  const edgePattern = /(\w+)\s*-[->]\s*(\w+)/g;
  while ((match = edgePattern.exec(dotDiagram)) !== null) {
    nodeIds.add(match[1]);
    nodeIds.add(match[2]);
  }

  return Array.from(nodeIds).sort();
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

