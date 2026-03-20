import { GraphvizAssistantService, AssistantContext } from './assistantService';
import { openAssistant, createAssistantContextItem } from '@grafana/assistant';
import { LayoutEngine } from './types';

jest.mock('@grafana/assistant', () => ({
  openAssistant: jest.fn(),
  createAssistantContextItem: jest.fn((type, data) => ({ type, ...data })),
}));

describe('GraphvizAssistantService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('openWithContext', () => {
    it('should call openAssistant with correct parameters', () => {
      const context: AssistantContext = {
        dotDiagram: 'digraph G { A -> B; }',
        layoutEngine: LayoutEngine.HIERARCHICAL,
        inputMode: 'code',
      };

      GraphvizAssistantService.openWithContext('Help me', context);

      expect(openAssistant).toHaveBeenCalledWith({
        origin: 'grafana-graphviz-panel',
        prompt: 'Help me',
        context: expect.any(Array),
        autoSend: true,
      });
    });

    it('should create context item with correct structure', () => {
      const context: AssistantContext = {
        dotDiagram: 'digraph G { A -> B; }',
        layoutEngine: LayoutEngine.NETWORK,
        inputMode: 'builder',
      };

      GraphvizAssistantService.openWithContext('Test prompt', context);

      expect(createAssistantContextItem).toHaveBeenCalledWith('structured', {
        title: 'Graphviz Panel Context',
        data: {
          dotDiagram: 'digraph G { A -> B; }',
          layoutEngine: LayoutEngine.NETWORK,
          inputMode: 'builder',
          capabilities: [
            'DOT syntax validation',
            'Layout engine selection (dot, neato, fdp, circo, twopi)',
            'Builder mode for visual editing',
            'Node and edge styling overrides',
          ],
          instructions: 'Help the user with their Graphviz panel diagram.',
        },
      });
    });

    it('should include error in context when error is provided', () => {
      const context: AssistantContext = {
        dotDiagram: 'digraph G { A -> }',
        layoutEngine: LayoutEngine.HIERARCHICAL,
        inputMode: 'code',
        error: {
          message: 'Syntax error',
          lineNumber: 1,
          lineContent: 'A ->',
        },
      };

      GraphvizAssistantService.openWithContext('Fix this error', context);

      expect(createAssistantContextItem).toHaveBeenCalledWith('structured', {
        title: 'Graphviz Panel Context',
        data: expect.objectContaining({
          error: {
            message: 'Syntax error',
            lineNumber: 1,
            lineContent: 'A ->',
          },
        }),
      });
    });

    it('should not include error field when no error is provided', () => {
      const context: AssistantContext = {
        dotDiagram: 'digraph G { A -> B; }',
        layoutEngine: LayoutEngine.HIERARCHICAL,
        inputMode: 'code',
      };

      GraphvizAssistantService.openWithContext('Help', context);

      const call = (createAssistantContextItem as jest.Mock).mock.calls[0][1];
      expect(call.data.error).toBeUndefined();
    });

    it('should use error-specific instructions when error is provided', () => {
      const context: AssistantContext = {
        dotDiagram: 'invalid',
        layoutEngine: LayoutEngine.HIERARCHICAL,
        inputMode: 'code',
        error: {
          message: 'Parse error',
        },
      };

      GraphvizAssistantService.openWithContext('Help fix', context);

      expect(createAssistantContextItem).toHaveBeenCalledWith(
        'structured',
        expect.objectContaining({
          data: expect.objectContaining({
            instructions: 'Help the user fix the DOT diagram error. Analyze the syntax issue and suggest corrections.',
          }),
        })
      );
    });

    it('should use general instructions when no error is provided', () => {
      const context: AssistantContext = {
        dotDiagram: 'digraph G {}',
        layoutEngine: LayoutEngine.HIERARCHICAL,
        inputMode: 'code',
      };

      GraphvizAssistantService.openWithContext('Help', context);

      expect(createAssistantContextItem).toHaveBeenCalledWith(
        'structured',
        expect.objectContaining({
          data: expect.objectContaining({
            instructions: 'Help the user with their Graphviz panel diagram.',
          }),
        })
      );
    });

    it('should include all capabilities in context', () => {
      const context: AssistantContext = {
        dotDiagram: '',
        layoutEngine: LayoutEngine.CIRCULAR,
        inputMode: 'query',
      };

      GraphvizAssistantService.openWithContext('Show capabilities', context);

      expect(createAssistantContextItem).toHaveBeenCalledWith(
        'structured',
        expect.objectContaining({
          data: expect.objectContaining({
            capabilities: [
              'DOT syntax validation',
              'Layout engine selection (dot, neato, fdp, circo, twopi)',
              'Builder mode for visual editing',
              'Node and edge styling overrides',
            ],
          }),
        })
      );
    });

    it('should handle all layout engine types', () => {
      const engines = [
        LayoutEngine.HIERARCHICAL,
        LayoutEngine.NETWORK,
        LayoutEngine.FORCE_DIRECTED,
        LayoutEngine.CIRCULAR,
      ];

      engines.forEach((engine) => {
        jest.clearAllMocks();
        const context: AssistantContext = {
          dotDiagram: 'digraph G {}',
          layoutEngine: engine,
          inputMode: 'code',
        };

        GraphvizAssistantService.openWithContext('Test', context);

        expect(createAssistantContextItem).toHaveBeenCalledWith(
          'structured',
          expect.objectContaining({
            data: expect.objectContaining({
              layoutEngine: engine,
            }),
          })
        );
      });
    });

    it('should handle all input modes', () => {
      const modes = ['code', 'builder', 'query'];

      modes.forEach((mode) => {
        jest.clearAllMocks();
        const context: AssistantContext = {
          dotDiagram: 'digraph G {}',
          layoutEngine: LayoutEngine.HIERARCHICAL,
          inputMode: mode,
        };

        GraphvizAssistantService.openWithContext('Test', context);

        expect(createAssistantContextItem).toHaveBeenCalledWith(
          'structured',
          expect.objectContaining({
            data: expect.objectContaining({
              inputMode: mode,
            }),
          })
        );
      });
    });

    it('should handle error with only message field', () => {
      const context: AssistantContext = {
        dotDiagram: 'digraph G {}',
        layoutEngine: LayoutEngine.HIERARCHICAL,
        inputMode: 'code',
        error: {
          message: 'Simple error',
        },
      };

      GraphvizAssistantService.openWithContext('Fix', context);

      expect(createAssistantContextItem).toHaveBeenCalledWith(
        'structured',
        expect.objectContaining({
          data: expect.objectContaining({
            error: {
              message: 'Simple error',
            },
          }),
        })
      );
    });

    it('should handle empty dot diagram', () => {
      const context: AssistantContext = {
        dotDiagram: '',
        layoutEngine: LayoutEngine.HIERARCHICAL,
        inputMode: 'code',
      };

      GraphvizAssistantService.openWithContext('Create diagram', context);

      expect(createAssistantContextItem).toHaveBeenCalledWith(
        'structured',
        expect.objectContaining({
          data: expect.objectContaining({
            dotDiagram: '',
          }),
        })
      );
    });

    it('should handle complex dot diagram with special characters', () => {
      const context: AssistantContext = {
        dotDiagram: 'digraph G {\n  A [label="Node\\nWith\\nNewlines"];\n  B [label="Special: <>&"];\n}',
        layoutEngine: LayoutEngine.HIERARCHICAL,
        inputMode: 'code',
      };

      GraphvizAssistantService.openWithContext('Help', context);

      expect(createAssistantContextItem).toHaveBeenCalledWith(
        'structured',
        expect.objectContaining({
          data: expect.objectContaining({
            dotDiagram: 'digraph G {\n  A [label="Node\\nWith\\nNewlines"];\n  B [label="Special: <>&"];\n}',
          }),
        })
      );
    });

    it('should set autoSend to true', () => {
      const context: AssistantContext = {
        dotDiagram: 'digraph G {}',
        layoutEngine: LayoutEngine.HIERARCHICAL,
        inputMode: 'code',
      };

      GraphvizAssistantService.openWithContext('Test', context);

      expect(openAssistant).toHaveBeenCalledWith(
        expect.objectContaining({
          autoSend: true,
        })
      );
    });

    it('should set origin to grafana-graphviz-panel', () => {
      const context: AssistantContext = {
        dotDiagram: 'digraph G {}',
        layoutEngine: LayoutEngine.HIERARCHICAL,
        inputMode: 'code',
      };

      GraphvizAssistantService.openWithContext('Test', context);

      expect(openAssistant).toHaveBeenCalledWith(
        expect.objectContaining({
          origin: 'grafana-graphviz-panel',
        })
      );
    });

    it('should pass prompt through unchanged', () => {
      const context: AssistantContext = {
        dotDiagram: 'digraph G {}',
        layoutEngine: LayoutEngine.HIERARCHICAL,
        inputMode: 'code',
      };

      GraphvizAssistantService.openWithContext('My custom prompt with special chars: <>&', context);

      expect(openAssistant).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: 'My custom prompt with special chars: <>&',
        })
      );
    });
  });
});
