import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NodeOverridesEditor } from './NodeOverridesEditor';
import { NodeOverride, MatchMode, RuleKind } from '../../types';

const mockOnChange = jest.fn();

const mockContext = {
  data: [
    {
      fields: [
        {
          name: 'node_id',
          type: 'string',
          values: ['Server1', 'Server2', 'Server3'],
        },
        {
          name: 'cpu_usage',
          type: 'number',
          values: [25, 75, 95],
        },
        {
          name: 'status',
          type: 'string',
          values: ['healthy', 'warning', 'critical'],
        },
      ],
    },
  ],
  options: {
    dotDiagram: 'digraph { Server1; Server2; Server3; }',
    namedThresholds: [{ id: 'threshold-1', name: 'CPU Thresholds' }],
  },
};

const defaultProps = {
  value: [] as NodeOverride[],
  onChange: mockOnChange,
  context: mockContext as any,
  item: {} as any,
};

describe('NodeOverridesEditor', () => {
  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('Initial state', () => {
    it('should render add node override rule button', () => {
      render(<NodeOverridesEditor {...defaultProps} />);
      expect(screen.getByRole('button', { name: /add node override rule/i })).toBeInTheDocument();
    });

    it('should render empty when no overrides provided', () => {
      render(<NodeOverridesEditor {...defaultProps} />);
      expect(screen.queryByText(/node override rule 1/i)).not.toBeInTheDocument();
    });

    it('should render existing overrides', () => {
      const overrides: NodeOverride[] = [
        {
          id: 'node-mapping-1',
          targetNodeIds: ['Server1'],
          matchMode: MatchMode.MANUAL,
          rules: [],
        },
      ];

      render(<NodeOverridesEditor {...defaultProps} value={overrides} />);
      expect(screen.getByText(/node override rule 1/i)).toBeInTheDocument();
    });
  });

  describe('Adding overrides', () => {
    it('should add new override when add button clicked', () => {
      render(<NodeOverridesEditor {...defaultProps} />);

      const addButton = screen.getByRole('button', { name: /add node override rule/i });
      fireEvent.click(addButton);

      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({
          id: expect.stringMatching(/^node-mapping-/),
          targetNodeIds: [],
          matchMode: MatchMode.AUTODETECT,
          rules: [],
        }),
      ]);
    });
  });

  describe('Removing overrides', () => {
    it('should remove override when trash button clicked', () => {
      const overrides: NodeOverride[] = [
        {
          id: 'node-mapping-1',
          targetNodeIds: ['Server1'],
          matchMode: MatchMode.MANUAL,
          rules: [],
        },
        {
          id: 'node-mapping-2',
          targetNodeIds: ['Server2'],
          matchMode: MatchMode.MANUAL,
          rules: [],
        },
      ];

      render(<NodeOverridesEditor {...defaultProps} value={overrides} />);

      const removeButtons = screen.getAllByLabelText(/remove override/i);
      fireEvent.click(removeButtons[0]);

      expect(mockOnChange).toHaveBeenCalledWith([expect.objectContaining({ id: 'node-mapping-2' })]);
    });
  });

  describe('Node selection', () => {
    it('should render node selection field after adding override', () => {
      const overrides: NodeOverride[] = [
        {
          id: 'node-mapping-1',
          targetNodeIds: [],
          matchMode: MatchMode.MANUAL,
          rules: [],
        },
      ];

      render(<NodeOverridesEditor {...defaultProps} value={overrides} />);

      expect(screen.getByText(/select nodes by id/i)).toBeInTheDocument();
    });

    it('should work with DOT diagrams containing edges', () => {
      const contextWithEdges = {
        ...mockContext,
        options: {
          ...mockContext.options,
          dotDiagram: 'digraph { A -> B; B -> C; }',
        },
      };

      render(<NodeOverridesEditor {...defaultProps} context={contextWithEdges as any} />);

      expect(screen.getByRole('button', { name: /add node override rule/i })).toBeInTheDocument();
    });
  });

  describe('Match mode', () => {
    it('should default to autodetect mode for new overrides', () => {
      render(<NodeOverridesEditor {...defaultProps} />);

      const addButton = screen.getByRole('button', { name: /add node override rule/i });
      fireEvent.click(addButton);

      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({
          matchMode: MatchMode.AUTODETECT,
        }),
      ]);
    });

    it('should use autodetect mode when nodes selected', () => {
      const overrides: NodeOverride[] = [
        {
          id: 'node-mapping-1',
          targetNodeIds: ['Server1'],
          matchMode: MatchMode.AUTODETECT,
          matchFieldName: 'node_id',
          rules: [],
        },
      ];

      render(<NodeOverridesEditor {...defaultProps} value={overrides} />);

      const autodetectRadio = screen.getByLabelText(/autodetect/i);
      expect(autodetectRadio).toBeChecked();
    });

    it('should show error when no matching fields found', () => {
      const overrides: NodeOverride[] = [
        {
          id: 'node-mapping-1',
          targetNodeIds: ['NonExistentNode'],
          matchMode: MatchMode.AUTODETECT,
          rules: [],
        },
      ];

      const emptyContext = {
        ...mockContext,
        data: [],
      };

      render(<NodeOverridesEditor {...defaultProps} value={overrides} context={emptyContext as any} />);

      expect(screen.getByText(/no matching fields found/i)).toBeInTheDocument();
    });

    it('should offer to switch to manual mode when no match found', () => {
      const overrides: NodeOverride[] = [
        {
          id: 'node-mapping-1',
          targetNodeIds: ['NonExistentNode'],
          matchMode: MatchMode.AUTODETECT,
          rules: [],
        },
      ];

      const emptyContext = {
        ...mockContext,
        data: [],
      };

      render(<NodeOverridesEditor {...defaultProps} value={overrides} context={emptyContext as any} />);

      expect(screen.getByRole('button', { name: /switch to manual mode/i })).toBeInTheDocument();
    });
  });

  describe('Manual mode', () => {
    it('should allow switching to manual mode', () => {
      const overrides: NodeOverride[] = [
        {
          id: 'node-mapping-1',
          targetNodeIds: ['Server1'],
          matchMode: MatchMode.AUTODETECT,
          rules: [],
        },
      ];

      render(<NodeOverridesEditor {...defaultProps} value={overrides} />);

      const manualRadio = screen.getByLabelText(/manual/i);
      fireEvent.click(manualRadio);

      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({
          matchMode: MatchMode.MANUAL,
        }),
      ]);
    });

    it('should show match field selector in manual mode', () => {
      const overrides: NodeOverride[] = [
        {
          id: 'node-mapping-1',
          targetNodeIds: ['Server1'],
          matchMode: MatchMode.MANUAL,
          rules: [],
        },
      ];

      render(<NodeOverridesEditor {...defaultProps} value={overrides} />);

      expect(screen.getByText(/match field \(optional\)/i)).toBeInTheDocument();
    });

    it('should show match value input when match field selected', () => {
      const overrides: NodeOverride[] = [
        {
          id: 'node-mapping-1',
          targetNodeIds: ['Server1'],
          matchMode: MatchMode.MANUAL,
          matchFieldName: 'node_id',
          matchPattern: '${id}',
          rules: [],
        },
      ];

      render(<NodeOverridesEditor {...defaultProps} value={overrides} />);

      expect(screen.getByText(/match value/i)).toBeInTheDocument();
    });

    it('should show match value field in manual mode when field selected', () => {
      const overrides: NodeOverride[] = [
        {
          id: 'node-mapping-1',
          targetNodeIds: ['Server1'],
          matchMode: MatchMode.MANUAL,
          matchFieldName: 'node_id',
          matchPattern: '${id}',
          rules: [],
        },
      ];

      render(<NodeOverridesEditor {...defaultProps} value={overrides} />);

      expect(screen.getByText(/match value/i)).toBeInTheDocument();
    });
  });

  describe('Rules management', () => {
    it('should add stroke color rule', () => {
      const overrides: NodeOverride[] = [
        {
          id: 'node-mapping-1',
          targetNodeIds: ['Server1'],
          matchMode: MatchMode.MANUAL,
          rules: [],
        },
      ];

      render(<NodeOverridesEditor {...defaultProps} value={overrides} />);

      const overrideButton = screen.getByRole('button', { name: /override node property/i });
      fireEvent.click(overrideButton);

      const strokeColorOption = screen.getByText(/stroke color/i);
      fireEvent.click(strokeColorOption);

      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({
          rules: [
            expect.objectContaining({
              kind: RuleKind.STROKE_COLOR,
              staticColor: '#FF0000',
            }),
          ],
        }),
      ]);
    });

    it('should add fill color rule', () => {
      const overrides: NodeOverride[] = [
        {
          id: 'node-mapping-1',
          targetNodeIds: ['Server1'],
          matchMode: MatchMode.MANUAL,
          rules: [],
        },
      ];

      render(<NodeOverridesEditor {...defaultProps} value={overrides} />);

      const overrideButton = screen.getByRole('button', { name: /override node property/i });
      fireEvent.click(overrideButton);

      const fillColorOption = screen.getByText(/fill color/i);
      fireEvent.click(fillColorOption);

      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({
          rules: [
            expect.objectContaining({
              kind: RuleKind.FILL_COLOR,
              staticColor: '#00FF00',
            }),
          ],
        }),
      ]);
    });

    it('should add label rule', () => {
      const overrides: NodeOverride[] = [
        {
          id: 'node-mapping-1',
          targetNodeIds: ['Server1'],
          matchMode: MatchMode.MANUAL,
          rules: [],
        },
      ];

      render(<NodeOverridesEditor {...defaultProps} value={overrides} />);

      const overrideButton = screen.getByRole('button', { name: /override node property/i });
      fireEvent.click(overrideButton);

      const labelOption = screen.getByText('Label');
      fireEvent.click(labelOption);

      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({
          rules: [
            expect.objectContaining({
              kind: RuleKind.LABEL,
              labelTemplate: '${field}',
            }),
          ],
        }),
      ]);
    });

    it('should remove rule when trash button clicked', () => {
      const overrides: NodeOverride[] = [
        {
          id: 'node-mapping-1',
          targetNodeIds: ['Server1'],
          matchMode: MatchMode.MANUAL,
          rules: [
            {
              kind: RuleKind.STROKE_COLOR,
              staticColor: '#FF0000',
            },
          ],
        },
      ];

      render(<NodeOverridesEditor {...defaultProps} value={overrides} />);

      const removeRuleButtons = screen.getAllByLabelText(/remove override/i);
      const ruleRemoveButton = removeRuleButtons[removeRuleButtons.length - 1];
      fireEvent.click(ruleRemoveButton);

      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({
          rules: [],
        }),
      ]);
    });

    it('should not disable add rule button when some rules added', () => {
      const overrides: NodeOverride[] = [
        {
          id: 'node-mapping-1',
          targetNodeIds: ['Server1'],
          matchMode: MatchMode.MANUAL,
          rules: [
            { kind: RuleKind.STROKE_COLOR, staticColor: '#FF0000' },
            { kind: RuleKind.FILL_COLOR, staticColor: '#00FF00' },
            { kind: RuleKind.LABEL, labelTemplate: '${field}' },
          ],
        },
      ];

      render(<NodeOverridesEditor {...defaultProps} value={overrides} />);

      const overrideButton = screen.getByRole('button', { name: /override node property/i });
      expect(overrideButton).toBeEnabled();
    });

    it('should disable add rule button when no nodes matched', () => {
      const overrides: NodeOverride[] = [
        {
          id: 'node-mapping-1',
          targetNodeIds: [],
          matchMode: MatchMode.MANUAL,
          rules: [],
        },
      ];

      render(<NodeOverridesEditor {...defaultProps} value={overrides} />);

      const overrideButton = screen.getByRole('button', { name: /override node property/i });
      expect(overrideButton).toBeDisabled();
    });

    it('should show existing rules in the UI', () => {
      const overrides: NodeOverride[] = [
        {
          id: 'node-mapping-1',
          targetNodeIds: ['Server1'],
          matchMode: MatchMode.MANUAL,
          rules: [{ kind: RuleKind.STROKE_COLOR, staticColor: '#FF0000' }],
        },
      ];

      render(<NodeOverridesEditor {...defaultProps} value={overrides} />);

      expect(screen.getByText(/stroke color override/i)).toBeInTheDocument();
    });
  });

  describe('Static vs data-driven rules', () => {
    it('should show static color picker when no match field selected', () => {
      const overrides: NodeOverride[] = [
        {
          id: 'node-mapping-1',
          targetNodeIds: ['Server1'],
          matchMode: MatchMode.MANUAL,
          rules: [
            {
              kind: RuleKind.STROKE_COLOR,
              staticColor: '#FF0000',
            },
          ],
        },
      ];

      render(<NodeOverridesEditor {...defaultProps} value={overrides} />);

      expect(screen.getByText(/static color/i)).toBeInTheDocument();
    });

    it('should show field selector when match field is set', () => {
      const overrides: NodeOverride[] = [
        {
          id: 'node-mapping-1',
          targetNodeIds: ['Server1'],
          matchMode: MatchMode.MANUAL,
          matchFieldName: 'node_id',
          matchPattern: '${id}',
          rules: [
            {
              kind: RuleKind.STROKE_COLOR,
            },
          ],
        },
      ];

      render(<NodeOverridesEditor {...defaultProps} value={overrides} />);

      const labels = screen.getAllByText(/color field/i);
      expect(labels.length).toBeGreaterThan(0);
      const thresholdLabels = screen.getAllByText(/threshold set/i);
      expect(thresholdLabels.length).toBeGreaterThan(0);
    });
  });

  describe('Partial match handling', () => {
    it('should handle partial matches in autodetect mode', () => {
      const overrides: NodeOverride[] = [
        {
          id: 'node-mapping-1',
          targetNodeIds: ['Server1', 'NonExistentNode'],
          matchMode: MatchMode.AUTODETECT,
          matchFieldName: 'node_id',
          rules: [],
        },
      ];

      render(<NodeOverridesEditor {...defaultProps} value={overrides} />);

      expect(screen.getByText(/node override rule 1/i)).toBeInTheDocument();
    });

    it('should provide split functionality for unmatched nodes', () => {
      const overrides: NodeOverride[] = [
        {
          id: 'node-mapping-1',
          targetNodeIds: ['Server1'],
          matchMode: MatchMode.AUTODETECT,
          matchFieldName: 'node_id',
          rules: [],
        },
      ];

      render(<NodeOverridesEditor {...defaultProps} value={overrides} />);

      expect(screen.getByLabelText(/autodetect/i)).toBeChecked();
    });
  });

  describe('Select all nodes functionality', () => {
    it('should have All button to select all nodes', () => {
      const overrides: NodeOverride[] = [
        {
          id: 'node-mapping-1',
          targetNodeIds: [],
          matchMode: MatchMode.MANUAL,
          rules: [],
        },
      ];

      render(<NodeOverridesEditor {...defaultProps} value={overrides} />);

      expect(screen.getByRole('button', { name: /all/i })).toBeInTheDocument();
    });
  });

  describe('Collapsible sections', () => {
    it('should expand new overrides by default', () => {
      const overrides: NodeOverride[] = [
        {
          id: 'node-mapping-1',
          targetNodeIds: ['Server1'],
          matchMode: MatchMode.MANUAL,
          rules: [],
        },
      ];

      render(<NodeOverridesEditor {...defaultProps} value={overrides} />);

      expect(screen.getByText(/select nodes by id/i)).toBeVisible();
    });
  });

  describe('Multiple overrides', () => {
    it('should render multiple override rules with correct numbering', () => {
      const overrides: NodeOverride[] = [
        {
          id: 'node-mapping-1',
          targetNodeIds: ['Server1'],
          matchMode: MatchMode.MANUAL,
          rules: [],
        },
        {
          id: 'node-mapping-2',
          targetNodeIds: ['Server2'],
          matchMode: MatchMode.MANUAL,
          rules: [],
        },
        {
          id: 'node-mapping-3',
          targetNodeIds: ['Server3'],
          matchMode: MatchMode.MANUAL,
          rules: [],
        },
      ];

      render(<NodeOverridesEditor {...defaultProps} value={overrides} />);

      expect(screen.getByText(/node override rule 1/i)).toBeInTheDocument();
      expect(screen.getByText(/node override rule 2/i)).toBeInTheDocument();
      expect(screen.getByText(/node override rule 3/i)).toBeInTheDocument();
    });

    it('should manage overrides independently', () => {
      const overrides: NodeOverride[] = [
        {
          id: 'node-mapping-1',
          targetNodeIds: ['Server1'],
          matchMode: MatchMode.MANUAL,
          rules: [],
        },
        {
          id: 'node-mapping-2',
          targetNodeIds: ['Server2'],
          matchMode: MatchMode.MANUAL,
          rules: [],
        },
      ];

      render(<NodeOverridesEditor {...defaultProps} value={overrides} />);

      const removeButtons = screen.getAllByLabelText(/remove override/i);
      fireEvent.click(removeButtons[0]);

      expect(mockOnChange).toHaveBeenCalledWith([expect.objectContaining({ id: 'node-mapping-2' })]);
    });
  });

  describe('Field descriptions', () => {
    it('should show description for node selection field', () => {
      const overrides: NodeOverride[] = [
        {
          id: 'node-mapping-1',
          targetNodeIds: [],
          matchMode: MatchMode.MANUAL,
          rules: [],
        },
      ];

      render(<NodeOverridesEditor {...defaultProps} value={overrides} />);

      expect(screen.getByText(/defines which nodes the override will be applied to/i)).toBeInTheDocument();
    });

    it('should show description for match mode field', () => {
      const overrides: NodeOverride[] = [
        {
          id: 'node-mapping-1',
          targetNodeIds: ['Server1'],
          matchMode: MatchMode.MANUAL,
          rules: [],
        },
      ];

      render(<NodeOverridesEditor {...defaultProps} value={overrides} />);

      expect(
        screen.getByText(/allows you to match the node override to the value of a specific row/i)
      ).toBeInTheDocument();
    });
  });
});
