import { openAssistant, createAssistantContextItem } from '@grafana/assistant';
import { LayoutEngine } from '../types';

export interface AssistantContext {
  dotDiagram: string;
  layoutEngine: LayoutEngine;
  inputMode: string;
  error?: {
    message: string;
    lineNumber?: number;
    lineContent?: string;
  };
}

export class GraphvizAssistantService {
  static openWithContext(prompt: string, context: AssistantContext) {
    const contextItems = [
      createAssistantContextItem('structured', {
        title: 'Graphviz Panel Context',
        data: {
          dotDiagram: context.dotDiagram,
          layoutEngine: context.layoutEngine,
          inputMode: context.inputMode,
          ...(context.error && {
            error: context.error,
          }),
          capabilities: [
            'DOT syntax validation',
            'Layout engine selection (dot, neato, fdp, circo, twopi)',
            'Builder mode for visual editing',
            'Node and edge styling overrides',
          ],
          instructions: context.error
            ? 'Help the user fix the DOT diagram error. Analyze the syntax issue and suggest corrections.'
            : 'Help the user with their Graphviz panel diagram.',
        },
      }),
    ];

    openAssistant({
      origin: 'grafana-graphviz-panel',
      prompt,
      context: contextItems,
      autoSend: true,
    });
  }
}
