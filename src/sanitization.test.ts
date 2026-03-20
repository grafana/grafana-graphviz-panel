import { applyGraphDefaults } from './sanitization';
import { createTheme, GrafanaTheme2 } from '@grafana/data';

describe('sanitization', () => {
  const theme: GrafanaTheme2 = createTheme({ colors: { mode: 'dark' } });

  describe('applyGraphDefaults', () => {
    it('should apply theme defaults to simple graph', () => {
      const dot = 'digraph G { A -> B; }';

      const result = applyGraphDefaults(dot, theme);

      expect(result).toContain('digraph');
      expect(result).toContain('A');
      expect(result).toContain('B');
      expect(result).toContain('fontname');
      expect(result).toContain(theme.typography.fontFamily);
    });

    it('should preserve existing node attributes', () => {
      const dot = 'digraph G { A [label="Node A", color=red]; }';

      const result = applyGraphDefaults(dot, theme);

      expect(result).toContain('Node A');
      expect(result).toContain('red');
    });

    it('should handle empty graph', () => {
      const dot = 'digraph G {}';

      const result = applyGraphDefaults(dot, theme);

      expect(result).toContain('digraph');
    });

    it('should return original string on parse error', () => {
      const invalidDot = 'invalid syntax {{{';

      const result = applyGraphDefaults(invalidDot, theme);

      expect(result).toBe(invalidDot);
    });

    it('should handle graph with subgraphs', () => {
      const dot = `digraph G {
        subgraph cluster_0 {
          A -> B;
        }
      }`;

      const result = applyGraphDefaults(dot, theme);

      expect(result).toContain('subgraph');
      expect(result).toContain('A');
      expect(result).toContain('B');
    });

    it('should handle HTML labels', () => {
      const dot = `digraph G {
        A [label=<<TABLE><TR><TD>Cell</TD></TR></TABLE>>];
      }`;

      const result = applyGraphDefaults(dot, theme);

      expect(result).toContain('TABLE');
      expect(result).toContain('Cell');
    });

    it('should preserve edge attributes', () => {
      const dot = 'digraph G { A -> B [label="edge", color=blue]; }';

      const result = applyGraphDefaults(dot, theme);

      expect(result).toContain('edge');
      expect(result).toContain('blue');
    });

    it('should handle plaintext shape nodes', () => {
      const dot = 'digraph G { node [shape=plaintext]; A; B; }';

      const result = applyGraphDefaults(dot, theme);

      expect(result).toContain('plaintext');
      expect(result).toContain('A');
      expect(result).toContain('B');
    });

    it('should skip style/fillcolor for plaintext shapes', () => {
      const dot = 'digraph G { node [shape=plaintext]; A; B; }';

      const result = applyGraphDefaults(dot, theme);

      expect(result).toContain('plaintext');
      expect(result).not.toContain('filled');
      expect(result).not.toContain('fillcolor');
    });

    it('should handle HTML labels with selective font attributes', () => {
      const dot = `digraph G {
        A [label=<<TABLE><TR><TD>Cell 1</TD></TR></TABLE>>];
        B [label="Plain text"];
      }`;

      const result = applyGraphDefaults(dot, theme);

      expect(result).toContain('TABLE');
      expect(result).toContain('Cell 1');
      expect(result).toContain('Plain text');
      expect(result).toContain('fontname');
    });

    it('should promote implicit nodes when HTML labels exist', () => {
      const dot = `digraph G {
        A [label=<<I>Italic</I>>];
        A -> B;
        B -> C;
      }`;

      const result = applyGraphDefaults(dot, theme);

      expect(result).toContain('Italic');
      expect(result).toContain('B');
      expect(result).toContain('C');
    });
  });
});
