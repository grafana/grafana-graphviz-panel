import React, { useEffect, useState, useMemo, useRef } from 'react';
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
  Collapse,
} from '@grafana/ui';
import { NodeOverride, StrokeColorRule, FillColorRule, Rule, RuleKind, MatchMode } from '../types';
import { autodetectMatchField, MatchDetectionResult, findMatchedRow } from '../data';
import { css } from '@emotion/css';
import {
  registerNodeLabelCompletion,
  SINGLE_LINE_MONACO_OPTIONS,
  registerSingleLineKeyCommands,
  registerMatchValueCompletion,
} from '../utils/monacoConfig';

interface Props extends StandardEditorProps<NodeOverride[]> {}

export const NodeOverridesEditor: React.FC<Props> = ({ value, onChange, context }) => {
  const mappings = useMemo(() => value || [], [value]);
  const [detectionResults, setDetectionResults] = useState<Map<string, MatchDetectionResult | undefined>>(new Map());
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const addMapping = () => {
    const newMapping: NodeOverride = {
      id: `node-mapping-${Date.now()}`,
      targetNodeIds: [],
      matchMode: MatchMode.AUTODETECT,
      rules: [],
    };
    onChange([...mappings, newMapping]);
    setOpenSections((prev) => ({ ...prev, [newMapping.id]: true }));
  };

  const removeMapping = (id: string) => {
    onChange(mappings.filter((mapping) => mapping.id !== id));
  };

  const updateMapping = (id: string, updates: Partial<NodeOverride>) => {
    onChange(mappings.map((mapping) => (mapping.id === id ? { ...mapping, ...updates } : mapping)));
  };

  const addBorderColorRule = (mappingId: string) => {
    const mapping = mappings.find((m) => m.id === mappingId);
    if (mapping) {
      const newRule: StrokeColorRule = {
        kind: RuleKind.STROKE_COLOR,
        staticColor: '#FF0000',
      };
      updateMapping(mappingId, { rules: [...mapping.rules, newRule] });
    }
  };

  const addFillColorRule = (mappingId: string) => {
    const mapping = mappings.find((m) => m.id === mappingId);
    if (mapping) {
      const newRule: FillColorRule = {
        kind: RuleKind.FILL_COLOR,
        staticColor: '#00FF00',
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

    const matchedIds = mapping.targetNodeIds.filter((id) => !unmatchedIds.includes(id));

    const newMapping: NodeOverride = {
      id: `node-mapping-${Date.now()}`,
      targetNodeIds: unmatchedIds,
      matchMode: MatchMode.AUTODETECT,
      rules: [],
    };

    const currentIndex = mappings.findIndex((m) => m.id === mappingId);
    const updated = [...mappings];
    updated[currentIndex] = { ...mapping, targetNodeIds: matchedIds };
    updated.splice(currentIndex + 1, 0, newMapping);

    onChange(updated);
    setOpenSections((prev) => ({ ...prev, [newMapping.id]: true }));

    // Scroll to the new override after it's rendered
    setTimeout(() => {
      const element = sectionRefs.current[newMapping.id];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
  };

  const availableNodeIds = extractNodeIds(context.options?.dotDiagram);
  const stringFields = extractStringFields(context.data);
  const numericFields = extractNumericFields(context.data);

  useEffect(
    function computeDetectionResults() {
      const newResults = new Map<string, MatchDetectionResult | undefined>();

      mappings.forEach((mapping) => {
        const matchMode = mapping.matchMode || MatchMode.MANUAL;

        if (matchMode === MatchMode.AUTODETECT && mapping.targetNodeIds.length > 0 && context.data) {
          const result = autodetectMatchField(context.data, mapping.targetNodeIds);
          newResults.set(mapping.id, result);
        }
      });

      setDetectionResults(newResults);
    },
    [mappings, context.data]
  );

  useEffect(
    function autoApplyMatchField() {
      const updatesToApply: Array<{ id: string; updates: Partial<NodeOverride> }> = [];

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
    padding: 8px;
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

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div>
      {mappings.map((mapping, index) => (
        <div
          key={mapping.id}
          ref={(el) => {
            sectionRefs.current[mapping.id] = el;
          }}
        >
          <Collapse
            className={mappingContainerStyle}
            label={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span>Node override rule {index + 1}</span>
                <IconButton
                  name="trash-alt"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeMapping(mapping.id);
                  }}
                  tooltip="Remove override"
                />
              </div>
            }
            isOpen={openSections[mapping.id] ?? true}
            onToggle={() => toggleSection(mapping.id)}
            collapsible={true}
          >
            <Field label="Select Nodes by ID" description="Defines which nodes the override will be applied to">
              <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <MultiSelect
                    value={mapping.targetNodeIds}
                    options={availableNodeIds.map((id) => ({ label: id, value: id }))}
                    onChange={(selections) => {
                      const selectedIds = selections.map((s) => s.value!);
                      updateMapping(mapping.id, { targetNodeIds: selectedIds });
                    }}
                    placeholder="Select nodes..."
                  />
                </div>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => updateMapping(mapping.id, { targetNodeIds: availableNodeIds })}
                  tooltip="Select all nodes"
                >
                  All
                </Button>
              </div>
            </Field>

            <Field
              label="Match mode"
              description="Allows you to match the node override to the value of a specific row in the data. By default, it will be matched based on the node ID"
            >
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
              mapping.targetNodeIds.length > 0 &&
              (() => {
                const detectionResult = detectionResults.get(mapping.id);

                if (!detectionResult) {
                  return (
                    <Alert severity="error" title="No matching fields found">
                      <div>No fields in the data match the selected node IDs.</div>
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
                            <Icon name="check-circle" style={{ color: '#73BF69' }} />(
                            {detectionResult.matchedIds.length}/{mapping.targetNodeIds.length})
                          </span>
                        ) : (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Icon name="exclamation-triangle" style={{ color: '#FF9830' }} />(
                            {detectionResult.matchedIds.length}/{mapping.targetNodeIds.length})
                          </span>
                        )}
                      </div>
                    </Field>

                    {detectionResult.matchPercentage < 100 && (
                      <Alert severity="warning" title="Partial match ...">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span>
                            Could not match {detectionResult.unmatchedIds.length}/{mapping.targetNodeIds.length} nodes
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
                          thresholdId: undefined,
                        })),
                      })
                    }
                    placeholder="Select match field..."
                    isClearable
                  />
                </Field>

                {mapping.matchFieldName && (
                  <Field label="Match value" description='Use "${id}" to match node ID, or select specific value'>
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
                        registerMatchValueCompletion(monaco, 'node');
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

                      mapping.targetNodeIds.forEach((nodeId) => {
                        const matchValue = mapping.matchPattern
                          ? mapping.matchPattern.replace(/\$\{id\}/g, nodeId)
                          : mapping.matchValue;

                        if (matchValue && context.data) {
                          const dataRow = findMatchedRow(context.data, mapping.matchFieldName!, matchValue);
                          if (dataRow) {
                            matchedIds.push(nodeId);
                          } else {
                            unmatchedIds.push(nodeId);
                          }
                        } else {
                          unmatchedIds.push(nodeId);
                        }
                      });

                      const matchPercentage =
                        mapping.targetNodeIds.length > 0 ? (matchedIds.length / mapping.targetNodeIds.length) * 100 : 0;

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
                                {mapping.targetNodeIds.length})
                              </span>
                            ) : matchPercentage > 0 ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Icon name="exclamation-triangle" style={{ color: '#FF9830' }} />({matchedIds.length}/
                                {mapping.targetNodeIds.length})
                              </span>
                            ) : (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Icon name="exclamation-circle" style={{ color: '#F2495C' }} />({matchedIds.length}/
                                {mapping.targetNodeIds.length})
                              </span>
                            )}
                          </div>

                          {matchPercentage < 100 && matchPercentage > 0 && (
                            <Alert severity="warning" title="Partial match ...">
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span>
                                  Could not match {unmatchedIds.length}/{mapping.targetNodeIds.length} nodes with this
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
                              <div>No data rows match the selected nodes with this configuration.</div>
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
                    {rule.kind === RuleKind.FILL_COLOR && 'Fill Color Override'}
                    {rule.kind === RuleKind.LABEL && 'Label Override'}
                  </strong>
                  <IconButton
                    name="trash-alt"
                    onClick={() => removeRule(mapping.id, ruleIndex)}
                    tooltip="Remove override"
                    size="sm"
                  />
                </div>

                {(rule.kind === RuleKind.STROKE_COLOR || rule.kind === RuleKind.FILL_COLOR) &&
                  (() => {
                    const sampleNodeId = mapping.targetNodeIds[0];
                    const matchValue = mapping.matchPattern
                      ? mapping.matchPattern.replace(/\$\{id\}/g, sampleNodeId)
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
                        registerNodeLabelCompletion(monaco, context.data, mapping);
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

                let hasMatchedNodes;
                if (matchMode === MatchMode.AUTODETECT) {
                  hasMatchedNodes = detectionResult && detectionResult.matchedIds.length > 0;
                } else {
                  hasMatchedNodes = mapping.targetNodeIds.length > 0;
                }

                const hasStrokeColor = mapping.rules.some((r) => r.kind === RuleKind.STROKE_COLOR);
                const hasFillColor = mapping.rules.some((r) => r.kind === RuleKind.FILL_COLOR);
                const hasLabel = mapping.rules.some((r) => r.kind === RuleKind.LABEL);
                const allRulesAdded = hasStrokeColor && hasFillColor && hasLabel;

                const isButtonDisabled = !hasMatchedNodes || allRulesAdded;

                return (
                  <Dropdown
                    overlay={
                      <Menu>
                        <Menu.Item
                          label="Stroke Color"
                          icon="circle"
                          onClick={() => addBorderColorRule(mapping.id)}
                          disabled={hasStrokeColor}
                        />
                        <Menu.Item
                          label="Fill Color"
                          icon="circle-mono"
                          onClick={() => addFillColorRule(mapping.id)}
                          disabled={hasFillColor}
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
                      Override node property
                    </Button>
                  </Dropdown>
                );
              })()}
            </Box>
          </Collapse>
        </div>
      ))}

      <Button icon="plus" onClick={addMapping} variant="secondary">
        Add node override rule
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
  sampleNodeId: string | undefined
): Array<SelectableValue<string>> {
  if (!data || data.length === 0 || !matchFieldName || !sampleNodeId) {
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
      const hasMatch = valuesArray.some((v: any) => String(v) === sampleNodeId);

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
        if (field.labels && field.labels[matchFieldName] === sampleNodeId) {
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
