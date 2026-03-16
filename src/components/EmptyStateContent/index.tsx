import React from 'react';
import { InputMode } from '../../types';
import { CodeModeContent } from './CodeModeContent';
import { BuilderModeContent } from './BuilderModeContent';
import { QueryModeContent } from './QueryModeContent';
import { DefaultContent } from './DefaultContent';

interface EmptyStateContentProps {
  inputMode: InputMode;
  onAddNode?: () => void;
}

export const EmptyStateContent: React.FC<EmptyStateContentProps> = ({ inputMode, onAddNode }) => {
  switch (inputMode) {
    case InputMode.CODE:
      return <CodeModeContent />;

    case InputMode.BUILDER:
      return onAddNode ? <BuilderModeContent onAddNode={onAddNode} /> : null;

    case InputMode.QUERY:
      return <QueryModeContent />;

    default:
      return <DefaultContent />;
  }
};
