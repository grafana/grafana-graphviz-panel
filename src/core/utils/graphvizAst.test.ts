import { getEdgeId, findNodeById, collectAllNodeIds, collectAllEdgeIds, hasAnyHtmlLabels } from './graphvizAst';
import { fromDot } from 'ts-graphviz';

describe('graphvizAst', () => {
  describe('getEdgeId', () => {
    const testCases = [
      {
        name: 'should return existing edge ID if present',
        dot: 'digraph G { A -> B [id="custom_id"]; }',
        expected: 'custom_id',
      },
      {
        name: 'should derive edge ID from source and target nodes',
        dot: 'digraph G { A -> B; }',
        expected: 'A__to__B',
      },
      {
        name: 'should derive edge ID with quoted node names',
        dot: 'digraph G { "Node 1" -> "Node 2"; }',
        expected: 'Node 1__to__Node 2',
      },
    ];

    testCases.forEach(({ name, dot, expected }) => {
      it(name, () => {
        const model = fromDot(dot);
        const edge = Array.from(model.edges)[0];
        expect(getEdgeId(edge)).toBe(expected);
      });
    });

    it('should return null for edges with fewer than 2 targets', () => {
      const mockEdge = {
        attributes: { get: () => null },
        targets: [{ id: 'A' }],
      };

      expect(getEdgeId(mockEdge)).toBeNull();
    });

    it('should return null for edges with no targets', () => {
      const mockEdge = {
        attributes: { get: () => null },
        targets: [],
      };

      expect(getEdgeId(mockEdge)).toBeNull();
    });
  });

  describe('findNodeById', () => {
    const testCases = [
      {
        name: 'should find node by ID',
        dot: 'digraph G { A; B; C; }',
        nodeId: 'B',
        expectedId: 'B',
      },
      {
        name: 'should find node with quoted ID',
        dot: 'digraph G { "Node 1"; "Node 2"; }',
        nodeId: 'Node 1',
        expectedId: 'Node 1',
      },
    ];

    testCases.forEach(({ name, dot, nodeId, expectedId }) => {
      it(name, () => {
        const model = fromDot(dot);
        const node = findNodeById(model, nodeId);
        expect(node).toBeDefined();
        expect(node!.id).toBe(expectedId);
      });
    });

    it('should return undefined for non-existent node', () => {
      const model = fromDot('digraph G { A; B; }');
      const node = findNodeById(model, 'NonExistent');
      expect(node).toBeUndefined();
    });
  });

  describe('collectAllNodeIds', () => {
    const testCases = [
      {
        name: 'should collect explicit node IDs',
        dot: 'digraph G { A; B; C; }',
        expectedIds: ['A', 'B', 'C'],
      },
      {
        name: 'should collect implicit node IDs from edges',
        dot: 'digraph G { A -> B -> C; }',
        expectedIds: ['A', 'B', 'C'],
      },
      {
        name: 'should collect mixed explicit and implicit without duplicates',
        dot: 'digraph G { A; B; A -> B -> C; }',
        expectedIds: ['A', 'B', 'C'],
      },
      {
        name: 'should handle quoted IDs',
        dot: 'digraph G { "Node 1" -> "Node 2"; }',
        expectedIds: ['Node 1', 'Node 2'],
      },
    ];

    testCases.forEach(({ name, dot, expectedIds }) => {
      it(name, () => {
        const model = fromDot(dot);
        const nodeIds = collectAllNodeIds(model);
        expect(nodeIds.size).toBe(expectedIds.length);
        expectedIds.forEach((id) => {
          expect(nodeIds.has(id)).toBe(true);
        });
      });
    });

    it('should handle empty graph', () => {
      const model = fromDot('digraph G {}');
      const nodeIds = collectAllNodeIds(model);
      expect(nodeIds.size).toBe(0);
    });
  });

  describe('collectAllEdgeIds', () => {
    const testCases = [
      {
        name: 'should collect edge IDs from simple edges',
        dot: 'digraph G { A -> B; B -> C; }',
        expectedIds: ['A__to__B', 'B__to__C'],
      },
      {
        name: 'should collect custom edge IDs when present',
        dot: 'digraph G { A -> B [id="edge1"]; B -> C [id="edge2"]; }',
        expectedIds: ['edge1', 'edge2'],
      },
      {
        name: 'should handle mixed custom and auto-generated IDs',
        dot: 'digraph G { A -> B [id="custom"]; B -> C; C -> D; }',
        expectedIds: ['custom', 'B__to__C', 'C__to__D'],
      },
      {
        name: 'should handle quoted node names in edges',
        dot: 'digraph G { "Node 1" -> "Node 2"; }',
        expectedIds: ['Node 1__to__Node 2'],
      },
      {
        name: 'should handle edges with spaces in node names',
        dot: 'digraph G { "Server A" -> "Server B" [id="connection"]; }',
        expectedIds: ['connection'],
      },
      {
        name: 'should not duplicate edge IDs',
        dot: 'digraph G { A -> B; A -> C; B -> C; }',
        expectedIds: ['A__to__B', 'A__to__C', 'B__to__C'],
      },
    ];

    testCases.forEach(({ name, dot, expectedIds }) => {
      it(name, () => {
        const model = fromDot(dot);
        const edgeIds = collectAllEdgeIds(model);
        expect(edgeIds.size).toBe(expectedIds.length);
        expectedIds.forEach((id) => {
          expect(edgeIds.has(id)).toBe(true);
        });
      });
    });

    it('should handle empty graph with no edges', () => {
      const model = fromDot('digraph G { A; B; C; }');
      const edgeIds = collectAllEdgeIds(model);
      expect(edgeIds.size).toBe(0);
    });

    it('should handle graph with only nodes', () => {
      const model = fromDot('digraph G {}');
      const edgeIds = collectAllEdgeIds(model);
      expect(edgeIds.size).toBe(0);
    });
  });

  describe('hasAnyHtmlLabels', () => {
    const mockIsHtmlLabel = (label: any): boolean => {
      if (!label) {
        return false;
      }
      const str = String(label).trim();
      return /^<+[A-Z]/.test(str);
    };

    const testCases = [
      {
        name: 'should return true when HTML label exists',
        dot: 'digraph G { A [label=<<B>HTML</B>>]; B; }',
        expected: true,
      },
      {
        name: 'should return true when any node has HTML label',
        dot: 'digraph G { A [label="Plain"]; B [label=<<TABLE></TABLE>>]; }',
        expected: true,
      },
      {
        name: 'should return false for plain labels',
        dot: 'digraph G { A [label="Plain"]; B; }',
        expected: false,
      },
      {
        name: 'should return false for implicit nodes',
        dot: 'digraph G { A -> B -> C; }',
        expected: false,
      },
    ];

    testCases.forEach(({ name, dot, expected }) => {
      it(name, () => {
        const model = fromDot(dot);
        expect(hasAnyHtmlLabels(model, mockIsHtmlLabel)).toBe(expected);
      });
    });
  });
});
