import React from 'react';
import { StandardEditorProps, SelectableValue } from '@grafana/data';
import {
  Button,
  Field,
  MultiSelect,
  ColorPicker,
  IconButton,
  Combobox,
  Dropdown,
  Menu,
  Box,
  CodeEditor,
  Monaco,
  MonacoEditor,
} from '@grafana/ui';
import { EdgeOverride, StrokeColorRule, StrokeWidthRule, Rule, RuleKind } from '../types';
import { css } from '@emotion/css';
import {
  registerEdgeLabelCompletion,
  SINGLE_LINE_MONACO_OPTIONS,
  registerSingleLineKeyCommands,
  registerMatchValueCompletion,
} from '../utils/monacoConfig';

interface Props extends StandardEditorProps<EdgeOverride[]> {}

export const EdgeOverridesEditor: React.FC<Props> = ({ value, onChange, context }) => {
  const mappings = value || [];

  const addMapping = () => {
    const newMapping: EdgeOverride = {
      id: `edge-mapping-${Date.now()}`,
      targetEdgeIds: [],
      rules: [],
    };
    onChange([...mappings, newMapping]);
  };

  const removeMapping = (id: string) => {
    onChange(mappings.filter((mapping) => mapping.id !== id));
  };

  const updateMapping = (id: string, updates: Partial<EdgeOverride>) => {
    onChange(mappings.map((mapping) => (mapping.id === id ? { ...mapping, ...updates } : mapping)));
  };

  const addColorRule = (mappingId: string) => {
    const mapping = mappings.find((m) => m.id === mappingId);
    if (mapping) {
      const newRule: StrokeColorRule = {
        kind: RuleKind.STROKE_COLOR,
        staticColor: '#FF0000',
      };
      updateMapping(mappingId, { rules: [...mapping.rules, newRule] });
    }
  };

  const addWidthRule = (mappingId: string) => {
    const mapping = mappings.find((m) => m.id === mappingId);
    if (mapping) {
      const newRule: StrokeWidthRule = {
        kind: RuleKind.STROKE_WIDTH,
        staticWidth: 1,
      };
      updateMapping(mappingId, { rules: [...mapping.rules, newRule] });
    }
  };

  const addLabelRule = (mappingId: string) => {
    const mapping = mappings.find((m) => m.id === mappingId);
    if (mapping) {
      const newRule = {
        kind: RuleKind.LABEL,
        labelTemplate: '${field}',
      };
      updateMapping(mappingId, { rules: [...mapping.rules, newRule] });
    }
  };

  const updateRule = (mappingId: string, ruleIndex: number, updates: Partial<Rule>) => {
    const mapping = mappings.find((m) => m.id === mappingId);
    if (mapping) {
      const updatedRules = mapping.rules.map((rule, idx) => (idx === ruleIndex ? { ...rule, ...updates } : rule));
      updateMapping(mappingId, { rules: updatedRules });
    }
  };

  const removeRule = (mappingId: string, ruleIndex: number) => {
    const mapping = mappings.find((m) => m.id === mappingId);
    if (mapping) {
      const updatedRules = mapping.rules.filter((_, idx) => idx !== ruleIndex);
      updateMapping(mappingId, { rules: updatedRules });
    }
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
            <strong>Edge Override {index + 1}</strong>
            <IconButton name="trash-alt" onClick={() => removeMapping(mapping.id)} tooltip="Remove override" />
          </div>

          <Field label="Select Edges">
            <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <MultiSelect
                  value={mapping.targetEdgeIds}
                  options={availableEdgeIds.map((id) => ({ label: id, value: id }))}
                  onChange={(selections) => {
                    const selectedIds = selections.map((s) => s.value!);
                    updateMapping(mapping.id, { targetEdgeIds: selectedIds });
                  }}
                  placeholder="Select edges..."
                />
              </div>
              <Button
                variant="secondary"
                size="md"
                onClick={() => updateMapping(mapping.id, { targetEdgeIds: availableEdgeIds })}
                tooltip="Select all edges"
              >
                All
              </Button>
            </div>
          </Field>

          <Field label="Match Field (Optional)">
            <Combobox
              value={mapping.matchFieldName}
              options={stringFields as any}
              onChange={(selection: any) =>
                updateMapping(mapping.id, {
                  matchFieldName: selection?.value as string | undefined,
                  matchValue: undefined,
                  matchPattern: selection?.value ? '${id}' : undefined,
                  rules: mapping.rules.map((rule) => ({
                    ...rule,
                    colorFieldName: undefined,
                    widthFieldName: undefined,
                    thresholdId: undefined,
                  })),
                })
              }
              placeholder="Select match field..."
              isClearable
            />
          </Field>

          {mapping.matchFieldName && (
            <Field label="Match Value" description='Use "${id}" to match edge ID, or enter specific value'>
              <CodeEditor
                value={mapping.matchPattern || mapping.matchValue || ''}
                language="plaintext"
                height={30}
                showLineNumbers={false}
                showMiniMap={false}
                monacoOptions={SINGLE_LINE_MONACO_OPTIONS}
                onChange={(value) => {
                  const cleanValue = value.replace(/\n/g, '');
                  if (cleanValue.includes('${id}')) {
                    updateMapping(mapping.id, { matchPattern: cleanValue, matchValue: undefined });
                  } else {
                    updateMapping(mapping.id, { matchValue: cleanValue, matchPattern: undefined });
                  }
                }}
                onEditorDidMount={(editor: MonacoEditor, monaco: Monaco) => {
                  registerMatchValueCompletion(monaco, 'edge');
                  registerSingleLineKeyCommands(editor, monaco);
                }}
              />
            </Field>
          )}

          {mapping.rules.map((rule, ruleIndex) => (
            <div key={ruleIndex} className={ruleContainerStyle}>
              <div className={headerStyle}>
                <strong>
                  {rule.kind === RuleKind.STROKE_COLOR && 'Stroke Color Override'}
                  {rule.kind === RuleKind.STROKE_WIDTH && 'Stroke Width Override'}
                  {rule.kind === RuleKind.LABEL && 'Label Override'}
                </strong>
                <IconButton
                  name="trash-alt"
                  onClick={() => removeRule(mapping.id, ruleIndex)}
                  tooltip="Remove override"
                  size="sm"
                />
              </div>

              {rule.kind === RuleKind.STROKE_COLOR && (
                <>
                  {mapping.matchFieldName ? (
                    <>
                      {numericFields.length > 1 && (
                        <Field label="Color Field">
                          <Combobox
                            value={rule.colorFieldName}
                            options={numericFields as any}
                            onChange={(selection: any) =>
                              updateRule(mapping.id, ruleIndex, { colorFieldName: selection?.value })
                            }
                            placeholder="Select color field..."
                          />
                        </Field>
                      )}
                      {numericFields.length === 1 &&
                        !rule.colorFieldName &&
                        (() => {
                          updateRule(mapping.id, ruleIndex, { colorFieldName: numericFields[0].value });
                          return null;
                        })()}

                      <Field
                        label="Threshold Set"
                        description="Optional: Use a named threshold set instead of field config thresholds"
                      >
                        <Combobox
                          value={rule.thresholdId}
                          options={
                            [
                              ...(context.options?.namedThresholds || []).map((t: any) => ({
                                label: t.name,
                                value: t.id,
                              })),
                            ] as any
                          }
                          onChange={(selection: any) =>
                            updateRule(mapping.id, ruleIndex, { thresholdId: selection?.value })
                          }
                          placeholder="Field config thresholds"
                          isClearable
                        />
                      </Field>
                    </>
                  ) : (
                    <Field label="Static Color">
                      <ColorPicker
                        color={rule.staticColor || '#FF0000'}
                        onChange={(color) => updateRule(mapping.id, ruleIndex, { staticColor: color })}
                      />
                    </Field>
                  )}
                </>
              )}

              {rule.kind === RuleKind.STROKE_WIDTH && (
                <>
                  {mapping.matchFieldName ? (
                    <>
                      {numericFields.length > 1 && (
                        <Field label="Width Field">
                          <Combobox
                            value={rule.widthFieldName}
                            options={numericFields as any}
                            onChange={(selection: any) =>
                              updateRule(mapping.id, ruleIndex, { widthFieldName: selection?.value })
                            }
                            placeholder="Select width field..."
                          />
                        </Field>
                      )}
                      {numericFields.length === 1 &&
                        !rule.widthFieldName &&
                        (() => {
                          updateRule(mapping.id, ruleIndex, { widthFieldName: numericFields[0].value });
                          return null;
                        })()}
                    </>
                  ) : (
                    <Field label="Static Width (px)">
                      <input
                        type="number"
                        value={rule.staticWidth || 1}
                        onChange={(e) =>
                          updateRule(mapping.id, ruleIndex, { staticWidth: parseFloat(e.target.value) || 1 })
                        }
                        min={0.1}
                        max={5}
                        step={0.5}
                        style={{ width: '100%', padding: '6px' }}
                      />
                    </Field>
                  )}
                </>
              )}

              {rule.kind === RuleKind.LABEL && (
                <Field
                  label="Label Template"
                  description="Use ${fieldName} to insert field values. Press Ctrl+Space to see available fields."
                >
                  <CodeEditor
                    value={rule.labelTemplate || ''}
                    language="plaintext"
                    height="60px"
                    showLineNumbers={false}
                    showMiniMap={false}
                    monacoOptions={{
                      quickSuggestions: true,
                      suggestOnTriggerCharacters: true,
                    }}
                    onChange={(value) => updateRule(mapping.id, ruleIndex, { labelTemplate: value })}
                    onEditorDidMount={(editor: MonacoEditor, monaco: Monaco) => {
                      registerEdgeLabelCompletion(monaco, context.data, mapping);
                    }}
                  />
                </Field>
              )}
            </div>
          ))}

          <Box marginTop={1.5}>
            <Dropdown
              overlay={
                <Menu>
                  <Menu.Item label="Stroke Color" icon="circle" onClick={() => addColorRule(mapping.id)} />
                  <Menu.Item label="Stroke Width" icon="arrows-h" onClick={() => addWidthRule(mapping.id)} />
                  <Menu.Item label="Label" icon="font" onClick={() => addLabelRule(mapping.id)} />
                </Menu>
              }
            >
              <Button icon="plus" variant="secondary" size="sm">
                Add Edge Override
              </Button>
            </Dropdown>
          </Box>
        </div>
      ))}

      <Button icon="plus" onClick={addMapping} variant="secondary">
        Add Edge Override
      </Button>
    </div>
  );
};

function extractEdgeIds(dotDiagram: string | undefined): string[] {
  if (!dotDiagram) {
    return [];
  }

  const edgeIdPattern = /(\w+)\s*-[->]\s*(\w+)(?:\s*\[([^\]]*)\])?/g;
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

      if (field.labels) {
        Object.keys(field.labels).forEach((labelName: string) => {
          stringFields.add(labelName);
        });
      }
    });
  });

  return Array.from(stringFields).map((name) => ({
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

      if (field.labels) {
        numericFields.add(`__${field.name}`);
      }
    });
  });

  return Array.from(numericFields).map((name) => ({
    label: name,
    value: name,
  }));
}
