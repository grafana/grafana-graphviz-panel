import React, { useState } from 'react';
import { StandardEditorProps } from '@grafana/data';
import { Button, Input, ColorPicker, IconButton, Collapse, Icon } from '@grafana/ui';
import { NamedThreshold, ThresholdStep } from '../../types';
import { css } from '@emotion/css';
import { useDebouncedCallback, USER_INPUT_DEBOUNCE_SLOW_MS } from '../../hooks';

interface Props extends StandardEditorProps<NamedThreshold[]> {}

export const NamedThresholdsEditor: React.FC<Props> = ({ value, onChange }) => {
  const thresholds = value || [];
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [stepInputValues, setStepInputValues] = useState<Record<string, string>>({});

  const addThreshold = () => {
    const newThreshold: NamedThreshold = {
      id: `threshold-${Date.now()}`,
      name: `Threshold ${thresholds.length + 1}`,
      steps: [
        { value: 0, color: '#73BF69' },
        { value: 80, color: '#F2495C' },
      ],
    };
    onChange([...thresholds, newThreshold]);
    setOpenSections((prev) => ({ ...prev, [newThreshold.id]: true }));
  };

  const removeThreshold = (id: string) => {
    onChange(thresholds.filter((threshold) => threshold.id !== id));
  };

  const updateThreshold = (id: string, updates: Partial<NamedThreshold>) => {
    onChange(thresholds.map((threshold) => (threshold.id === id ? { ...threshold, ...updates } : threshold)));
  };

  const addStep = (thresholdId: string) => {
    const threshold = thresholds.find((t) => t.id === thresholdId);
    if (threshold) {
      const lastStep = threshold.steps[threshold.steps.length - 1];
      const newStep: ThresholdStep = {
        value: lastStep ? lastStep.value + 10 : 0,
        color: '#FADE2A',
      };
      updateThreshold(thresholdId, {
        steps: [...threshold.steps, newStep],
      });
    }
  };

  const removeStep = (thresholdId: string, stepIndex: number) => {
    const threshold = thresholds.find((t) => t.id === thresholdId);
    if (threshold && threshold.steps.length > 1) {
      updateThreshold(thresholdId, {
        steps: threshold.steps.filter((_, idx) => idx !== stepIndex),
      });
    }
  };

  const updateStep = (thresholdId: string, stepIndex: number, updates: Partial<ThresholdStep>) => {
    const threshold = thresholds.find((t) => t.id === thresholdId);
    if (threshold) {
      const updatedSteps = threshold.steps.map((step, idx) => (idx === stepIndex ? { ...step, ...updates } : step));
      updateThreshold(thresholdId, { steps: updatedSteps });
    }
  };

  const debouncedUpdateStepColor = useDebouncedCallback(
    (thresholdId: string, stepIndex: number, color: string) => updateStep(thresholdId, stepIndex, { color }),
    USER_INPUT_DEBOUNCE_SLOW_MS
  );

  const thresholdContainerStyle = css`
    margin-bottom: 16px;
    padding: 8px;
    border: 1px solid rgba(204, 204, 220, 0.25);
    border-radius: 4px;
  `;

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const stepContainerStyle = css`
    padding: 8px;
    background: rgba(100, 100, 100, 0.1);
    border-radius: 4px;
  `;

  const stepRowStyle = css`
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 8px;
  `;

  return (
    <div>
      {thresholds.map((threshold, index) => (
        <Collapse
          key={threshold.id}
          className={thresholdContainerStyle}
          label={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              {editingNameId === threshold.id ? (
                <Input
                  data-testid={`threshold-name-input-${threshold.id}`}
                  value={threshold.name}
                  onChange={(e) => updateThreshold(threshold.id, { name: e.currentTarget.value })}
                  onBlur={() => setEditingNameId(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setEditingNameId(null);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="e.g., CPU Thresholds"
                  autoFocus
                />
              ) : (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingNameId(threshold.id);
                  }}
                  style={{ cursor: 'hand', display: 'flex', alignItems: 'center', gap: '6px' }}
                  title="Click to edit name"
                >
                  <p style={{ margin: 0 }}>{threshold.name || 'Unnamed threshold'}</p>
                  <Icon name="pen" />
                </span>
              )}
              <IconButton
                name="trash-alt"
                onClick={(e) => {
                  e.stopPropagation();
                  removeThreshold(threshold.id);
                }}
                tooltip="Remove threshold set"
              />
            </div>
          }
          isOpen={openSections[threshold.id] ?? true}
          onToggle={() => toggleSection(threshold.id)}
          collapsible={true}
        >
          <div className={stepContainerStyle}>
            {threshold.steps.map((step, stepIndex) => {
              const stepKey = `${threshold.id}-${stepIndex}`;
              return (
                <div key={stepIndex} className={stepRowStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                    <Input
                      type="number"
                      data-testid={`threshold-${threshold.id}-step-${stepIndex}-value`}
                      value={stepInputValues[stepKey] ?? String(step.value)}
                      onChange={(e) => {
                        const raw = e.currentTarget.value;
                        setStepInputValues((prev) => ({
                          ...prev,
                          [stepKey]: raw,
                        }));
                      }}
                      onBlur={(e) => {
                        const raw = e.currentTarget.value;
                        const parsed = parseFloat(raw);
                        const committed = isNaN(parsed) ? 0 : parsed;
                        updateStep(threshold.id, stepIndex, { value: committed });
                        setStepInputValues((prev) => {
                          const next = { ...prev };
                          delete next[stepKey];
                          return next;
                        });
                      }}
                    />
                    <ColorPicker
                      data-testid={`threshold-${threshold.id}-step-${stepIndex}-color`}
                      color={step.color}
                      onChange={(color) => debouncedUpdateStepColor(threshold.id, stepIndex, color)}
                    />
                    {threshold.steps.length > 1 && (
                      <IconButton
                        name="trash-alt"
                        onClick={() => removeStep(threshold.id, stepIndex)}
                        tooltip="Remove step"
                        size="sm"
                      />
                    )}
                  </div>
                </div>
              );
            })}
            <Button
              icon="plus"
              onClick={() => addStep(threshold.id)}
              variant="secondary"
              size="sm"
              style={{ marginTop: '8px' }}
              data-testid={`add-threshold-step-${threshold.id}`}
            >
              Add Step
            </Button>
          </div>
        </Collapse>
      ))}

      <Button icon="plus" onClick={addThreshold} variant="secondary" data-testid="add-threshold-set">
        Add Threshold Set
      </Button>
    </div>
  );
};
