import React from 'react';
import { Button } from '@grafana/ui';

interface BuilderModeContentProps {
  onAddNode: () => void;
}

export const BuilderModeContent: React.FC<BuilderModeContentProps> = ({ onAddNode }) => (
  <Button data-testid="empty-state-add-node" icon="plus-square" onClick={onAddNode}>
    Add Node
  </Button>
);
