import React, { useEffect } from 'react';
import { Modal, Input, Button, Field, Combobox } from '@grafana/ui';
import { getShapeOptions } from '../../core/builderMode';
import { useModalForm } from '../../hooks/useModalForm';

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
    onSubmit(values.nodeLabel, values.nodeShape);
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
      <Field
        label="Label"
        description="Text to display on the node. E.g. 'Server 1'. By default, it'll used the node ID"
      >
        <Input
          data-testid="node-edit-label-input"
          placeholder="Enter label (optional)"
          value={values.nodeLabel}
          onChange={(e) => handleChange('nodeLabel')(e.currentTarget.value)}
        />
      </Field>
      <Field label="Shape" description="Shape for the node.">
        <Combobox
          data-testid="node-edit-shape-select"
          options={shapeOptions}
          placeholder="Select a shape"
          value={values.nodeShape ?? null}
          onChange={(val) => handleChange('nodeShape')(val?.value)}
          isClearable
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
