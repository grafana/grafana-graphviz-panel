import React from 'react';
import { Button } from '@grafana/ui';

interface BuilderModeContentProps {
  onAddNode: () => void;
}

export const BuilderModeContent: React.FC<BuilderModeContentProps> = ({ onAddNode }) => (
  <Button icon="plus-square" onClick={onAddNode}>
    Add Node
  </Button>
);
