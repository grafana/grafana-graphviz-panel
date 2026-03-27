import React, { useState, useEffect } from 'react';
import { Alert, Input, Stack, Icon, Text, Box } from '@grafana/ui';
import { css } from '@emotion/css';
import { isAssistantAvailable as checkAssistantAvailability } from '@grafana/assistant';
import { ValidationErrorInfo } from '../core/validation';
import { GraphvizAssistantService } from '../assistantService';
import { LayoutEngine, InputMode } from '../types';
import { AskButton } from './AskButton';

interface ErrorDisplayProps {
  errorMessage: string;
  errorInfo?: ValidationErrorInfo;
  dotDiagram: string;
  layoutEngine: LayoutEngine;
  inputMode: InputMode;
  isEditMode: boolean;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  errorMessage,
  errorInfo,
  dotDiagram,
  layoutEngine,
  inputMode,
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

    GraphvizAssistantService.openWithContext(prompt, {
      dotDiagram,
      layoutEngine,
      inputMode,
      error: {
        message: errorMessage,
        lineNumber: errorInfo?.lineNumber,
        lineContent: errorInfo?.lineContent,
      },
    });

    setPrompt('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAsk();
    }
  };

  const codeStyle = css`
    display: block;
    margin-top: 8px;
    font-family: monospace;
    font-size: 0.9em;
  `;

  return (
    <Box display="flex" direction="column" height="100%">
      <Box padding={2}>
        <Stack direction="row" justifyContent="center">
          <Box width="600px">
            <Alert severity="error" title="Invalid DOT diagram definition">
              <Stack direction="column" gap={2}>
                <div>{errorMessage}</div>
                {errorInfo && (
                  <code className={codeStyle}>
                    {errorInfo.lineNumber}: {errorInfo.lineContent}
                  </code>
                )}
              </Stack>
            </Alert>
          </Box>
        </Stack>
      </Box>

      {isEditMode && isAssistantAvailable && (
        <Box display="flex" alignItems="center" justifyContent="center" padding={2} grow={1}>
          <Box width="600px">
            <Stack direction="column" gap={2}>
              <Stack direction="row" alignItems="center" gap={1}>
                <Icon name="ai" size="lg" />
                <Text variant="h5">Ask the Grafana AI assistant for help:</Text>
              </Stack>
              <Stack direction="row" gap={1}>
                <Input
                  placeholder='example: "How do I fix this DOT syntax error?"'
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
