import React, { useEffect, useState } from 'react';
import { Modal, Input, Button, Field, Combobox } from '@grafana/ui';
import { getShapeOptions, isValidShapeName } from '../../core/builderMode';
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

  const [shapeError, setShapeError] = useState<string | undefined>();

  useEffect(() => {
    setValues({ nodeLabel: currentLabel || '', nodeShape: currentShape });
    setShapeError(undefined);
  }, [currentLabel, currentShape, setValues]);

  const shapeOptions = getShapeOptions();

  const handleShapeChange = (val: { value: string } | null) => {
    const shape = val?.value;
    if (shape && !isValidShapeName(shape)) {
      setShapeError(`'${shape}' is not a valid Graphviz shape`);
    } else {
      setShapeError(undefined);
    }
    handleChange('nodeShape')(shape);
  };

  const handleSubmit = () => {
    if (shapeError) {
      return;
    }
    onSubmit(values.nodeLabel, values.nodeShape);
    onDismiss();
  };

  const handleDismiss = () => {
    setValues({ nodeLabel: currentLabel || '', nodeShape: currentShape });
    setShapeError(undefined);
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
      <Field label="Shape" description="Shape for the node." invalid={!!shapeError} error={shapeError}>
        <Combobox
          data-testid="node-edit-shape-select"
          options={shapeOptions}
          placeholder="Select or type a shape"
          value={values.nodeShape ?? null}
          onChange={handleShapeChange}
          createCustomValue
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
