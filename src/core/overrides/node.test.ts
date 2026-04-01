import { applyNodeStyleOverrides, applyDataDrivenColors } from './node';
const { RuleKind } = require('../../types');

describe('overrides/node', () => {
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

    it('should preserve graph-level style when applying fill color', () => {
      const dot = `digraph G {
        node [style="rounded,bold"]
        A
        B
      }`;
      const overrides = [
        {
          id: '1',
          targetNodeIds: ['A'],
          rules: [
            {
              kind: RuleKind.FILL_COLOR,
              staticColor: '#FF0000',
            },
          ],
        },
      ];

      const result = applyNodeStyleOverrides(dot, overrides);

      expect(result).toContain('fillcolor');
      expect(result).toContain('style');
      expect(result).toContain('rounded');
      expect(result).toContain('bold');
      expect(result).toContain('filled');
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

    it('should preserve graph-level corner radius when applying data-driven fill color', () => {
      const dot = `digraph G {
        node [style="rounded"]
        A
      }`;
      const colors = {
        nodeBorderColors: new Map(),
        nodeFillColors: new Map([['A', '#FF0000']]),
        edgeColors: new Map(),
      };

      const result = applyDataDrivenColors(dot, colors);

      expect(result).toContain('rounded');
      expect(result).toContain('filled');
    });
  });
});
