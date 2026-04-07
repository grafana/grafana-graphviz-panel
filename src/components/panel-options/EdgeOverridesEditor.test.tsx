import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EdgeOverridesEditor } from './EdgeOverridesEditor';
import { EdgeOverride, MatchMode, RuleKind } from '../../types';

const mockOnChange = jest.fn();

const mockContext = {
  data: [
    {
      fields: [
        {
          name: 'edge_id',
          type: 'string',
          values: ['Server1__to__Server2', 'Server2__to__Server3'],
        },
        {
          name: 'bandwidth',
          type: 'number',
          values: [100, 50],
        },
        {
          name: 'status',
          type: 'string',
          values: ['active', 'inactive'],
        },
      ],
    },
  ],
  options: {
    dotDiagram: 'digraph { Server1 -> Server2; Server2 -> Server3; }',
    namedThresholds: [{ id: 'threshold-1', name: 'Bandwidth Thresholds' }],
  },
};

const defaultProps = {
  value: [] as EdgeOverride[],
  onChange: mockOnChange,
  context: mockContext as any,
  item: {} as any,
};

describe('EdgeOverridesEditor', () => {
  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('Initial state', () => {
    it('should render add edge override rule button', () => {
      render(<EdgeOverridesEditor {...defaultProps} />);
      expect(screen.getByRole('button', { name: /add edge override rule/i })).toBeInTheDocument();
    });

    it('should render empty when no overrides provided', () => {
      render(<EdgeOverridesEditor {...defaultProps} />);
      expect(screen.queryByText(/edge override rule 1/i)).not.toBeInTheDocument();
    });

    it('should render existing overrides', () => {
      const overrides: EdgeOverride[] = [
        {
          id: 'edge-mapping-1',
          targetEdgeIds: ['Server1__to__Server2'],
          matchMode: MatchMode.MANUAL,
          rules: [],
        },
      ];

      render(<EdgeOverridesEditor {...defaultProps} value={overrides} />);
      expect(screen.getByText(/edge override rule 1/i)).toBeInTheDocument();
    });
  });

  describe('Adding overrides', () => {
    it('should add new override when add button clicked', () => {
      render(<EdgeOverridesEditor {...defaultProps} />);

      const addButton = screen.getByRole('button', { name: /add edge override rule/i });
      fireEvent.click(addButton);

      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({
          id: expect.stringMatching(/^edge-mapping-/),
          targetEdgeIds: [],
          matchMode: MatchMode.AUTODETECT,
          rules: [],
        }),
      ]);
    });
  });

  describe('Removing overrides', () => {
    it('should remove override when trash button clicked', () => {
      const overrides: EdgeOverride[] = [
        {
          id: 'edge-mapping-1',
          targetEdgeIds: ['Server1__to__Server2'],
          matchMode: MatchMode.MANUAL,
          rules: [],
        },
        {
          id: 'edge-mapping-2',
          targetEdgeIds: ['Server2__to__Server3'],
          matchMode: MatchMode.MANUAL,
          rules: [],
        },
      ];

      render(<EdgeOverridesEditor {...defaultProps} value={overrides} />);

      const removeButtons = screen.getAllByLabelText(/remove override/i);
      fireEvent.click(removeButtons[0]);

      expect(mockOnChange).toHaveBeenCalledWith([expect.objectContaining({ id: 'edge-mapping-2' })]);
    });
  });

  describe('Edge selection', () => {
    it('should render edge selection field after adding override', () => {
      const overrides: EdgeOverride[] = [
        {
          id: 'edge-mapping-1',
          targetEdgeIds: [],
          matchMode: MatchMode.MANUAL,
          rules: [],
        },
      ];

      render(<EdgeOverridesEditor {...defaultProps} value={overrides} />);

      expect(screen.getByText(/select edges by id/i)).toBeInTheDocument();
    });

    it('should work with edges with explicit IDs in DOT diagram', () => {
      const contextWithIds = {
        ...mockContext,
        options: {
          ...mockContext.options,
          dotDiagram: 'digraph { A -> B [id="custom-edge-id"]; }',
        },
      };

      render(<EdgeOverridesEditor {...defaultProps} context={contextWithIds as any} />);

      expect(screen.getByRole('button', { name: /add edge override rule/i })).toBeInTheDocument();
    });
  });

  describe('Match mode', () => {
    it('should default to autodetect mode for new overrides', () => {
      render(<EdgeOverridesEditor {...defaultProps} />);

      const addButton = screen.getByRole('button', { name: /add edge override rule/i });
      fireEvent.click(addButton);

      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({
          matchMode: MatchMode.AUTODETECT,
        }),
      ]);
    });

    it('should use autodetect mode when edges selected', () => {
      const overrides: EdgeOverride[] = [
        {
          id: 'edge-mapping-1',
          targetEdgeIds: ['Server1__to__Server2'],
          matchMode: MatchMode.AUTODETECT,
          matchFieldName: 'edge_id',
          rules: [],
        },
      ];

      render(<EdgeOverridesEditor {...defaultProps} value={overrides} />);

      const autodetectRadio = screen.getByLabelText(/autodetect/i);
      expect(autodetectRadio).toBeChecked();
    });

    it('should show error when no matching fields found', () => {
      const overrides: EdgeOverride[] = [
        {
          id: 'edge-mapping-1',
          targetEdgeIds: ['NonExistentEdge'],
          matchMode: MatchMode.AUTODETECT,
          rules: [],
        },
      ];

      const emptyContext = {
        ...mockContext,
        data: [],
      };

      render(<EdgeOverridesEditor {...defaultProps} value={overrides} context={emptyContext as any} />);

      expect(screen.getByText(/no matching fields found/i)).toBeInTheDocument();
    });
  });

  describe('Manual mode', () => {
    it('should allow switching to manual mode', () => {
      const overrides: EdgeOverride[] = [
        {
          id: 'edge-mapping-1',
          targetEdgeIds: ['Server1__to__Server2'],
          matchMode: MatchMode.AUTODETECT,
          rules: [],
        },
      ];

      render(<EdgeOverridesEditor {...defaultProps} value={overrides} />);

      const manualRadio = screen.getByLabelText(/manual/i);
      fireEvent.click(manualRadio);

      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({
          matchMode: MatchMode.MANUAL,
        }),
      ]);
    });

    it('should show match field selector in manual mode', () => {
      const overrides: EdgeOverride[] = [
        {
          id: 'edge-mapping-1',
          targetEdgeIds: ['Server1__to__Server2'],
          matchMode: MatchMode.MANUAL,
          rules: [],
        },
      ];

      render(<EdgeOverridesEditor {...defaultProps} value={overrides} />);

      expect(screen.getByText(/match field \(optional\)/i)).toBeInTheDocument();
    });

    it('should show match value input when match field selected', () => {
      const overrides: EdgeOverride[] = [
        {
          id: 'edge-mapping-1',
          targetEdgeIds: ['Server1__to__Server2'],
          matchMode: MatchMode.MANUAL,
          matchFieldName: 'edge_id',
          matchPattern: '${id}',
          rules: [],
        },
      ];

      render(<EdgeOverridesEditor {...defaultProps} value={overrides} />);

      expect(screen.getByText(/match value/i)).toBeInTheDocument();
    });
  });

  describe('Rules management', () => {
    it('should add stroke color rule', () => {
      const overrides: EdgeOverride[] = [
        {
          id: 'edge-mapping-1',
          targetEdgeIds: ['Server1__to__Server2'],
          matchMode: MatchMode.MANUAL,
          rules: [],
        },
      ];

      render(<EdgeOverridesEditor {...defaultProps} value={overrides} />);

      const overrideButton = screen.getByRole('button', { name: /override edge property/i });
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

    it('should add stroke width rule', () => {
      const overrides: EdgeOverride[] = [
        {
          id: 'edge-mapping-1',
          targetEdgeIds: ['Server1__to__Server2'],
          matchMode: MatchMode.MANUAL,
          rules: [],
        },
      ];

      render(<EdgeOverridesEditor {...defaultProps} value={overrides} />);

      const overrideButton = screen.getByRole('button', { name: /override edge property/i });
      fireEvent.click(overrideButton);

      const strokeWidthOption = screen.getByText(/stroke width/i);
      fireEvent.click(strokeWidthOption);

      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({
          rules: [
            expect.objectContaining({
              kind: RuleKind.STROKE_WIDTH,
              staticWidth: 1,
            }),
          ],
        }),
      ]);
    });

    it('should add label rule', () => {
      const overrides: EdgeOverride[] = [
        {
          id: 'edge-mapping-1',
          targetEdgeIds: ['Server1__to__Server2'],
          matchMode: MatchMode.MANUAL,
          rules: [],
        },
      ];

      render(<EdgeOverridesEditor {...defaultProps} value={overrides} />);

      const overrideButton = screen.getByRole('button', { name: /override edge property/i });
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
      const overrides: EdgeOverride[] = [
        {
          id: 'edge-mapping-1',
          targetEdgeIds: ['Server1__to__Server2'],
          matchMode: MatchMode.MANUAL,
          rules: [
            {
              kind: RuleKind.STROKE_COLOR,
              staticColor: '#FF0000',
            },
          ],
        },
      ];

      render(<EdgeOverridesEditor {...defaultProps} value={overrides} />);

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
      const overrides: EdgeOverride[] = [
        {
          id: 'edge-mapping-1',
          targetEdgeIds: ['A__to__B'],
          matchMode: MatchMode.MANUAL,
          rules: [
            { kind: RuleKind.STROKE_COLOR, staticColor: '#FF0000' },
            { kind: RuleKind.STROKE_WIDTH, staticWidth: 2 },
            { kind: RuleKind.LABEL, labelTemplate: '${field}' },
          ],
        },
      ];

      render(<EdgeOverridesEditor {...defaultProps} value={overrides} />);

      const overrideButton = screen.getByRole('button', { name: /override edge property/i });
      expect(overrideButton).toBeEnabled();
    });

    it('should disable add rule button when no edges matched', () => {
      const overrides: EdgeOverride[] = [
        {
          id: 'edge-mapping-1',
          targetEdgeIds: [],
          matchMode: MatchMode.MANUAL,
          rules: [],
        },
      ];

      render(<EdgeOverridesEditor {...defaultProps} value={overrides} />);

      const overrideButton = screen.getByRole('button', { name: /override edge property/i });
      expect(overrideButton).toBeDisabled();
    });
  });

  describe('Static vs data-driven rules', () => {
    it('should show static color picker when no match field selected', () => {
      const overrides: EdgeOverride[] = [
        {
          id: 'edge-mapping-1',
          targetEdgeIds: ['Server1__to__Server2'],
          matchMode: MatchMode.MANUAL,
          rules: [
            {
              kind: RuleKind.STROKE_COLOR,
              staticColor: '#FF0000',
            },
          ],
        },
      ];

      render(<EdgeOverridesEditor {...defaultProps} value={overrides} />);

      expect(screen.getByText(/static color/i)).toBeInTheDocument();
    });

    it('should show field selector when match field is set', () => {
      const overrides: EdgeOverride[] = [
        {
          id: 'edge-mapping-1',
          targetEdgeIds: ['Server1__to__Server2'],
          matchMode: MatchMode.MANUAL,
          matchFieldName: 'edge_id',
          matchPattern: '${id}',
          rules: [
            {
              kind: RuleKind.STROKE_COLOR,
            },
          ],
        },
      ];

      render(<EdgeOverridesEditor {...defaultProps} value={overrides} />);

      const labels = screen.getAllByText(/color field/i);
      expect(labels.length).toBeGreaterThan(0);
      const thresholdLabels = screen.getAllByText(/threshold set/i);
      expect(thresholdLabels.length).toBeGreaterThan(0);
    });

    it('should show static width input for width rule without match field', () => {
      const overrides: EdgeOverride[] = [
        {
          id: 'edge-mapping-1',
          targetEdgeIds: ['Server1__to__Server2'],
          matchMode: MatchMode.MANUAL,
          rules: [
            {
              kind: RuleKind.STROKE_WIDTH,
              staticWidth: 2,
            },
          ],
        },
      ];

      render(<EdgeOverridesEditor {...defaultProps} value={overrides} />);

      expect(screen.getByText(/static width \(px\)/i)).toBeInTheDocument();
    });
  });

  describe('Partial match handling', () => {
    it('should handle partial matches in autodetect mode', () => {
      const overrides: EdgeOverride[] = [
        {
          id: 'edge-mapping-1',
          targetEdgeIds: ['Server1__to__Server2', 'NonExistentEdge'],
          matchMode: MatchMode.AUTODETECT,
          matchFieldName: 'edge_id',
          rules: [],
        },
      ];

      render(<EdgeOverridesEditor {...defaultProps} value={overrides} />);

      expect(screen.getByText(/edge override rule 1/i)).toBeInTheDocument();
    });

    it('should provide split functionality for unmatched edges', () => {
      const overrides: EdgeOverride[] = [
        {
          id: 'edge-mapping-1',
          targetEdgeIds: ['Server1__to__Server2'],
          matchMode: MatchMode.AUTODETECT,
          matchFieldName: 'edge_id',
          rules: [],
        },
      ];

      render(<EdgeOverridesEditor {...defaultProps} value={overrides} />);

      expect(screen.getByLabelText(/autodetect/i)).toBeChecked();
    });
  });

  describe('Select all edges functionality', () => {
    it('should have All button to select all edges', () => {
      const overrides: EdgeOverride[] = [
        {
          id: 'edge-mapping-1',
          targetEdgeIds: [],
          matchMode: MatchMode.MANUAL,
          rules: [],
        },
      ];

      render(<EdgeOverridesEditor {...defaultProps} value={overrides} />);

      expect(screen.getByRole('button', { name: /all/i })).toBeInTheDocument();
    });
  });

  describe('Multiple overrides', () => {
    it('should render multiple override rules with correct numbering', () => {
      const overrides: EdgeOverride[] = [
        {
          id: 'edge-mapping-1',
          targetEdgeIds: ['Server1__to__Server2'],
          matchMode: MatchMode.MANUAL,
          rules: [],
        },
        {
          id: 'edge-mapping-2',
          targetEdgeIds: ['Server2__to__Server3'],
          matchMode: MatchMode.MANUAL,
          rules: [],
        },
      ];

      render(<EdgeOverridesEditor {...defaultProps} value={overrides} />);

      expect(screen.getByText(/edge override rule 1/i)).toBeInTheDocument();
      expect(screen.getByText(/edge override rule 2/i)).toBeInTheDocument();
    });

    it('should manage overrides independently', () => {
      const overrides: EdgeOverride[] = [
        {
          id: 'edge-mapping-1',
          targetEdgeIds: ['Server1__to__Server2'],
          matchMode: MatchMode.MANUAL,
          rules: [],
        },
        {
          id: 'edge-mapping-2',
          targetEdgeIds: ['Server2__to__Server3'],
          matchMode: MatchMode.MANUAL,
          rules: [],
        },
      ];

      render(<EdgeOverridesEditor {...defaultProps} value={overrides} />);

      const removeButtons = screen.getAllByLabelText(/remove override/i);
      fireEvent.click(removeButtons[0]);

      expect(mockOnChange).toHaveBeenCalledWith([expect.objectContaining({ id: 'edge-mapping-2' })]);
    });
  });
});
