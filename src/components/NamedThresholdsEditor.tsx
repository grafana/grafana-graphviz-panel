import React from 'react';
import { StandardEditorProps } from '@grafana/data';
import { Button, Field, Input, ColorPicker, IconButton } from '@grafana/ui';
import { NamedThreshold, ThresholdStep } from '../types';
import { css } from '@emotion/css';

interface Props extends StandardEditorProps<NamedThreshold[]> {}

export const NamedThresholdsEditor: React.FC<Props> = ({ value, onChange }) => {
  const thresholds = value || [];

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
  };

  const removeThreshold = (id: string) => {
    onChange(thresholds.filter(threshold => threshold.id !== id));
  };

  const updateThreshold = (id: string, updates: Partial<NamedThreshold>) => {
    onChange(
      thresholds.map(threshold =>
        threshold.id === id ? { ...threshold, ...updates } : threshold
      )
    );
  };

  const addStep = (thresholdId: string) => {
    const threshold = thresholds.find(t => t.id === thresholdId);
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
    const threshold = thresholds.find(t => t.id === thresholdId);
    if (threshold && threshold.steps.length > 1) {
      updateThreshold(thresholdId, {
        steps: threshold.steps.filter((_, idx) => idx !== stepIndex),
      });
    }
  };

  const updateStep = (thresholdId: string, stepIndex: number, updates: Partial<ThresholdStep>) => {
    const threshold = thresholds.find(t => t.id === thresholdId);
    if (threshold) {
      const updatedSteps = threshold.steps.map((step, idx) =>
        idx === stepIndex ? { ...step, ...updates } : step
      );
      updateThreshold(thresholdId, { steps: updatedSteps });
    }
  };

  const thresholdContainerStyle = css`
    margin-bottom: 16px;
    padding: 12px;
    border: 1px solid rgba(204, 204, 220, 0.25);
    border-radius: 4px;
  `;

  const stepContainerStyle = css`
    margin-top: 8px;
    padding: 8px;
    background: rgba(100, 100, 100, 0.1);
    border-radius: 4px;
  `;

  const headerStyle = css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
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
        <div key={threshold.id} className={thresholdContainerStyle}>
          <div className={headerStyle}>
            <strong>Threshold Set {index + 1}</strong>
            <IconButton
              name="trash-alt"
              onClick={() => removeThreshold(threshold.id)}
              tooltip="Remove threshold set"
            />
          </div>

          <Field label="Name">
            <Input
              value={threshold.name}
              onChange={(e) => updateThreshold(threshold.id, { name: e.currentTarget.value })}
              placeholder="e.g., CPU Thresholds"
            />
          </Field>

          <div className={stepContainerStyle}>
            <strong>Threshold Steps</strong>
            {threshold.steps.map((step, stepIndex) => (
              <div key={stepIndex} className={stepRowStyle}>
                <Field label="Value" style={{ flex: 1, marginBottom: 0 }}>
                  <Input
                    type="number"
                    value={step.value}
                    onChange={(e) =>
                      updateStep(threshold.id, stepIndex, { value: parseFloat(e.currentTarget.value) || 0 })
                    }
                  />
                </Field>
                <Field label="Color" style={{ marginBottom: 0 }}>
                  <ColorPicker
                    color={step.color}
                    onChange={(color) => updateStep(threshold.id, stepIndex, { color })}
                  />
                </Field>
                {threshold.steps.length > 1 && (
                  <IconButton
                    name="trash-alt"
                    onClick={() => removeStep(threshold.id, stepIndex)}
                    tooltip="Remove step"
                    size="sm"
                  />
                )}
              </div>
            ))}
            <Button
              icon="plus"
              onClick={() => addStep(threshold.id)}
              variant="secondary"
              size="sm"
              style={{ marginTop: '8px' }}
            >
              Add Step
            </Button>
          </div>
        </div>
      ))}

      <Button icon="plus" onClick={addThreshold} variant="secondary">
        Add Threshold Set
      </Button>
    </div>
  );
};

