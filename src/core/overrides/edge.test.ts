import { calculateEdgeWidthAndArrowSize, applyEdgeStyleOverrides, applyDataDrivenWidths } from './edge';
const { RuleKind } = require('../../types');

describe('overrides/edge', () => {
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
