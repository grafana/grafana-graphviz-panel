import { fromDot } from 'ts-graphviz';
import { getEffectiveNodeAttribute, getEffectiveEdgeAttribute } from './graphvizAttributes';

describe('utils/graphvizAttributes', () => {
  describe('getEffectiveNodeAttribute', () => {
    it('should return node-level attribute when present', () => {
      const dot = `digraph G {
        node [style="rounded"]
        A [style="bold"]
      }`;
      const model = fromDot(dot);
      const node = model.getNode('A');

      const result = getEffectiveNodeAttribute(node, model, 'style');

      expect(result).toBe('bold');
    });

    it('should fall back to graph-level default when node has no explicit attribute', () => {
      const dot = `digraph G {
        node [style="rounded"]
        A
      }`;
      const model = fromDot(dot);
      const node = model.getNode('A');

      const result = getEffectiveNodeAttribute(node, model, 'style');

      expect(result).toBe('rounded');
    });

    it('should return null when attribute not set at any level', () => {
      const dot = `digraph G { A }`;
      const model = fromDot(dot);
      const node = model.getNode('A');

      const result = getEffectiveNodeAttribute(node, model, 'style');

      expect(result).toBeNull();
    });

    it('should prioritize node-level over graph-level', () => {
      const dot = `digraph G {
        node [fillcolor="blue"]
        A [fillcolor="red"]
      }`;
      const model = fromDot(dot);
      const node = model.getNode('A');

      const result = getEffectiveNodeAttribute(node, model, 'fillcolor');

      expect(result).toBe('red');
    });

    it('should handle multiple nodes with mixed explicit/inherited attributes', () => {
      const dot = `digraph G {
        node [style="rounded,filled"]
        A [style="bold"]
        B
      }`;
      const model = fromDot(dot);
      const nodeA = model.getNode('A');
      const nodeB = model.getNode('B');

      const resultA = getEffectiveNodeAttribute(nodeA, model, 'style');
      const resultB = getEffectiveNodeAttribute(nodeB, model, 'style');

      expect(resultA).toBe('bold');
      expect(resultB).toBe('rounded,filled');
    });
  });

  describe('getEffectiveEdgeAttribute', () => {
    it('should return edge-level attribute when present', () => {
      const dot = `digraph G {
        edge [color="blue"]
        A -> B [color="red"]
      }`;
      const model = fromDot(dot);
      const edge = model.edges[0];

      const result = getEffectiveEdgeAttribute(edge, model, 'color');

      expect(result).toBe('red');
    });

    it('should fall back to graph-level default when edge has no explicit attribute', () => {
      const dot = `digraph G {
        edge [color="blue"]
        A -> B
      }`;
      const model = fromDot(dot);
      const edge = model.edges[0];

      const result = getEffectiveEdgeAttribute(edge, model, 'color');

      expect(result).toBe('blue');
    });

    it('should return null when attribute not set at any level', () => {
      const dot = `digraph G { A -> B }`;
      const model = fromDot(dot);
      const edge = model.edges[0];

      const result = getEffectiveEdgeAttribute(edge, model, 'color');

      expect(result).toBeNull();
    });
  });
});
