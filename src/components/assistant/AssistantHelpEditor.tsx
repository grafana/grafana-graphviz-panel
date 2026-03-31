import React, { useState, useEffect } from 'react';
import { StandardEditorProps } from '@grafana/data';
import { Input, Stack, Icon, Text, LinkButton } from '@grafana/ui';
import { isAssistantAvailable as checkAssistantAvailability } from '@grafana/assistant';
import { PanelOptions } from '../../types';
import { GraphvizAssistantService } from '../../integrations/grafanaAssistant';
import { AskButton } from './AskButton';

export const AssistantHelpEditor: React.FC<StandardEditorProps<string, any, PanelOptions>> = ({ context }) => {
  const [isAssistantAvailable, setIsAssistantAvailable] = useState(false);
  const [prompt, setPrompt] = useState('');
  const options = context.options;

  useEffect(() => {
    const subscription = checkAssistantAvailability().subscribe((available) => {
      setIsAssistantAvailable(available);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAsk = () => {
    if (!prompt.trim() || !options) {
      return;
    }

    GraphvizAssistantService.openWithContext(prompt, {
      dotDiagram: options.dotDiagram,
      layoutEngine: options.layoutEngine,
      inputMode: options.inputMode || 'code',
    });

    setPrompt('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAsk();
    }
  };

  if (!isAssistantAvailable) {
    return (
      <Stack direction="row" alignItems="center" gap={1}>
        <Icon name="question-circle" size="sm" />
        <Text variant="bodySmall" color="secondary">
          Need help?
        </Text>
        <LinkButton
          variant="secondary"
          size="sm"
          href="https://github.com/grafana/grafana-graphviz-panel/blob/main/README.md"
          target="_blank"
          rel="noopener noreferrer"
        >
          View documentation
        </LinkButton>
      </Stack>
    );
  }

  return (
    <Stack direction="column" gap={2}>
      <Stack direction="row" alignItems="center" gap={1}>
        <Icon name="ai" size="sm" />
        <Text variant="bodySmall" color="secondary">
          Ask the Grafana AI assistant for help:
        </Text>
      </Stack>
      <Stack direction="row" gap={1}>
        <Input
          placeholder='example: "Diagram my data."'
          value={prompt}
          onChange={(e) => setPrompt(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
        />
        <AskButton onClick={handleAsk} disabled={!prompt.trim()} />
      </Stack>
    </Stack>
  );
};
