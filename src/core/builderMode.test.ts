import {
  isDirectedGraph,
  formatEdgeId,
  parseEdgeId,
  toOptional,
  addNodeToDot,
  updateNodeInDot,
  addEdgeToDot,
} from './builderMode';

describe('builderMode pure functions', () => {
  describe('isDirectedGraph', () => {
    const testCases = [
      { name: 'should return true for digraph (case insensitive)', input: 'digraph G { A -> B; }', expected: true },
      { name: 'should return true with whitespace', input: '  digraph G { A -> B; }', expected: true },
      { name: 'should return false for undirected graph', input: 'graph G { A -- B; }', expected: false },
      { name: 'should return false without graph keyword', input: 'A -> B;', expected: false },
    ];

    testCases.forEach(({ name, input, expected }) => {
      it(name, () => {
        expect(isDirectedGraph(input)).toBe(expected);
      });
    });
  });

  describe('formatEdgeId', () => {
    const testCases = [
      { name: 'should format simple node names', source: 'A', target: 'B', expected: 'A__to__B' },
      { name: 'should handle spaces', source: 'Node 1', target: 'Node 2', expected: 'Node 1__to__Node 2' },
      {
        name: 'should handle special characters',
        source: 'Server-1',
        target: 'Server-2',
        expected: 'Server-1__to__Server-2',
      },
      { name: 'should handle empty values', source: '', target: 'B', expected: '__to__B' },
    ];

    testCases.forEach(({ name, source, target, expected }) => {
      it(name, () => {
        expect(formatEdgeId(source, target)).toBe(expected);
      });
    });
  });

  describe('parseEdgeId', () => {
    const testCases = [
      { name: 'should parse simple edge ID', input: 'A__to__B', expected: ['A', 'B'] },
      { name: 'should parse with spaces', input: 'Node 1__to__Node 2', expected: ['Node 1', 'Node 2'] },
      { name: 'should parse with special chars', input: 'Server-1__to__Server-2', expected: ['Server-1', 'Server-2'] },
      { name: 'should handle empty parts', input: 'A__to__', expected: ['A', ''] },
      { name: 'should return null without separator', input: 'A-B', expected: null },
      { name: 'should return null with multiple separators', input: 'A__to__B__to__C', expected: null },
    ];

    testCases.forEach(({ name, input, expected }) => {
      it(name, () => {
        expect(parseEdgeId(input)).toEqual(expected);
      });
    });
  });

  describe('toOptional', () => {
    const testCases = [
      { name: 'should return undefined for empty string', input: '', expected: undefined },
      { name: 'should return value for non-empty string', input: 'hello', expected: 'hello' },
      { name: 'should return value for whitespace string', input: '  ', expected: '  ' },
      { name: 'should return value for number string', input: '123', expected: '123' },
    ];

    testCases.forEach(({ name, input, expected }) => {
      it(name, () => {
        expect(toOptional(input)).toBe(expected);
      });
    });
  });

  describe('addNodeToDot error handling', () => {
    it('should return original DOT string on parse error', () => {
      const invalidDot = 'invalid dot syntax {{{';
      const node = { id: 'A', label: 'Node A' };

      const result = addNodeToDot(invalidDot, node);

      expect(result).toBe(invalidDot);
    });

    it('should handle empty DOT string', () => {
      const node = { id: 'A', label: 'Node A' };

      const result = addNodeToDot('', node);

      expect(result).toContain('digraph');
      expect(result).toContain('A');
    });

    it('should add node to valid DOT string', () => {
      const validDot = 'digraph G { B -> C; }';
      const node = { id: 'A', label: 'Node A', shape: 'box' };

      const result = addNodeToDot(validDot, node);

      expect(result).toContain('A');
      expect(result).toContain('Node A');
      expect(result).toContain('box');
    });
  });

  describe('updateNodeInDot error handling', () => {
    it('should return original DOT string on parse error', () => {
      const invalidDot = 'malformed {';
      const result = updateNodeInDot(invalidDot, 'A', { label: 'New Label' });

      expect(result).toBe(invalidDot);
    });

    it('should return original DOT when node not found', () => {
      const validDot = 'digraph G { A -> B; }';
      const result = updateNodeInDot(validDot, 'NonExistent', { label: 'Test' });

      expect(result).toBe(validDot);
    });

    it('should update existing node label', () => {
      const validDot = 'digraph G { A [label="Old"]; }';
      const result = updateNodeInDot(validDot, 'A', { label: 'New Label' });

      expect(result).toContain('New Label');
      expect(result).not.toContain('Old');
    });
  });

  describe('addEdgeToDot error handling', () => {
    it('should return original DOT string on parse error', () => {
      const invalidDot = 'broken syntax!!!';
      const result = addEdgeToDot(invalidDot, { source: 'A', target: 'B' });

      expect(result).toBe(invalidDot);
    });

    it('should add edge to valid DOT string', () => {
      const validDot = 'digraph G { A; B; }';
      const result = addEdgeToDot(validDot, { source: 'A', target: 'B', label: 'edge1' });

      expect(result).toContain('A');
      expect(result).toContain('B');
      expect(result).toContain('edge1');
    });

    it('should handle edge with id', () => {
      const validDot = 'digraph G { X; Y; }';
      const result = addEdgeToDot(validDot, { source: 'X', target: 'Y', id: 'custom-id', label: 'Link' });

      expect(result).toContain('custom-id');
      expect(result).toContain('Link');
    });
  });

  describe('getShapeOptions', () => {
    it('should return array of shape options', () => {
      const { getShapeOptions } = require('./builderMode');
      const options = getShapeOptions();

      expect(options).toBeInstanceOf(Array);
      expect(options.length).toBeGreaterThan(0);
      expect(options[0]).toHaveProperty('label');
      expect(options[0]).toHaveProperty('value');
      expect(options[0]).toHaveProperty('icon');
    });

    it('should capitalize first letter of shape labels', () => {
      const { getShapeOptions } = require('./builderMode');
      const options = getShapeOptions();

      const boxOption = options.find((opt: any) => opt.value === 'box');
      expect(boxOption?.label).toBe('Box');
    });
  });

  describe('parseNodesFromDot', () => {
    const { parseNodesFromDot } = require('./builderMode');

    it('should parse nodes from DOT string', () => {
      const dot = 'digraph G { A [label="Node A"]; B [label="Node B", shape="box"]; }';
      const nodes = parseNodesFromDot(dot);

      expect(nodes).toHaveLength(2);
      expect(nodes[0].id).toBe('A');
      expect(nodes[0].label).toBe('Node A');
      expect(nodes[1].id).toBe('B');
      expect(nodes[1].shape).toBe('box');
    });

    it('should return empty array for empty graph', () => {
      const nodes = parseNodesFromDot('digraph G {}');
      expect(nodes).toEqual([]);
    });
  });

  describe('parseEdgesFromDot', () => {
    const { parseEdgesFromDot } = require('./builderMode');

    it('should parse edges from DOT string', () => {
      const dot = 'digraph G { A -> B [label="edge1"]; B -> C; }';
      const edges = parseEdgesFromDot(dot);

      expect(edges.length).toBeGreaterThan(0);
      expect(edges[0].source).toBeDefined();
      expect(edges[0].target).toBeDefined();
    });

    it('should return empty array for graph with no edges', () => {
      const edges = parseEdgesFromDot('digraph G { A; B; }');
      expect(edges).toEqual([]);
    });
  });

  describe('getExistingEdgeIds', () => {
    const { getExistingEdgeIds } = require('./builderMode');

    it('should return edge IDs from DOT string', () => {
      const dot = 'digraph G { A -> B; B -> C; }';
      const edgeIds = getExistingEdgeIds(dot);

      expect(edgeIds).toBeInstanceOf(Array);
      expect(edgeIds.length).toBeGreaterThan(0);
    });

    it('should return empty array for graph with no edges', () => {
      const edgeIds = getExistingEdgeIds('digraph G { A; B; }');
      expect(edgeIds).toEqual([]);
    });
  });

  describe('updateEdgeInDot', () => {
    const { updateEdgeInDot } = require('./builderMode');

    it('should update edge label', () => {
      const dot = 'digraph G { A -> B [label="old"]; }';
      const result = updateEdgeInDot(dot, 'A', 'B', { label: 'new label' });

      expect(result).toContain('new label');
    });

    it('should return original DOT on parse error', () => {
      const invalid = 'invalid dot';
      const result = updateEdgeInDot(invalid, 'A', 'B', { label: 'label' });

      expect(result).toBe(invalid);
    });
  });

  describe('deleteNodeFromDot', () => {
    const { deleteNodeFromDot } = require('./builderMode');

    it('should delete node from DOT string', () => {
      const dot = 'digraph G { A; B; C; A -> B; }';
      const result = deleteNodeFromDot(dot, 'B');

      expect(result).not.toContain(' B;');
      expect(result).toContain('A');
      expect(result).toContain('C');
    });

    it('should return original DOT on parse error', () => {
      const invalid = 'invalid dot';
      const result = deleteNodeFromDot(invalid, 'A');

      expect(result).toBe(invalid);
    });
  });

  describe('deleteEdgeFromDot', () => {
    const { deleteEdgeFromDot } = require('./builderMode');

    it('should delete edge from DOT string', () => {
      const dot = 'digraph G { A; B; A -> B; }';
      const result = deleteEdgeFromDot(dot, 'A', 'B');

      expect(result).not.toContain('A -> B');
      expect(result).toContain('A');
      expect(result).toContain('B');
    });

    it('should return original DOT on parse error', () => {
      const invalid = 'invalid dot';
      const result = deleteEdgeFromDot(invalid, 'A', 'B');

      expect(result).toBe(invalid);
    });
  });
});
