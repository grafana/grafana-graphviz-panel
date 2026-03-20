import { addStyleToCommaList, calculateEdgeWidthAndArrowSize } from './overrides';
const {
  applyNodeStyleOverrides,
  applyEdgeStyleOverrides,
  applyDataDrivenNodeLabels,
  applyDataDrivenEdgeLabels,
  applyDataDrivenColors,
  applyDataDrivenWidths,
} = require('./overrides');
const { RuleKind } = require('./types');

describe('overrides', () => {
  describe('addStyleToCommaList', () => {
    const testCases = [
      {
        name: 'should add style to empty string',
        existingStyle: '',
        newStyle: 'filled',
        expected: 'filled',
      },
      {
        name: 'should add style to null',
        existingStyle: null,
        newStyle: 'filled',
        expected: 'filled',
      },
      {
        name: 'should add style to existing single style',
        existingStyle: 'rounded',
        newStyle: 'filled',
        expected: 'rounded,filled',
      },
      {
        name: 'should add style to existing comma-separated styles',
        existingStyle: 'rounded,bold',
        newStyle: 'filled',
        expected: 'rounded,bold,filled',
      },
      {
        name: 'should not duplicate style if already present',
        existingStyle: 'rounded,filled',
        newStyle: 'filled',
        expected: 'rounded,filled',
      },
      {
        name: 'should not duplicate style if only style',
        existingStyle: 'filled',
        newStyle: 'filled',
        expected: 'filled',
      },
      {
        name: 'should detect style as substring (prevents adding "round" when "rounded" exists)',
        existingStyle: 'rounded',
        newStyle: 'round',
        expected: 'rounded',
      },
      {
        name: 'should detect style anywhere in comma list',
        existingStyle: 'rounded,filled,bold',
        newStyle: 'filled',
        expected: 'rounded,filled,bold',
      },
    ];

    testCases.forEach(({ name, existingStyle, newStyle, expected }) => {
      it(name, () => {
        expect(addStyleToCommaList(existingStyle, newStyle)).toBe(expected);
      });
    });
  });

  describe('calculateEdgeWidthAndArrowSize', () => {
    const testCases = [
      {
        name: 'should handle normal width (1.0)',
        width: 1.0,
        expected: { width: 1.0, arrowSize: 1.0 },
      },
      {
        name: 'should handle normal width (2.0)',
        width: 2.0,
        expected: { width: 2.0, arrowSize: 1.5 },
      },
      {
        name: 'should handle normal width (3.0)',
        width: 3.0,
        expected: { width: 3.0, arrowSize: 1.5 },
      },
      {
        name: 'should clamp minimum width to 0.1',
        width: 0.0,
        expected: { width: 0.1, arrowSize: 0.1 },
      },
      {
        name: 'should clamp negative width to 0.1',
        width: -1.0,
        expected: { width: 0.1, arrowSize: 0.1 },
      },
      {
        name: 'should clamp maximum width to 5.0',
        width: 10.0,
        expected: { width: 5.0, arrowSize: 1.5 },
      },
      {
        name: 'should clamp maximum width to 5.0 (large value)',
        width: 100.0,
        expected: { width: 5.0, arrowSize: 1.5 },
      },
      {
        name: 'should calculate arrow size proportionally for small widths',
        width: 0.5,
        expected: { width: 0.5, arrowSize: 0.5 },
      },
      {
        name: 'should cap arrow size at 1.5',
        width: 1.5,
        expected: { width: 1.5, arrowSize: 1.5 },
      },
      {
        name: 'should handle edge case at minimum (0.1)',
        width: 0.1,
        expected: { width: 0.1, arrowSize: 0.1 },
      },
      {
        name: 'should handle edge case at maximum (5.0)',
        width: 5.0,
        expected: { width: 5.0, arrowSize: 1.5 },
      },
      {
        name: 'should handle width just below arrow size cap (1.4)',
        width: 1.4,
        expected: { width: 1.4, arrowSize: 1.4 },
      },
      {
        name: 'should handle width just above arrow size cap (1.6)',
        width: 1.6,
        expected: { width: 1.6, arrowSize: 1.5 },
      },
    ];

    testCases.forEach(({ name, width, expected }) => {
      it(name, () => {
        const result = calculateEdgeWidthAndArrowSize(width);
        expect(result.width).toBeCloseTo(expected.width, 5);
        expect(result.arrowSize).toBeCloseTo(expected.arrowSize, 5);
      });
    });
  });

  describe('applyNodeStyleOverrides', () => {
    it('should return unchanged DOT when no overrides provided', () => {
      const dot = 'digraph G { A -> B; }';

      const result = applyNodeStyleOverrides(dot, []);

      expect(result).toContain('digraph');
      expect(result).toContain('A');
      expect(result).toContain('B');
    });

    it('should apply border color to target nodes', () => {
      const dot = 'digraph G { A; B; C; }';
      const overrides = [
        {
          id: '1',
          targetNodeIds: ['A', 'B'],
          rules: [
            {
              kind: RuleKind.STROKE_COLOR,
              staticColor: '#FF0000',
            },
          ],
        },
      ];

      const result = applyNodeStyleOverrides(dot, overrides);

      expect(result).toContain('#FF0000');
      expect(result).toContain('A');
      expect(result).toContain('B');
    });

    it('should apply fill color to target nodes', () => {
      const dot = 'digraph G { A; B; C; }';
      const overrides = [
        {
          id: '1',
          targetNodeIds: ['A'],
          rules: [
            {
              kind: RuleKind.FILL_COLOR,
              staticColor: '#00FF00',
            },
          ],
        },
      ];

      const result = applyNodeStyleOverrides(dot, overrides);

      expect(result).toContain('#00FF00');
      expect(result).toContain('fillcolor');
      expect(result).toContain('filled');
    });

    it('should handle multiple overrides for different nodes', () => {
      const dot = 'digraph G { A; B; }';
      const overrides = [
        {
          id: '1',
          targetNodeIds: ['A'],
          rules: [{ kind: RuleKind.STROKE_COLOR, staticColor: '#FF0000' }],
        },
        {
          id: '2',
          targetNodeIds: ['B'],
          rules: [{ kind: RuleKind.FILL_COLOR, staticColor: '#00FF00' }],
        },
      ];

      const result = applyNodeStyleOverrides(dot, overrides);

      expect(result).toContain('#FF0000');
      expect(result).toContain('#00FF00');
    });

    it('should skip overrides for non-existent nodes', () => {
      const dot = 'digraph G { A; }';
      const overrides = [
        {
          id: '1',
          targetNodeIds: ['NonExistent'],
          rules: [{ kind: RuleKind.STROKE_COLOR, staticColor: '#FF0000' }],
        },
      ];

      const result = applyNodeStyleOverrides(dot, overrides);

      expect(result).toContain('A');
    });
  });

  describe('applyEdgeStyleOverrides', () => {
    it('should return unchanged DOT when no overrides provided', () => {
      const dot = 'digraph G { A -> B; }';

      const result = applyEdgeStyleOverrides(dot, []);

      expect(result).toBe(dot);
    });

    it('should apply color to target edges', () => {
      const dot = 'digraph G { A -> B; }';
      const overrides = [
        {
          id: '1',
          targetEdgeIds: ['A__to__B'],
          rules: [
            {
              kind: RuleKind.STROKE_COLOR,
              staticColor: '#FF0000',
            },
          ],
        },
      ];

      const result = applyEdgeStyleOverrides(dot, overrides);

      expect(result).toContain('#FF0000');
      expect(result).toContain('A');
      expect(result).toContain('B');
    });

    it('should handle multiple edges with different colors', () => {
      const dot = 'digraph G { A -> B; B -> C; }';
      const overrides = [
        {
          id: '1',
          targetEdgeIds: ['A__to__B'],
          rules: [{ kind: RuleKind.STROKE_COLOR, staticColor: '#FF0000' }],
        },
        {
          id: '2',
          targetEdgeIds: ['B__to__C'],
          rules: [{ kind: RuleKind.STROKE_COLOR, staticColor: '#00FF00' }],
        },
      ];

      const result = applyEdgeStyleOverrides(dot, overrides);

      expect(result).toContain('#FF0000');
      expect(result).toContain('#00FF00');
    });

    it('should skip overrides for non-existent edges', () => {
      const dot = 'digraph G { A -> B; }';
      const overrides = [
        {
          id: '1',
          targetEdgeIds: ['X__to__Y'],
          rules: [{ kind: RuleKind.STROKE_COLOR, staticColor: '#FF0000' }],
        },
      ];

      const result = applyEdgeStyleOverrides(dot, overrides);

      expect(result).toContain('A');
      expect(result).toContain('B');
    });

    it('should handle multiple rules in single override', () => {
      const dot = 'digraph G { A -> B; A -> C; }';
      const overrides = [
        {
          id: '1',
          targetEdgeIds: ['A__to__B', 'A__to__C'],
          rules: [{ kind: RuleKind.STROKE_COLOR, staticColor: '#FF0000' }],
        },
      ];

      const result = applyEdgeStyleOverrides(dot, overrides);

      expect(result).toContain('#FF0000');
    });
  });

  describe('applyDataDrivenNodeLabels', () => {
    const mockData = {
      series: [
        {
          fields: [
            { name: 'node_id', type: 'string', values: ['A', 'B', 'C'], config: {} },
            { name: 'status', type: 'string', values: ['active', 'inactive', 'pending'], config: {} },
            { name: 'count', type: 'number', values: [10, 20, 30], config: {} },
          ],
          length: 3,
        },
      ],
    };

    it('should return unchanged DOT when no data series', () => {
      const dot = 'digraph G { A; }';
      const overrides = [
        {
          id: '1',
          targetNodeIds: ['A'],
          matchFieldName: 'node_id',
          matchValue: 'A',
          rules: [{ kind: RuleKind.LABEL, labelTemplate: 'Status: ${status}' }],
        },
      ];

      const result = applyDataDrivenNodeLabels(dot, overrides, { series: [] });

      expect(result).toBe(dot);
    });

    it('should apply label template to matched node', () => {
      const dot = 'digraph G { A; B; }';
      const overrides = [
        {
          id: '1',
          targetNodeIds: ['A'],
          matchFieldName: 'node_id',
          matchValue: 'A',
          rules: [{ kind: RuleKind.LABEL, labelTemplate: 'Status: ${status}' }],
        },
      ];

      const result = applyDataDrivenNodeLabels(dot, overrides, mockData);

      expect(result).toContain('Status: active');
      expect(result).toContain('A');
    });

    it('should use matchPattern with ${id} placeholder', () => {
      const dot = 'digraph G { A; B; }';
      const overrides = [
        {
          id: '1',
          targetNodeIds: ['A', 'B'],
          matchFieldName: 'node_id',
          matchPattern: '${id}',
          rules: [{ kind: RuleKind.LABEL, labelTemplate: 'Count: ${count}' }],
        },
      ];

      const result = applyDataDrivenNodeLabels(dot, overrides, mockData);

      expect(result).toContain('Count: 10');
      expect(result).toContain('Count: 20');
    });

    it('should skip nodes when matchValue is missing', () => {
      const dot = 'digraph G { A; }';
      const overrides = [
        {
          id: '1',
          targetNodeIds: ['A'],
          matchFieldName: 'node_id',
          rules: [{ kind: RuleKind.LABEL, labelTemplate: 'Test' }],
        },
      ];

      const result = applyDataDrivenNodeLabels(dot, overrides, mockData);

      expect(result).toContain('A');
    });

    it('should skip nodes when matchFieldName is missing', () => {
      const dot = 'digraph G { A; }';
      const overrides = [
        {
          id: '1',
          targetNodeIds: ['A'],
          matchValue: 'A',
          rules: [{ kind: RuleKind.LABEL, labelTemplate: 'Test' }],
        },
      ];

      const result = applyDataDrivenNodeLabels(dot, overrides, mockData);

      expect(result).toContain('A');
    });

    it('should skip nodes when data row not found', () => {
      const dot = 'digraph G { X; }';
      const overrides = [
        {
          id: '1',
          targetNodeIds: ['X'],
          matchFieldName: 'node_id',
          matchValue: 'NonExistent',
          rules: [{ kind: RuleKind.LABEL, labelTemplate: 'Test' }],
        },
      ];

      const result = applyDataDrivenNodeLabels(dot, overrides, mockData);

      expect(result).toContain('X');
    });

    it('should interpolate existing label if it has ${} syntax', () => {
      const dot = 'digraph G { A [label="${status}"]; }';
      const overrides = [
        {
          id: '1',
          targetNodeIds: ['A'],
          matchFieldName: 'node_id',
          matchValue: 'A',
          rules: [],
        },
      ];

      const result = applyDataDrivenNodeLabels(dot, overrides, mockData);

      expect(result).toContain('active');
    });

    it('should handle multiple nodes with different labels', () => {
      const dot = 'digraph G { A; B; C; }';
      const overrides = [
        {
          id: '1',
          targetNodeIds: ['A', 'B', 'C'],
          matchFieldName: 'node_id',
          matchPattern: '${id}',
          rules: [{ kind: RuleKind.LABEL, labelTemplate: '${node_id}: ${status}' }],
        },
      ];

      const result = applyDataDrivenNodeLabels(dot, overrides, mockData);

      expect(result).toContain('A: active');
      expect(result).toContain('B: inactive');
      expect(result).toContain('C: pending');
    });
  });

  describe('applyDataDrivenEdgeLabels', () => {
    const mockData = {
      series: [
        {
          fields: [
            { name: 'edge_id', type: 'string', values: ['A__to__B', 'B__to__C'], config: {} },
            { name: 'bandwidth', type: 'string', values: ['100Mbps', '200Mbps'], config: {} },
            { name: 'latency', type: 'string', values: ['5ms', '10ms'], config: {} },
          ],
          length: 2,
        },
      ],
    };

    it('should return unchanged DOT when no data series', () => {
      const dot = 'digraph G { A -> B; }';
      const overrides = [
        {
          id: '1',
          targetEdgeIds: ['A__to__B'],
          matchFieldName: 'edge_id',
          matchValue: 'A__to__B',
          rules: [{ kind: RuleKind.LABEL, labelTemplate: '${bandwidth}' }],
        },
      ];

      const result = applyDataDrivenEdgeLabels(dot, overrides, { series: [] });

      expect(result).toBe(dot);
    });

    it('should apply label template to matched edge', () => {
      const dot = 'digraph G { A -> B; }';
      const overrides = [
        {
          id: '1',
          targetEdgeIds: ['A__to__B'],
          matchFieldName: 'edge_id',
          matchValue: 'A__to__B',
          rules: [{ kind: RuleKind.LABEL, labelTemplate: '${bandwidth}' }],
        },
      ];

      const result = applyDataDrivenEdgeLabels(dot, overrides, mockData);

      expect(result).toContain('100Mbps');
    });

    it('should use matchPattern with ${id} placeholder', () => {
      const dot = 'digraph G { A -> B; B -> C; }';
      const overrides = [
        {
          id: '1',
          targetEdgeIds: ['A__to__B', 'B__to__C'],
          matchFieldName: 'edge_id',
          matchPattern: '${id}',
          rules: [{ kind: RuleKind.LABEL, labelTemplate: '${latency}' }],
        },
      ];

      const result = applyDataDrivenEdgeLabels(dot, overrides, mockData);

      expect(result).toContain('5ms');
      expect(result).toContain('10ms');
    });

    it('should skip edges when matchValue is missing', () => {
      const dot = 'digraph G { A -> B; }';
      const overrides = [
        {
          id: '1',
          targetEdgeIds: ['A__to__B'],
          matchFieldName: 'edge_id',
          rules: [{ kind: RuleKind.LABEL, labelTemplate: 'Test' }],
        },
      ];

      const result = applyDataDrivenEdgeLabels(dot, overrides, mockData);

      expect(result).toContain('A');
      expect(result).toContain('B');
    });

    it('should skip edges when matchFieldName is missing', () => {
      const dot = 'digraph G { A -> B; }';
      const overrides = [
        {
          id: '1',
          targetEdgeIds: ['A__to__B'],
          matchValue: 'A__to__B',
          rules: [{ kind: RuleKind.LABEL, labelTemplate: 'Test' }],
        },
      ];

      const result = applyDataDrivenEdgeLabels(dot, overrides, mockData);

      expect(result).toContain('A');
      expect(result).toContain('B');
    });

    it('should skip edges when data row not found', () => {
      const dot = 'digraph G { A -> B; }';
      const overrides = [
        {
          id: '1',
          targetEdgeIds: ['A__to__B'],
          matchFieldName: 'edge_id',
          matchValue: 'NonExistent',
          rules: [{ kind: RuleKind.LABEL, labelTemplate: 'Test' }],
        },
      ];

      const result = applyDataDrivenEdgeLabels(dot, overrides, mockData);

      expect(result).toContain('A');
      expect(result).toContain('B');
    });

    it('should interpolate existing label if it has ${} syntax', () => {
      const dot = 'digraph G { A -> B [label="${bandwidth}"]; }';
      const overrides = [
        {
          id: '1',
          targetEdgeIds: ['A__to__B'],
          matchFieldName: 'edge_id',
          matchValue: 'A__to__B',
          rules: [],
        },
      ];

      const result = applyDataDrivenEdgeLabels(dot, overrides, mockData);

      expect(result).toContain('100Mbps');
    });
  });

  describe('applyDataDrivenColors', () => {
    it('should apply node border colors from Map', () => {
      const dot = 'digraph G { A; B; }';
      const colors = {
        nodeBorderColors: new Map([
          ['A', '#FF0000'],
          ['B', '#00FF00'],
        ]),
        nodeFillColors: new Map(),
        edgeColors: new Map(),
      };

      const result = applyDataDrivenColors(dot, colors);

      expect(result).toContain('#FF0000');
      expect(result).toContain('#00FF00');
    });

    it('should apply node fill colors from Map', () => {
      const dot = 'digraph G { A; B; }';
      const colors = {
        nodeBorderColors: new Map(),
        nodeFillColors: new Map([
          ['A', '#0000FF'],
          ['B', '#FFFF00'],
        ]),
        edgeColors: new Map(),
      };

      const result = applyDataDrivenColors(dot, colors);

      expect(result).toContain('#0000FF');
      expect(result).toContain('#FFFF00');
      expect(result).toContain('fillcolor');
      expect(result).toContain('filled');
    });

    it('should apply edge colors from Map', () => {
      const dot = 'digraph G { A -> B; }';
      const colors = {
        nodeBorderColors: new Map(),
        nodeFillColors: new Map(),
        edgeColors: new Map([['A__to__B', '#FF00FF']]),
      };

      const result = applyDataDrivenColors(dot, colors);

      expect(result).toContain('#FF00FF');
    });

    it('should apply all color types together', () => {
      const dot = 'digraph G { A; B; A -> B; }';
      const colors = {
        nodeBorderColors: new Map([['A', '#FF0000']]),
        nodeFillColors: new Map([['B', '#00FF00']]),
        edgeColors: new Map([['A__to__B', '#0000FF']]),
      };

      const result = applyDataDrivenColors(dot, colors);

      expect(result).toContain('#FF0000');
      expect(result).toContain('#00FF00');
      expect(result).toContain('#0000FF');
    });

    it('should handle empty Maps', () => {
      const dot = 'digraph G { A -> B; }';
      const colors = {
        nodeBorderColors: new Map(),
        nodeFillColors: new Map(),
        edgeColors: new Map(),
      };

      const result = applyDataDrivenColors(dot, colors);

      expect(result).toContain('A');
      expect(result).toContain('B');
    });

    it('should skip non-existent nodes', () => {
      const dot = 'digraph G { A; }';
      const colors = {
        nodeBorderColors: new Map([['NonExistent', '#FF0000']]),
        nodeFillColors: new Map(),
        edgeColors: new Map(),
      };

      const result = applyDataDrivenColors(dot, colors);

      expect(result).toContain('A');
    });

    it('should skip non-existent edges', () => {
      const dot = 'digraph G { A -> B; }';
      const colors = {
        nodeBorderColors: new Map(),
        nodeFillColors: new Map(),
        edgeColors: new Map([['X__to__Y', '#FF0000']]),
      };

      const result = applyDataDrivenColors(dot, colors);

      expect(result).toContain('A');
      expect(result).toContain('B');
    });
  });

  describe('applyDataDrivenWidths', () => {
    it('should apply edge widths from Map', () => {
      const dot = 'digraph G { A -> B; }';
      const widths = {
        edgeWidths: new Map([['A__to__B', 2.5]]),
      };

      const result = applyDataDrivenWidths(dot, widths);

      expect(result).toContain('penwidth');
      expect(result).toContain('arrowsize');
    });

    it('should apply widths to multiple edges', () => {
      const dot = 'digraph G { A -> B; B -> C; }';
      const widths = {
        edgeWidths: new Map([
          ['A__to__B', 1.0],
          ['B__to__C', 3.0],
        ]),
      };

      const result = applyDataDrivenWidths(dot, widths);

      expect(result).toContain('penwidth');
      expect(result).toContain('arrowsize');
    });

    it('should handle empty Map', () => {
      const dot = 'digraph G { A -> B; }';
      const widths = {
        edgeWidths: new Map(),
      };

      const result = applyDataDrivenWidths(dot, widths);

      expect(result).toContain('A');
      expect(result).toContain('B');
    });

    it('should skip non-existent edges', () => {
      const dot = 'digraph G { A -> B; }';
      const widths = {
        edgeWidths: new Map([['X__to__Y', 2.0]]),
      };

      const result = applyDataDrivenWidths(dot, widths);

      expect(result).toContain('A');
      expect(result).toContain('B');
    });

    it('should clamp width values using calculateEdgeWidthAndArrowSize', () => {
      const dot = 'digraph G { A -> B; }';
      const widths = {
        edgeWidths: new Map([['A__to__B', 100.0]]),
      };

      const result = applyDataDrivenWidths(dot, widths);

      expect(result).toContain('penwidth');
      expect(result).not.toContain('100');
    });

    it('should handle width of 0 by clamping to minimum', () => {
      const dot = 'digraph G { A -> B; }';
      const widths = {
        edgeWidths: new Map([['A__to__B', 0]]),
      };

      const result = applyDataDrivenWidths(dot, widths);

      expect(result).toContain('penwidth');
    });
  });
});
