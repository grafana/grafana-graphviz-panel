import React, { useState, useEffect } from 'react';
import { Input, Stack, Icon, Text, Box } from '@grafana/ui';
import { isAssistantAvailable as checkAssistantAvailability } from '@grafana/assistant';
import { GraphvizAssistantService } from '../integrations/grafanaAssistant';
import { LayoutEngine, InputMode } from '../types';
import { AskButton } from './AskButton';
import { EmptyStateAlert } from './EmptyStateAlert';
import { EmptyStateContent } from './EmptyStateContent';

interface EmptyDiagramDisplayProps {
  dotDiagram: string;
  layoutEngine: LayoutEngine;
  inputMode: InputMode;
  isEditMode: boolean;
  onAddNode?: () => void;
}

export const EmptyDiagramDisplay: React.FC<EmptyDiagramDisplayProps> = ({
  dotDiagram,
  layoutEngine,
  inputMode,
  isEditMode,
  onAddNode,
}) => {
  const [isAssistantAvailable, setIsAssistantAvailable] = useState(false);
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    const subscription = checkAssistantAvailability().subscribe((available) => {
      setIsAssistantAvailable(available);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAsk = () => {
    if (!prompt.trim()) {
      return;
    }

    GraphvizAssistantService.openWithContext(prompt, {
      dotDiagram,
      layoutEngine,
      inputMode,
    });

    setPrompt('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAsk();
    }
  };

  return (
    <Box display="flex" direction="column" height="100%">
      <EmptyStateAlert>
        {isEditMode && <EmptyStateContent inputMode={inputMode} onAddNode={onAddNode} />}
      </EmptyStateAlert>

      {isAssistantAvailable && (
        <Box display="flex" alignItems="center" justifyContent="center" padding={2} grow={1}>
          <Box width="600px">
            <Stack direction="column" gap={2}>
              <Stack direction="row" alignItems="center" gap={1}>
                <Icon name="ai" size="lg" />
                <Text variant="h5">Ask the Grafana AI assistant for help:</Text>
              </Stack>
              <Stack direction="row" gap={1}>
                <Input
                  placeholder='example: "Create a simple diagram with nodes representing my data."'
                  value={prompt}
                  onChange={(e) => setPrompt(e.currentTarget.value)}
                  onKeyDown={handleKeyDown}
                />
                <AskButton onClick={handleAsk} disabled={!prompt.trim()} />
              </Stack>
            </Stack>
          </Box>
        </Box>
      )}
    </Box>
  );
};
