import React, { useEffect } from 'react';
import { Modal, Input, Button, Field } from '@grafana/ui';
import { formatEdgeId, toOptional } from '../builderMode';
import { useModalForm } from '../hooks/useModalForm';

export interface EdgeEditModalProps {
  isOpen: boolean;
  sourceNodeId: string;
  targetNodeId: string;
  currentId?: string;
  currentLabel?: string;
  onSubmit: (id?: string, label?: string) => void;
  onDismiss: () => void;
}

export const EdgeEditModal: React.FC<EdgeEditModalProps> = ({
  isOpen,
  sourceNodeId,
  targetNodeId,
  currentId,
  currentLabel,
  onSubmit,
  onDismiss,
}) => {
  const { values, handleChange, setValues } = useModalForm({
    edgeId: currentId || '',
    edgeLabel: currentLabel || '',
  });

  useEffect(() => {
    setValues({ edgeId: currentId || '', edgeLabel: currentLabel || '' });
  }, [currentId, currentLabel, setValues]);

  const handleSubmit = () => {
    onSubmit(toOptional(values.edgeId), toOptional(values.edgeLabel));
    onDismiss();
  };

  const handleDismiss = () => {
    setValues({ edgeId: currentId || '', edgeLabel: currentLabel || '' });
    onDismiss();
  };

  return (
    <Modal isOpen={isOpen} title={`Edit Edge: ${sourceNodeId} → ${targetNodeId}`} onDismiss={handleDismiss}>
      <Field label="Source Node" description="Cannot be changed">
        <Input value={sourceNodeId} disabled />
      </Field>
      <Field label="Target Node" description="Cannot be changed">
        <Input value={targetNodeId} disabled />
      </Field>
      <Field label="Edge ID" description="Leave empty to auto-generate">
        <Input
          placeholder={formatEdgeId(sourceNodeId, targetNodeId)}
          value={values.edgeId}
          onChange={(e) => handleChange('edgeId')(e.currentTarget.value)}
        />
      </Field>
      <Field label="Edge Label">
        <Input
          data-testid="edge-edit-label-input"
          placeholder="Enter label (optional)"
          value={values.edgeLabel}
          onChange={(e) => handleChange('edgeLabel')(e.currentTarget.value)}
        />
      </Field>
      <Modal.ButtonRow>
        <Button variant="secondary" onClick={handleDismiss}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          Update Edge
        </Button>
      </Modal.ButtonRow>
    </Modal>
  );
};
