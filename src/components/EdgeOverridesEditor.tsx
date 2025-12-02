import React, { useEffect, useState, useMemo } from 'react';
import { StandardEditorProps, SelectableValue } from '@grafana/data';
import {
  Button,
  Field,
  MultiSelect,
  ColorPicker,
  IconButton,
  Combobox,
  Select,
  Dropdown,
  Menu,
  Box,
  CodeEditor,
  Monaco,
  MonacoEditor,
  RadioButtonGroup,
  Alert,
  Icon,
  getFieldTypeIconName,
} from '@grafana/ui';
import { EdgeOverride, StrokeColorRule, StrokeWidthRule, Rule, RuleKind, MatchMode } from '../types';
import { autodetectMatchField, MatchDetectionResult, findMatchedRow } from '../data';
import { css } from '@emotion/css';
import {
  registerEdgeLabelCompletion,
  SINGLE_LINE_MONACO_OPTIONS,
  registerSingleLineKeyCommands,
  registerMatchValueCompletion,
} from '../utils/monacoConfig';

interface Props extends StandardEditorProps<EdgeOverride[]> {}

export const EdgeOverridesEditor: React.FC<Props> = ({ value, onChange, context }) => {
  const mappings = useMemo(() => value || [], [value]);
  const [detectionResults, setDetectionResults] = useState<Map<string, MatchDetectionResult | undefined>>(new Map());

  const addMapping = () => {
    const newMapping: EdgeOverride = {
      id: `edge-mapping-${Date.now()}`,
      targetEdgeIds: [],
      matchMode: MatchMode.AUTODETECT,
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

  const splitUnmatchedToNewOverride = (mappingId: string, unmatchedIds: string[]) => {
    const mapping = mappings.find((m) => m.id === mappingId);
    if (!mapping) {
      return;
    }

    const matchedIds = mapping.targetEdgeIds.filter((id) => !unmatchedIds.includes(id));

    const newMapping: EdgeOverride = {
      id: `edge-mapping-${Date.now()}`,
      targetEdgeIds: unmatchedIds,
      matchMode: MatchMode.AUTODETECT,
      rules: [],
    };

    const currentIndex = mappings.findIndex((m) => m.id === mappingId);
    const updated = [...mappings];
    updated[currentIndex] = { ...mapping, targetEdgeIds: matchedIds };
    updated.splice(currentIndex + 1, 0, newMapping);

    onChange(updated);
  };

  const availableEdgeIds = extractEdgeIds(context.options?.dotDiagram);
  const stringFields = extractStringFields(context.data);
  const numericFields = extractNumericFields(context.data);

  useEffect(
    function computeDetectionResults() {
      const newResults = new Map<string, MatchDetectionResult | undefined>();

      mappings.forEach((mapping) => {
        const matchMode = mapping.matchMode || MatchMode.MANUAL;

        if (matchMode === MatchMode.AUTODETECT && mapping.targetEdgeIds.length > 0 && context.data) {
          const result = autodetectMatchField(context.data, mapping.targetEdgeIds);
          newResults.set(mapping.id, result);
        }
      });

      setDetectionResults(newResults);
    },
    [mappings, context.data]
  );

  useEffect(
    function autoApplyMatchField() {
      const updatesToApply: Array<{ id: string; updates: Partial<EdgeOverride> }> = [];

      mappings.forEach((mapping) => {
        const matchMode = mapping.matchMode || MatchMode.MANUAL;
        const detectionResult = detectionResults.get(mapping.id);

        if (matchMode === MatchMode.AUTODETECT && detectionResult && !mapping.matchFieldName) {
          updatesToApply.push({
            id: mapping.id,
            updates: {
              matchFieldName: detectionResult.matchFieldName,
              matchPattern: '${id}',
            },
          });
        }
      });

      if (updatesToApply.length > 0) {
        const updatedMappings = mappings.map((mapping) => {
          const update = updatesToApply.find((u) => u.id === mapping.id);
          return update ? { ...mapping, ...update.updates } : mapping;
        });
        onChange(updatedMappings);
      }
    },
    [mappings, detectionResults, onChange]
  );

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
            <strong>Edge override rule {index + 1}</strong>
            <IconButton name="trash-alt" onClick={() => removeMapping(mapping.id)} tooltip="Remove override" />
          </div>

          <Field label="Select edges by ID">
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

          <Field label="Match mode">
            <RadioButtonGroup
              value={mapping.matchMode || MatchMode.MANUAL}
              options={[
                { label: 'Autodetect', value: MatchMode.AUTODETECT },
                { label: 'Manual', value: MatchMode.MANUAL },
              ]}
              onChange={(value) => {
                if (value === MatchMode.AUTODETECT) {
                  updateMapping(mapping.id, {
                    matchMode: value,
                    matchFieldName: undefined,
                    matchPattern: '${id}',
                    matchValue: undefined,
                  });
                } else {
                  updateMapping(mapping.id, {
                    matchMode: value,
                  });
                }
              }}
            />
          </Field>

          {mapping.matchMode === MatchMode.AUTODETECT &&
            mapping.targetEdgeIds.length > 0 &&
            (() => {
              const detectionResult = detectionResults.get(mapping.id);

              if (!detectionResult) {
                return (
                  <Alert severity="error" title="No matching fields found">
                    <div>No fields in the data match the selected edge IDs.</div>
                    <div style={{ marginTop: 12 }}>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => updateMapping(mapping.id, { matchMode: MatchMode.MANUAL })}
                      >
                        Switch to Manual Mode
                      </Button>
                    </div>
                  </Alert>
                );
              }

              return (
                <>
                  <Field label="Autodetect matched row where:">
                    <div
                      style={{
                        padding: '6px 8px',
                        background: 'rgba(100, 100, 100, 0.1)',
                        borderRadius: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span>
                        {detectionResult.matchFieldName} = {'"${id}"'}
                      </span>
                      {detectionResult.matchPercentage === 100 ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Icon name="check-circle" style={{ color: '#73BF69' }} />({detectionResult.matchedIds.length}/
                          {mapping.targetEdgeIds.length})
                        </span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Icon name="exclamation-triangle" style={{ color: '#FF9830' }} />(
                          {detectionResult.matchedIds.length}/{mapping.targetEdgeIds.length})
                        </span>
                      )}
                    </div>
                  </Field>

                  {detectionResult.matchPercentage < 100 && (
                    <Alert severity="warning" title="Partial match ...">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>
                          Could not match {detectionResult.unmatchedIds.length}/{mapping.targetEdgeIds.length} edges
                          with this rule
                        </span>
                        <IconButton
                          name="info-circle"
                          size="sm"
                          tooltip={
                            <div>
                              <div style={{ marginBottom: 4, fontWeight: 500 }}>Unmatched IDs:</div>
                              <ul style={{ margin: 0, paddingLeft: 20 }}>
                                {detectionResult.unmatchedIds.map((id) => (
                                  <li key={id}>{id}</li>
                                ))}
                              </ul>
                            </div>
                          }
                        />
                      </div>
                      <div style={{ marginTop: 12 }}>
                        <Button
                          size="sm"
                          variant="primary"
                          icon="plus"
                          onClick={() => splitUnmatchedToNewOverride(mapping.id, detectionResult.unmatchedIds)}
                        >
                          Move {detectionResult.unmatchedIds.length} to new rule
                        </Button>
                      </div>
                    </Alert>
                  )}
                </>
              );
            })()}

          {mapping.matchMode === MatchMode.MANUAL && (
            <>
              <Field label="Match field (optional)">
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
                <Field label="Match value" description='Use "${id}" to match edge ID, or enter specific value'>
                  <CodeEditor
                    value={mapping.matchPattern || mapping.matchValue || ''}
                    language="plaintext"
                    height="30px"
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

              {mapping.matchFieldName && (mapping.matchPattern || mapping.matchValue) && (
                <Field label="Manually matched row where:">
                  {(() => {
                    const matchedIds: string[] = [];
                    const unmatchedIds: string[] = [];

                    mapping.targetEdgeIds.forEach((edgeId) => {
                      const matchValue = mapping.matchPattern
                        ? mapping.matchPattern.replace(/\$\{id\}/g, edgeId)
                        : mapping.matchValue;

                      if (matchValue && context.data) {
                        const dataRow = findMatchedRow(context.data, mapping.matchFieldName!, matchValue);
                        if (dataRow) {
                          matchedIds.push(edgeId);
                        } else {
                          unmatchedIds.push(edgeId);
                        }
                      } else {
                        unmatchedIds.push(edgeId);
                      }
                    });

                    const matchPercentage =
                      mapping.targetEdgeIds.length > 0 ? (matchedIds.length / mapping.targetEdgeIds.length) * 100 : 0;

                    return (
                      <>
                        <div
                          style={{
                            padding: '6px 8px',
                            background: 'rgba(100, 100, 100, 0.1)',
                            borderRadius: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <span>
                            {mapping.matchFieldName} = &quot;
                            {mapping.matchPattern ? mapping.matchPattern : mapping.matchValue}&quot;
                          </span>
                          {matchPercentage === 100 ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Icon name="check-circle" style={{ color: '#73BF69' }} />({matchedIds.length}/
                              {mapping.targetEdgeIds.length})
                            </span>
                          ) : matchPercentage > 0 ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Icon name="exclamation-triangle" style={{ color: '#FF9830' }} />({matchedIds.length}/
                              {mapping.targetEdgeIds.length})
                            </span>
                          ) : (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Icon name="exclamation-circle" style={{ color: '#F2495C' }} />({matchedIds.length}/
                              {mapping.targetEdgeIds.length})
                            </span>
                          )}
                        </div>

                        {matchPercentage < 100 && matchPercentage > 0 && (
                          <Alert severity="warning" title="Partial match ...">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span>
                                Could not match {unmatchedIds.length}/{mapping.targetEdgeIds.length} edges with this
                                rule
                              </span>
                              <IconButton
                                name="info-circle"
                                size="sm"
                                tooltip={
                                  <div>
                                    <div style={{ marginBottom: 4, fontWeight: 500 }}>Unmatched IDs:</div>
                                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                                      {unmatchedIds.map((id) => (
                                        <li key={id}>{id}</li>
                                      ))}
                                    </ul>
                                  </div>
                                }
                              />
                            </div>
                            <div style={{ marginTop: 12 }}>
                              <Button
                                size="sm"
                                variant="primary"
                                icon="plus"
                                onClick={() => splitUnmatchedToNewOverride(mapping.id, unmatchedIds)}
                              >
                                Move {unmatchedIds.length} to new rule
                              </Button>
                            </div>
                          </Alert>
                        )}

                        {matchPercentage === 0 && (
                          <Alert severity="error" title="No matching data found">
                            <div>No data rows match the selected edges with this configuration.</div>
                          </Alert>
                        )}
                      </>
                    );
                  })()}
                </Field>
              )}
            </>
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

              {rule.kind === RuleKind.STROKE_COLOR &&
                (() => {
                  const sampleEdgeId = mapping.targetEdgeIds[0];
                  const matchValue = mapping.matchPattern
                    ? mapping.matchPattern.replace(/\$\{id\}/g, sampleEdgeId)
                    : mapping.matchValue;

                  const availableFields =
                    mapping.matchFieldName && matchValue
                      ? extractAllFieldsForMatchedRow(context.data, mapping.matchFieldName, matchValue)
                      : numericFields;

                  return (
                    <>
                      {mapping.matchFieldName ? (
                        <>
                          <Field label="Color field">
                            <Select
                              value={rule.colorFieldName}
                              options={availableFields}
                              onChange={(selection) => {
                                updateRule(mapping.id, ruleIndex, { colorFieldName: selection?.value });
                              }}
                              placeholder="Select color field..."
                              isOptionDisabled={(option) => option.isDisabled === true}
                              formatOptionLabel={(option) => (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <Icon name={getFieldTypeIconName(option.fieldType as any)} />
                                  <span>{option.label}</span>
                                </div>
                              )}
                            />
                          </Field>

                          <Field
                            label="Threshold set"
                            description="Optional: Use a named threshold set instead global panel thresholds"
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
                        <Field label="Static color">
                          <ColorPicker
                            color={rule.staticColor || '#FF0000'}
                            onChange={(color) => updateRule(mapping.id, ruleIndex, { staticColor: color })}
                          />
                        </Field>
                      )}
                    </>
                  );
                })()}

              {rule.kind === RuleKind.STROKE_WIDTH &&
                (() => {
                  const sampleEdgeId = mapping.targetEdgeIds[0];
                  const matchValue = mapping.matchPattern
                    ? mapping.matchPattern.replace(/\$\{id\}/g, sampleEdgeId)
                    : mapping.matchValue;

                  const availableFields =
                    mapping.matchFieldName && matchValue
                      ? extractAllFieldsForMatchedRow(context.data, mapping.matchFieldName, matchValue)
                      : numericFields;

                  return (
                    <>
                      {mapping.matchFieldName ? (
                        <>
                          <Field label="Width field">
                            <Select
                              value={rule.widthFieldName}
                              options={availableFields}
                              onChange={(selection) => {
                                updateRule(mapping.id, ruleIndex, { widthFieldName: selection?.value });
                              }}
                              placeholder="Select width field..."
                              isOptionDisabled={(option) => option.isDisabled === true}
                              formatOptionLabel={(option) => (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <Icon name={getFieldTypeIconName(option.fieldType as any)} />
                                  <span>{option.label}</span>
                                </div>
                              )}
                            />
                          </Field>
                        </>
                      ) : (
                        <Field label="Static width (px)">
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
                  );
                })()}

              {rule.kind === RuleKind.LABEL && (
                <Field
                  label="Label template"
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
            {(() => {
              const detectionResult = detectionResults.get(mapping.id);
              const matchMode = mapping.matchMode || MatchMode.MANUAL;

              let hasMatchedEdges;
              if (matchMode === MatchMode.AUTODETECT) {
                hasMatchedEdges = detectionResult && detectionResult.matchedIds.length > 0;
              } else {
                hasMatchedEdges = mapping.targetEdgeIds.length > 0;
              }

              const hasStrokeColor = mapping.rules.some((r) => r.kind === RuleKind.STROKE_COLOR);
              const hasStrokeWidth = mapping.rules.some((r) => r.kind === RuleKind.STROKE_WIDTH);
              const hasLabel = mapping.rules.some((r) => r.kind === RuleKind.LABEL);
              const allRulesAdded = hasStrokeColor && hasStrokeWidth && hasLabel;

              const isButtonDisabled = !hasMatchedEdges || allRulesAdded;

              return (
                <Dropdown
                  overlay={
                    <Menu>
                      <Menu.Item
                        label="Stroke Color"
                        icon="circle"
                        onClick={() => addColorRule(mapping.id)}
                        disabled={hasStrokeColor}
                      />
                      <Menu.Item
                        label="Stroke Width"
                        icon="arrows-h"
                        onClick={() => addWidthRule(mapping.id)}
                        disabled={hasStrokeWidth}
                      />
                      <Menu.Item
                        label="Label"
                        icon="font"
                        onClick={() => addLabelRule(mapping.id)}
                        disabled={hasLabel}
                      />
                    </Menu>
                  }
                >
                  <Button icon="plus" variant="secondary" size="sm" disabled={isButtonDisabled}>
                    Override edge property
                  </Button>
                </Dropdown>
              );
            })()}
          </Box>
        </div>
      ))}

      <Button icon="plus" onClick={addMapping} variant="secondary">
        Add edge override rule
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
    fieldType: 'number',
  }));
}

function extractAllFieldsForMatchedRow(
  data: any,
  matchFieldName: string | undefined,
  sampleEdgeId: string | undefined
): Array<SelectableValue<string>> {
  if (!data || data.length === 0 || !matchFieldName || !sampleEdgeId) {
    return extractNumericFields(data);
  }

  const allFields: Array<{ name: string; type: string; isNumeric: boolean }> = [];
  let foundMatch = false;

  for (const frame of data) {
    if (foundMatch) {
      break;
    }

    const matchField = frame.fields?.find((f: any) => f.name === matchFieldName);

    if (matchField) {
      const values = matchField.values || matchField.value || [];
      const valuesArray = values.toArray ? values.toArray() : Array.from(values);
      const hasMatch = valuesArray.some((v: any) => String(v) === sampleEdgeId);

      if (hasMatch) {
        frame.fields.forEach((field: any) => {
          if (field.name && !allFields.some((f) => f.name === field.name)) {
            allFields.push({
              name: field.name,
              type: field.type,
              isNumeric: field.type === 'number',
            });
          }
        });
        foundMatch = true;
      }
    }

    if (!foundMatch) {
      frame.fields?.forEach((field: any) => {
        if (field.labels && field.labels[matchFieldName] === sampleEdgeId) {
          frame.fields.forEach((f: any) => {
            if (f.name && !allFields.some((field) => field.name === field.name)) {
              allFields.push({
                name: f.name,
                type: f.type,
                isNumeric: f.type === 'number',
              });
            }
          });
          foundMatch = true;
        }
      });
    }
  }

  if (allFields.length === 0) {
    return extractNumericFields(data);
  }

  const numericFields = allFields.filter((f) => f.isNumeric);
  const nonNumericFields = allFields.filter((f) => !f.isNumeric);

  const numericOptions = numericFields
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((field) => ({
      label: field.name,
      value: field.name,
      isDisabled: false,
      fieldType: field.type,
    }));

  const nonNumericOptions = nonNumericFields
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((field) => ({
      label: field.name,
      value: field.name,
      isDisabled: true,
      fieldType: field.type,
    }));

  if (nonNumericOptions.length === 0) {
    return numericOptions;
  }

  return [
    ...numericOptions,
    {
      label: 'Incompatible datatype',
      options: nonNumericOptions,
    },
  ];
}
