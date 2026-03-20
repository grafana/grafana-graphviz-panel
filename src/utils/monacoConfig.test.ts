import {
  SINGLE_LINE_MONACO_OPTIONS,
  registerSingleLineKeyCommands,
  registerMatchValueCompletion,
  getSuggestionsForEdge,
  getSuggestionsForNode,
  registerEdgeLabelCompletion,
  registerNodeLabelCompletion,
  EdgeOverrideWithTargets,
  NodeOverrideWithTargets,
} from './monacoConfig';
import { CodeEditorSuggestionItemKind } from '@grafana/ui';
import { createDataFrame, FieldType } from '@grafana/data';

describe('monacoConfig', () => {
  describe('SINGLE_LINE_MONACO_OPTIONS', () => {
    it('should have correct configuration', () => {
      expect(SINGLE_LINE_MONACO_OPTIONS.lineNumbers).toBe('off');
      expect(SINGLE_LINE_MONACO_OPTIONS.folding).toBe(false);
      expect(SINGLE_LINE_MONACO_OPTIONS.wordWrap).toBe('off');
      expect(SINGLE_LINE_MONACO_OPTIONS.quickSuggestions).toBe(true);
      expect(SINGLE_LINE_MONACO_OPTIONS.suggestOnTriggerCharacters).toBe(true);
    });
  });

  describe('registerSingleLineKeyCommands', () => {
    it('should register Enter and Tab key commands', () => {
      const mockEditor = {
        addCommand: jest.fn(),
        trigger: jest.fn(),
      };

      const mockMonaco = {
        KeyCode: {
          Enter: 3,
          Tab: 2,
        },
      };

      registerSingleLineKeyCommands(mockEditor as any, mockMonaco as any);

      expect(mockEditor.addCommand).toHaveBeenCalledTimes(2);
      expect(mockEditor.addCommand).toHaveBeenCalledWith(3, expect.any(Function));
      expect(mockEditor.addCommand).toHaveBeenCalledWith(2, expect.any(Function));
    });

    it('should trigger hideSuggestWidget on Enter', () => {
      const mockEditor = {
        addCommand: jest.fn((keyCode, callback) => {
          if (keyCode === 3) {
            callback();
          }
        }),
        trigger: jest.fn(),
      };

      const mockMonaco = {
        KeyCode: {
          Enter: 3,
          Tab: 2,
        },
      };

      registerSingleLineKeyCommands(mockEditor as any, mockMonaco as any);

      expect(mockEditor.trigger).toHaveBeenCalledWith('keyboard', 'hideSuggestWidget', {});
    });

    it('should trigger acceptSelectedSuggestion on Tab', () => {
      const mockEditor = {
        addCommand: jest.fn((keyCode, callback) => {
          if (keyCode === 2) {
            callback();
          }
        }),
        trigger: jest.fn(),
      };

      const mockMonaco = {
        KeyCode: {
          Enter: 3,
          Tab: 2,
        },
      };

      registerSingleLineKeyCommands(mockEditor as any, mockMonaco as any);

      expect(mockEditor.trigger).toHaveBeenCalledWith('keyboard', 'acceptSelectedSuggestion', {});
    });
  });

  describe('registerMatchValueCompletion', () => {
    it('should register completion provider for nodes', () => {
      const mockMonaco = {
        languages: {
          registerCompletionItemProvider: jest.fn(),
          CompletionItemKind: {
            Variable: 1,
          },
        },
      };

      registerMatchValueCompletion(mockMonaco as any, 'node');

      expect(mockMonaco.languages.registerCompletionItemProvider).toHaveBeenCalledWith(
        'plaintext',
        expect.objectContaining({
          provideCompletionItems: expect.any(Function),
        })
      );
    });

    it('should provide ${id} suggestion for nodes', () => {
      let providerCallback: any;
      const mockMonaco = {
        languages: {
          registerCompletionItemProvider: jest.fn((_lang, provider) => {
            providerCallback = provider.provideCompletionItems;
          }),
          CompletionItemKind: {
            Variable: 1,
          },
        },
      };

      registerMatchValueCompletion(mockMonaco as any, 'node');

      const mockModel = {
        getWordUntilPosition: jest.fn(() => ({ startColumn: 1, endColumn: 5 })),
      };

      const mockPosition = {
        lineNumber: 1,
        column: 5,
      };

      const result = providerCallback(mockModel, mockPosition);

      expect(result.suggestions).toHaveLength(1);
      expect(result.suggestions[0].label).toBe('${id}');
      expect(result.suggestions[0].insertText).toBe('${id}');
      expect(result.suggestions[0].detail).toContain('node ID');
    });

    it('should provide ${id} suggestion for edges', () => {
      let providerCallback: any;
      const mockMonaco = {
        languages: {
          registerCompletionItemProvider: jest.fn((_lang, provider) => {
            providerCallback = provider.provideCompletionItems;
          }),
          CompletionItemKind: {
            Variable: 1,
          },
        },
      };

      registerMatchValueCompletion(mockMonaco as any, 'edge');

      const mockModel = {
        getWordUntilPosition: jest.fn(() => ({ startColumn: 1, endColumn: 5 })),
      };

      const mockPosition = {
        lineNumber: 1,
        column: 5,
      };

      const result = providerCallback(mockModel, mockPosition);

      expect(result.suggestions[0].detail).toContain('edge ID');
    });
  });

  describe('getSuggestionsForEdge', () => {
    it('should always include id suggestion', () => {
      const override: EdgeOverrideWithTargets = {
        targetEdgeIds: ['A->B'],
      };

      const result = getSuggestionsForEdge([], override);

      expect(result).toHaveLength(1);
      expect(result[0].label).toBe('id');
      expect(result[0].kind).toBe(CodeEditorSuggestionItemKind.Constant);
    });

    it('should return only id when no matchFieldName', () => {
      const override: EdgeOverrideWithTargets = {
        targetEdgeIds: ['A->B'],
      };

      const data = [{ edge_id: 'A->B', value: 100 }];

      const result = getSuggestionsForEdge(data, override);

      expect(result).toHaveLength(1);
      expect(result[0].label).toBe('id');
    });

    it('should return only id when data is empty', () => {
      const override: EdgeOverrideWithTargets = {
        targetEdgeIds: ['A->B'],
        matchFieldName: 'edge_id',
        matchValue: 'A->B',
      };

      const result = getSuggestionsForEdge([], override);

      expect(result).toHaveLength(1);
    });

    it('should return only id when no targetEdgeIds', () => {
      const override: EdgeOverrideWithTargets = {
        targetEdgeIds: [],
        matchFieldName: 'edge_id',
        matchValue: 'A->B',
      };

      const data = [{ edge_id: 'A->B', value: 100 }];

      const result = getSuggestionsForEdge(data, override);

      expect(result).toHaveLength(1);
    });

    it('should return field suggestions from matched row', () => {
      const override: EdgeOverrideWithTargets = {
        targetEdgeIds: ['A->B'],
        matchFieldName: 'edge_id',
        matchValue: 'A->B',
      };

      const data = [
        createDataFrame({
          fields: [
            { name: 'edge_id', type: FieldType.string, values: ['A->B', 'B->C'] },
            { name: 'bandwidth', type: FieldType.number, values: [100, 200] },
            { name: 'latency', type: FieldType.number, values: [50, 30] },
          ],
        }),
      ];

      const result = getSuggestionsForEdge(data, override);

      expect(result.length).toBeGreaterThan(1);
      expect(result.map((s) => s.label)).toContain('bandwidth');
      expect(result.map((s) => s.label)).toContain('latency');
    });

    it('should use matchPattern with ${id} replacement', () => {
      const override: EdgeOverrideWithTargets = {
        targetEdgeIds: ['A->B'],
        matchFieldName: 'edge_id',
        matchPattern: 'edge_${id}',
      };

      const data = [
        createDataFrame({
          fields: [
            { name: 'edge_id', type: FieldType.string, values: ['edge_A->B'] },
            { name: 'bandwidth', type: FieldType.number, values: [100] },
          ],
        }),
      ];

      const result = getSuggestionsForEdge(data, override);

      expect(result.length).toBeGreaterThan(1);
      expect(result.map((s) => s.label)).toContain('bandwidth');
    });

    it('should classify number fields correctly', () => {
      const override: EdgeOverrideWithTargets = {
        targetEdgeIds: ['A->B'],
        matchFieldName: 'edge_id',
        matchValue: 'A->B',
      };

      const data = [
        createDataFrame({
          fields: [
            { name: 'edge_id', type: FieldType.string, values: ['A->B'] },
            { name: 'count', type: FieldType.number, values: [42] },
          ],
        }),
      ];

      const result = getSuggestionsForEdge(data, override);

      const countSuggestion = result.find((s) => s.label === 'count');
      expect(countSuggestion?.kind).toBe(CodeEditorSuggestionItemKind.Field);
      expect(countSuggestion?.detail).toBe('number');
    });

    it('should classify string fields correctly', () => {
      const override: EdgeOverrideWithTargets = {
        targetEdgeIds: ['A->B'],
        matchFieldName: 'edge_id',
        matchValue: 'A->B',
      };

      const data = [
        createDataFrame({
          fields: [
            { name: 'edge_id', type: FieldType.string, values: ['A->B'] },
            { name: 'status', type: FieldType.string, values: ['active'] },
          ],
        }),
      ];

      const result = getSuggestionsForEdge(data, override);

      const statusSuggestion = result.find((s) => s.label === 'status');
      expect(statusSuggestion?.kind).toBe(CodeEditorSuggestionItemKind.Property);
      expect(statusSuggestion?.detail).toBe('string');
    });

    it('should skip null and undefined values', () => {
      const override: EdgeOverrideWithTargets = {
        targetEdgeIds: ['A->B'],
        matchFieldName: 'edge_id',
        matchValue: 'A->B',
      };

      const data = [
        createDataFrame({
          fields: [
            { name: 'edge_id', type: FieldType.string, values: ['A->B'] },
            { name: 'nullField', type: FieldType.string, values: [null] },
            { name: 'undefinedField', type: FieldType.string, values: [undefined] },
            { name: 'validField', type: FieldType.string, values: ['value'] },
          ],
        }),
      ];

      const result = getSuggestionsForEdge(data, override);

      expect(result.map((s) => s.label)).toContain('validField');
      expect(result.map((s) => s.label)).not.toContain('nullField');
      expect(result.map((s) => s.label)).not.toContain('undefinedField');
    });

    it('should skip id field in suggestions', () => {
      const override: EdgeOverrideWithTargets = {
        targetEdgeIds: ['A->B'],
        matchFieldName: 'edge_id',
        matchValue: 'A->B',
      };

      const data = [
        createDataFrame({
          fields: [
            { name: 'edge_id', type: FieldType.string, values: ['A->B'] },
            { name: 'id', type: FieldType.string, values: ['duplicate'] },
            { name: 'value', type: FieldType.number, values: [100] },
          ],
        }),
      ];

      const result = getSuggestionsForEdge(data, override);

      const idSuggestions = result.filter((s) => s.label === 'id');
      expect(idSuggestions).toHaveLength(1);
    });
  });

  describe('getSuggestionsForNode', () => {
    it('should always include id suggestion', () => {
      const override: NodeOverrideWithTargets = {
        targetNodeIds: ['A'],
      };

      const result = getSuggestionsForNode([], override);

      expect(result).toHaveLength(1);
      expect(result[0].label).toBe('id');
      expect(result[0].kind).toBe(CodeEditorSuggestionItemKind.Constant);
      expect(result[0].detail).toBe('Node ID');
    });

    it('should return only id when no matchFieldName', () => {
      const override: NodeOverrideWithTargets = {
        targetNodeIds: ['A'],
      };

      const data = [{ node_id: 'A', status: 'active' }];

      const result = getSuggestionsForNode(data, override);

      expect(result).toHaveLength(1);
    });

    it('should return field suggestions from matched row', () => {
      const override: NodeOverrideWithTargets = {
        targetNodeIds: ['A'],
        matchFieldName: 'node_id',
        matchValue: 'A',
      };

      const data = [
        createDataFrame({
          fields: [
            { name: 'node_id', type: FieldType.string, values: ['A', 'B'] },
            { name: 'cpu', type: FieldType.number, values: [80, 50] },
            { name: 'memory', type: FieldType.number, values: [60, 40] },
          ],
        }),
      ];

      const result = getSuggestionsForNode(data, override);

      expect(result.length).toBeGreaterThan(1);
      expect(result.map((s) => s.label)).toContain('cpu');
      expect(result.map((s) => s.label)).toContain('memory');
    });

    it('should use matchPattern with ${id} replacement', () => {
      const override: NodeOverrideWithTargets = {
        targetNodeIds: ['A'],
        matchFieldName: 'node_id',
        matchPattern: 'node_${id}',
      };

      const data = [
        createDataFrame({
          fields: [
            { name: 'node_id', type: FieldType.string, values: ['node_A'] },
            { name: 'cpu', type: FieldType.number, values: [75] },
          ],
        }),
      ];

      const result = getSuggestionsForNode(data, override);

      expect(result.length).toBeGreaterThan(1);
      expect(result.map((s) => s.label)).toContain('cpu');
    });

    it('should return only id when data is empty', () => {
      const override: NodeOverrideWithTargets = {
        targetNodeIds: ['A'],
        matchFieldName: 'node_id',
        matchValue: 'A',
      };

      const result = getSuggestionsForNode([], override);

      expect(result).toHaveLength(1);
    });

    it('should return only id when no targetNodeIds', () => {
      const override: NodeOverrideWithTargets = {
        targetNodeIds: [],
        matchFieldName: 'node_id',
        matchValue: 'A',
      };

      const data = [{ node_id: 'A', value: 100 }];

      const result = getSuggestionsForNode(data, override);

      expect(result).toHaveLength(1);
    });
  });

  describe('Null/undefined value handling', () => {
    it('should skip null values in edge field suggestions', () => {
      const override: EdgeOverrideWithTargets = {
        targetEdgeIds: ['A->B'],
        matchFieldName: 'edge_id',
        matchValue: 'A->B',
      };

      const data = [
        createDataFrame({
          fields: [
            { name: 'edge_id', type: FieldType.string, values: ['A->B'] },
            { name: 'nullField', type: FieldType.number, values: [null] },
            { name: 'validField', type: FieldType.number, values: [42] },
          ],
        }),
      ];

      const result = getSuggestionsForEdge(data, override);

      expect(result.map((s) => s.label)).toContain('validField');
      expect(result.map((s) => s.label)).not.toContain('nullField');
    });

    it('should skip undefined values in edge field suggestions', () => {
      const override: EdgeOverrideWithTargets = {
        targetEdgeIds: ['A->B'],
        matchFieldName: 'edge_id',
        matchValue: 'A->B',
      };

      const data = [
        createDataFrame({
          fields: [
            { name: 'edge_id', type: FieldType.string, values: ['A->B'] },
            { name: 'undefinedField', type: FieldType.number, values: [undefined] },
            { name: 'validField', type: FieldType.number, values: [42] },
          ],
        }),
      ];

      const result = getSuggestionsForEdge(data, override);

      expect(result.map((s) => s.label)).toContain('validField');
      expect(result.map((s) => s.label)).not.toContain('undefinedField');
    });

    it('should skip null values in node field suggestions', () => {
      const override: NodeOverrideWithTargets = {
        targetNodeIds: ['A'],
        matchFieldName: 'node_id',
        matchValue: 'A',
      };

      const data = [
        createDataFrame({
          fields: [
            { name: 'node_id', type: FieldType.string, values: ['A'] },
            { name: 'nullField', type: FieldType.number, values: [null] },
            { name: 'validField', type: FieldType.number, values: [100] },
          ],
        }),
      ];

      const result = getSuggestionsForNode(data, override);

      expect(result.map((s) => s.label)).toContain('validField');
      expect(result.map((s) => s.label)).not.toContain('nullField');
    });

    it('should skip undefined values in node field suggestions', () => {
      const override: NodeOverrideWithTargets = {
        targetNodeIds: ['A'],
        matchFieldName: 'node_id',
        matchValue: 'A',
      };

      const data = [
        createDataFrame({
          fields: [
            { name: 'node_id', type: FieldType.string, values: ['A'] },
            { name: 'undefinedField', type: FieldType.number, values: [undefined] },
            { name: 'validField', type: FieldType.number, values: [100] },
          ],
        }),
      ];

      const result = getSuggestionsForNode(data, override);

      expect(result.map((s) => s.label)).toContain('validField');
      expect(result.map((s) => s.label)).not.toContain('undefinedField');
    });
  });

  describe('registerEdgeLabelCompletion', () => {
    it('should register completion provider for edges', () => {
      const mockMonaco = {
        languages: {
          registerCompletionItemProvider: jest.fn(),
          CompletionItemKind: {
            Field: 5,
          },
        },
      };

      const override: EdgeOverrideWithTargets = {
        targetEdgeIds: ['A->B'],
        matchFieldName: 'edge_id',
        matchValue: 'A->B',
      };

      const data = [{ edge_id: 'A->B', value: 100 }];

      registerEdgeLabelCompletion(mockMonaco as any, data, override);

      expect(mockMonaco.languages.registerCompletionItemProvider).toHaveBeenCalledWith(
        'plaintext',
        expect.objectContaining({
          triggerCharacters: ['{'],
          provideCompletionItems: expect.any(Function),
        })
      );
    });
  });

  describe('registerNodeLabelCompletion', () => {
    it('should register completion provider for nodes', () => {
      const mockMonaco = {
        languages: {
          registerCompletionItemProvider: jest.fn(),
          CompletionItemKind: {
            Field: 5,
          },
        },
      };

      const override: NodeOverrideWithTargets = {
        targetNodeIds: ['A'],
        matchFieldName: 'node_id',
        matchValue: 'A',
      };

      const data = [{ node_id: 'A', value: 100 }];

      registerNodeLabelCompletion(mockMonaco as any, data, override);

      expect(mockMonaco.languages.registerCompletionItemProvider).toHaveBeenCalledWith(
        'plaintext',
        expect.objectContaining({
          triggerCharacters: ['{'],
          provideCompletionItems: expect.any(Function),
        })
      );
    });
  });
});
