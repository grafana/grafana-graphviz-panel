import { Monaco, MonacoEditor, CodeEditorSuggestionItem, CodeEditorSuggestionItemKind } from '@grafana/ui';
import { findMatchedRow } from '../../integrations/grafanaData';

export const SINGLE_LINE_MONACO_OPTIONS = {
  lineNumbers: 'off' as const,
  folding: false,
  lineDecorationsWidth: 0,
  lineNumbersMinChars: 0,
  glyphMargin: false,
  scrollBeyondLastLine: false,
  scrollbar: {
    vertical: 'hidden' as const,
    horizontal: 'auto' as const,
  },
  overviewRulerLanes: 0,
  hideCursorInOverviewRuler: true,
  overviewRulerBorder: false,
  wordWrap: 'off' as const,
  renderLineHighlight: 'none' as const,
  quickSuggestions: true,
  suggestOnTriggerCharacters: true,
  acceptSuggestionOnEnter: 'off' as const,
  suggest: {
    showInlineDetails: false,
    showIcons: true,
  },
};

export function registerSingleLineKeyCommands(editor: MonacoEditor, monaco: Monaco): void {
  editor.addCommand(monaco.KeyCode.Enter, () => {
    editor.trigger('keyboard', 'hideSuggestWidget', {});
  });

  editor.addCommand(monaco.KeyCode.Tab, () => {
    editor.trigger('keyboard', 'acceptSelectedSuggestion', {});
  });
}

export function registerMatchValueCompletion(monaco: Monaco, entityType: 'node' | 'edge'): void {
  monaco.languages.registerCompletionItemProvider('plaintext', {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      return {
        suggestions: [
          {
            label: '${id}',
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: '${id}',
            detail: `Match using the ${entityType} ID`,
            documentation: `Use this to match rows in your data where a field matches the ${entityType} ID`,
            range: range,
          },
        ],
      };
    },
  });
}

interface OverrideWithMatch {
  matchFieldName?: string;
  matchValue?: string;
  matchPattern?: string;
}

export interface EdgeOverrideWithTargets extends OverrideWithMatch {
  targetEdgeIds: string[];
}

export interface NodeOverrideWithTargets extends OverrideWithMatch {
  targetNodeIds: string[];
}

export function getSuggestionsForEdge(data: any, override: EdgeOverrideWithTargets): CodeEditorSuggestionItem[] {
  const suggestions: CodeEditorSuggestionItem[] = [
    {
      label: 'id',
      kind: CodeEditorSuggestionItemKind.Constant,
      detail: 'Edge ID',
      documentation: 'The identifier of the current edge',
      insertText: 'id',
    },
  ];

  if (!override.matchFieldName || !data || data.length === 0) {
    return suggestions;
  }

  const sampleId = override.targetEdgeIds[0];
  if (!sampleId) {
    return suggestions;
  }

  const matchValue = override.matchPattern ? override.matchPattern.replace(/\$\{id\}/g, sampleId) : override.matchValue;

  if (!matchValue) {
    return suggestions;
  }

  const matchedRow = findMatchedRow(data, override.matchFieldName, matchValue);
  if (!matchedRow) {
    return suggestions;
  }

  for (const fieldName of Object.keys(matchedRow)) {
    if (fieldName === 'id') {
      continue;
    }

    const value = matchedRow[fieldName];
    if (value == null) {
      continue;
    }

    const fieldType = typeof value === 'number' ? 'number' : typeof value === 'string' ? 'string' : 'unknown';

    suggestions.push({
      label: fieldName,
      kind: fieldType === 'number' ? CodeEditorSuggestionItemKind.Field : CodeEditorSuggestionItemKind.Property,
      detail: fieldType,
      documentation: `Field: ${fieldName} (${fieldType})`,
      insertText: fieldName,
    });
  }

  return suggestions;
}

export function getSuggestionsForNode(data: any, override: NodeOverrideWithTargets): CodeEditorSuggestionItem[] {
  const suggestions: CodeEditorSuggestionItem[] = [
    {
      label: 'id',
      kind: CodeEditorSuggestionItemKind.Constant,
      detail: 'Node ID',
      documentation: 'The identifier of the current node',
      insertText: 'id',
    },
  ];

  if (!override.matchFieldName || !data || data.length === 0) {
    return suggestions;
  }

  const sampleId = override.targetNodeIds[0];
  if (!sampleId) {
    return suggestions;
  }

  const matchValue = override.matchPattern ? override.matchPattern.replace(/\$\{id\}/g, sampleId) : override.matchValue;

  if (!matchValue) {
    return suggestions;
  }

  const matchedRow = findMatchedRow(data, override.matchFieldName, matchValue);
  if (!matchedRow) {
    return suggestions;
  }

  for (const fieldName of Object.keys(matchedRow)) {
    if (fieldName === 'id') {
      continue;
    }

    const value = matchedRow[fieldName];
    if (value == null) {
      continue;
    }

    const fieldType = typeof value === 'number' ? 'number' : typeof value === 'string' ? 'string' : 'unknown';

    suggestions.push({
      label: fieldName,
      kind: fieldType === 'number' ? CodeEditorSuggestionItemKind.Field : CodeEditorSuggestionItemKind.Property,
      detail: fieldType,
      documentation: `Field: ${fieldName} (${fieldType})`,
      insertText: fieldName,
    });
  }

  return suggestions;
}

function registerCompletionProvider(monaco: Monaco, getSuggestions: () => CodeEditorSuggestionItem[]): void {
  monaco.languages.registerCompletionItemProvider('plaintext', {
    triggerCharacters: ['{'],
    provideCompletionItems: (model, position) => {
      const suggestions = getSuggestions();

      const textUntilPosition = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });

      const match = textUntilPosition.match(/\$\{(\w*)$/);
      if (!match) {
        return { suggestions: [] };
      }

      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      return {
        suggestions: suggestions.map((s) => ({
          label: s.label,
          kind: monaco.languages.CompletionItemKind.Field,
          detail: s.detail,
          documentation: s.documentation,
          insertText: s.insertText || s.label,
          range: range,
        })),
      };
    },
  });
}

export function registerEdgeLabelCompletion(monaco: Monaco, data: any, override: EdgeOverrideWithTargets): void {
  registerCompletionProvider(monaco, () => getSuggestionsForEdge(data, override));
}

export function registerNodeLabelCompletion(monaco: Monaco, data: any, override: NodeOverrideWithTargets): void {
  registerCompletionProvider(monaco, () => getSuggestionsForNode(data, override));
}
