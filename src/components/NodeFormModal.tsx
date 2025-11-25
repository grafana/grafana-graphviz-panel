import React from 'react';
import { Modal, Input, Button, Combobox, Field } from '@grafana/ui';
import { getShapeOptions, toOptional } from '../builderMode';
import { useModalForm } from '../hooks/useModalForm';

export interface NodeFormModalProps {
  isOpen: boolean;
  existingNodeIds: string[];
  onSubmit: (id: string, label?: string, shape?: string) => void;
  onDismiss: () => void;
}

export const NodeFormModal: React.FC<NodeFormModalProps> = ({ isOpen, existingNodeIds, onSubmit, onDismiss }) => {
  const { values, error, setError, handleChange, resetForm } = useModalForm({
    nodeId: '',
    nodeLabel: '',
    nodeShape: undefined as string | undefined,
  });

  const shapeOptions = getShapeOptions();

  const handleSubmit = () => {
    if (!values.nodeId.trim()) {
      setError('Node ID is required');
      return;
    }

    if (existingNodeIds.includes(values.nodeId)) {
      setError('Node ID already exists');
      return;
    }

    onSubmit(values.nodeId, toOptional(values.nodeLabel), values.nodeShape);
    resetForm();
  };

  const handleDismiss = () => {
    resetForm();
    onDismiss();
  };

  return (
    <Modal isOpen={isOpen} title="Add Node" onDismiss={handleDismiss}>
      <Field label="Node ID" required invalid={!!error} error={error}>
        <Input
          placeholder="Enter node ID"
          value={values.nodeId}
          onChange={(e) => handleChange('nodeId')(e.currentTarget.value)}
        />
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
          Add Node
        </Button>
      </Modal.ButtonRow>
    </Modal>
  );
};
