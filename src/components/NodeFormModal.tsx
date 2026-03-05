import React from 'react';
import { Modal, Input, Button, Select, Field } from '@grafana/ui';
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
      <Field
        label="Node ID"
        required
        invalid={!!error}
        error={error}
        description="Used to identify the node when connecting edges, overrides, etc."
      >
        <Input
          data-testid="node-form-id-input"
          placeholder="E.g 'server_1'"
          value={values.nodeId}
          onChange={(e) => handleChange('nodeId')(e.currentTarget.value)}
        />
      </Field>
      <Field label="Label (optional)" description="Text to display on the node. By default, it'll used the node ID">
        <Input
          data-testid="node-form-label-input"
          placeholder="E.g 'Server 1'"
          value={values.nodeLabel}
          onChange={(e) => handleChange('nodeLabel')(e.currentTarget.value)}
        />
      </Field>
      <Field label="Shape (optional)" description="Shape for the node. By default, it'll be rendered as a box">
        <Select
          options={shapeOptions}
          placeholder="Select shape"
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
