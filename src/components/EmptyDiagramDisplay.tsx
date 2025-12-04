import React, { useState, useEffect } from 'react';
import { Button, Input, Stack, Alert, Icon, Text, Box } from '@grafana/ui';
import { isAssistantAvailable as checkAssistantAvailability } from '@grafana/assistant';
import { MeshAssistantService } from '../assistantService';
import { LayoutEngine, InputMode } from '../types';

interface EmptyDiagramDisplayProps {
  dotDiagram: string;
  layoutEngine: LayoutEngine;
  inputMode: InputMode;
  panelId: number;
  isEditMode: boolean;
}

export const EmptyDiagramDisplay: React.FC<EmptyDiagramDisplayProps> = ({
  dotDiagram,
  layoutEngine,
  inputMode,
  panelId,
  isEditMode,
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

    MeshAssistantService.openWithContext(prompt, {
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
      <Box padding={2}>
        <Stack direction="row" justifyContent="center">
          <Box width="600px">
            <Alert title="This diagram is empty!" severity="info">
              <Stack direction="column" gap={2}>
                <div>Diagrams require at least one node, none have been added.</div>
                {isEditMode && (
                  <div>
                    Update the Diagram in panel options <Icon name="arrow-right" />
                  </div>
                )}
              </Stack>
            </Alert>
          </Box>
        </Stack>
      </Box>

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
                  placeholder="example: &quot;Create a simple diagram with nodes representing my data.&quot;"
                  value={prompt}
                  onChange={(e) => setPrompt(e.currentTarget.value)}
                  onKeyDown={handleKeyDown}
                />
                <Button onClick={handleAsk} disabled={!prompt.trim()}>
                  Ask
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Box>
      )}
    </Box>
  );
};
