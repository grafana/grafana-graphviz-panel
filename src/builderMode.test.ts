import { isDirectedGraph, formatEdgeId, parseEdgeId } from './builderMode';

describe('builderMode pure functions', () => {
  describe('isDirectedGraph', () => {
    it('should return true for digraph keyword', () => {
      expect(isDirectedGraph('digraph G { A -> B; }')).toBe(true);
    });

    it('should return true for digraph with uppercase', () => {
      expect(isDirectedGraph('DIGRAPH G { A -> B; }')).toBe(true);
    });

    it('should return true for digraph with mixed case', () => {
      expect(isDirectedGraph('DiGraph G { A -> B; }')).toBe(true);
    });

    it('should return true for digraph with leading whitespace', () => {
      expect(isDirectedGraph('  digraph G { A -> B; }')).toBe(true);
    });

    it('should return true for digraph with newlines', () => {
      expect(isDirectedGraph('\n\ndigraph G { A -> B; }')).toBe(true);
    });

    it('should return false for undirected graph', () => {
      expect(isDirectedGraph('graph G { A -- B; }')).toBe(false);
    });

    it('should return false for graph with uppercase', () => {
      expect(isDirectedGraph('GRAPH G { A -- B; }')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isDirectedGraph('')).toBe(false);
    });

    it('should return false for string without graph keyword', () => {
      expect(isDirectedGraph('A -> B;')).toBe(false);
    });
  });

  describe('formatEdgeId', () => {
    it('should format edge ID with simple node names', () => {
      expect(formatEdgeId('A', 'B')).toBe('A__to__B');
    });

    it('should format edge ID with node names containing spaces', () => {
      expect(formatEdgeId('Node 1', 'Node 2')).toBe('Node 1__to__Node 2');
    });

    it('should format edge ID with node names containing special characters', () => {
      expect(formatEdgeId('Server-1', 'Server-2')).toBe('Server-1__to__Server-2');
    });

    it('should format edge ID with empty source', () => {
      expect(formatEdgeId('', 'B')).toBe('__to__B');
    });

    it('should format edge ID with empty target', () => {
      expect(formatEdgeId('A', '')).toBe('A__to__');
    });

    it('should format edge ID with numeric node names', () => {
      expect(formatEdgeId('1', '2')).toBe('1__to__2');
    });

    it('should format edge ID preserving case', () => {
      expect(formatEdgeId('NodeA', 'NodeB')).toBe('NodeA__to__NodeB');
    });
  });

  describe('parseEdgeId', () => {
    it('should parse simple edge ID', () => {
      expect(parseEdgeId('A__to__B')).toEqual(['A', 'B']);
    });

    it('should parse edge ID with spaces in node names', () => {
      expect(parseEdgeId('Node 1__to__Node 2')).toEqual(['Node 1', 'Node 2']);
    });

    it('should parse edge ID with special characters', () => {
      expect(parseEdgeId('Server-1__to__Server-2')).toEqual(['Server-1', 'Server-2']);
    });

    it('should return null for ID without separator', () => {
      expect(parseEdgeId('A-B')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(parseEdgeId('')).toBeNull();
    });

    it('should return null for ID with only one part', () => {
      expect(parseEdgeId('A__to__')).toEqual(['A', '']);
    });

    it('should handle edge ID with empty source', () => {
      expect(parseEdgeId('__to__B')).toEqual(['', 'B']);
    });

    it('should return null for edge ID with multiple separators', () => {
      expect(parseEdgeId('A__to__B__to__C')).toBeNull();
    });

    it('should parse numeric node IDs', () => {
      expect(parseEdgeId('1__to__2')).toEqual(['1', '2']);
    });
  });
});
