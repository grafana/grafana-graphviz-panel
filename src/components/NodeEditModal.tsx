import React, { useEffect } from 'react';
import { Modal, Input, Button, Combobox, Field } from '@grafana/ui';
import { getShapeOptions, toOptional } from '../builderMode';
import { useModalForm } from '../hooks/useModalForm';

export interface NodeEditModalProps {
  isOpen: boolean;
  nodeId: string;
  currentLabel?: string;
  currentShape?: string;
  onSubmit: (label?: string, shape?: string) => void;
  onDismiss: () => void;
}

export const NodeEditModal: React.FC<NodeEditModalProps> = ({
  isOpen,
  nodeId,
  currentLabel,
  currentShape,
  onSubmit,
  onDismiss,
}) => {
  const { values, handleChange, setValues } = useModalForm({
    nodeLabel: currentLabel || '',
    nodeShape: currentShape,
  });

  useEffect(() => {
    setValues({ nodeLabel: currentLabel || '', nodeShape: currentShape });
  }, [currentLabel, currentShape, setValues]);

  const shapeOptions = getShapeOptions();

  const handleSubmit = () => {
    onSubmit(toOptional(values.nodeLabel), values.nodeShape);
    onDismiss();
  };

  const handleDismiss = () => {
    setValues({ nodeLabel: currentLabel || '', nodeShape: currentShape });
    onDismiss();
  };

  return (
    <Modal isOpen={isOpen} title="Edit Node" onDismiss={handleDismiss}>
      <Field label="Node ID" description="Cannot be changed">
        <Input value={nodeId} disabled />
      </Field>
      <Field label="Label">
        <Input
          placeholder="Enter label (optional)"
          value={values.nodeLabel}
          onChange={(e) => handleChange('nodeLabel')(e.currentTarget.value)}
        />
      </Field>
      <Field label="Shape">
        <Combobox
          options={shapeOptions}
          placeholder="Select shape (optional)"
          value={values.nodeShape}
          onChange={(val) => handleChange('nodeShape')(val?.value)}
        />
      </Field>
      <Modal.ButtonRow>
        <Button variant="secondary" onClick={handleDismiss}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          Update Node
        </Button>
      </Modal.ButtonRow>
    </Modal>
  );
};
