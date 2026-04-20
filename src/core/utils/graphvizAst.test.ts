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

    describe('port support', () => {
      it('should include target port in edge ID (Node -> Node:port)', () => {
        const model = fromDot('digraph G { A -> B:port1; }');
        const edge = Array.from(model.edges)[0];
        expect(getEdgeId(edge)).toBe('A__to__B:port1');
      });

      it('should include both ports in edge ID (Node:port -> Node:port)', () => {
        const model = fromDot('digraph G { A:port1 -> B:port2; }');
        const edge = Array.from(model.edges)[0];
        expect(getEdgeId(edge)).toBe('A:port1__to__B:port2');
      });

      it('should include source port in edge ID (Node:port -> Node)', () => {
        const model = fromDot('digraph G { A:port1 -> B; }');
        const edge = Array.from(model.edges)[0];
        expect(getEdgeId(edge)).toBe('A:port1__to__B');
      });

      it('should generate unique IDs for multiple edges from same source to different ports', () => {
        const model = fromDot('digraph G { A -> B:http; A -> B:https; }');
        const edges = Array.from(model.edges);
        const id1 = getEdgeId(edges[0]);
        const id2 = getEdgeId(edges[1]);
        expect(id1).toBe('A__to__B:http');
        expect(id2).toBe('A__to__B:https');
        expect(id1).not.toBe(id2);
      });

      it('should generate unique IDs for multiple edges from different ports to same target', () => {
        const model = fromDot('digraph G { A:port1 -> B; A:port2 -> B; }');
        const edges = Array.from(model.edges);
        const id1 = getEdgeId(edges[0]);
        const id2 = getEdgeId(edges[1]);
        expect(id1).toBe('A:port1__to__B');
        expect(id2).toBe('A:port2__to__B');
        expect(id1).not.toBe(id2);
      });

      it('should work with record shape ports', () => {
        const model = fromDot('digraph G { struct1 [shape=record, label="<f0> left|<f1> right"]; struct1:f1 -> B; }');
        const edge = Array.from(model.edges)[0];
        expect(getEdgeId(edge)).toBe('struct1:f1__to__B');
      });

      it('should work with HTML table PORT attributes', () => {
        const model = fromDot('digraph G { A [label=<<TABLE><TR><TD PORT="p1">Cell</TD></TR></TABLE>>]; A:p1 -> B; }');
        const edge = Array.from(model.edges)[0];
        expect(getEdgeId(edge)).toBe('A:p1__to__B');
      });

      it('should prioritize custom ID over port-based ID', () => {
        const model = fromDot('digraph G { A:port1 -> B:port2 [id="custom"]; }');
        const edge = Array.from(model.edges)[0];
        expect(getEdgeId(edge)).toBe('custom');
      });
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

    describe('subgraph support', () => {
      it('should find nodes in subgraphs and at top level', () => {
        const model = fromDot('digraph G { subgraph cluster_test { A; B; } C; }');
        expect(findNodeById(model, 'A')).toBeDefined();
        expect(findNodeById(model, 'B')).toBeDefined();
        expect(findNodeById(model, 'C')).toBeDefined();
      });

      it('should find nodes in nested subgraphs', () => {
        const model = fromDot('digraph G { subgraph cluster_outer { subgraph cluster_inner { A; } B; } C; }');
        expect(findNodeById(model, 'A')).toBeDefined();
        expect(findNodeById(model, 'B')).toBeDefined();
        expect(findNodeById(model, 'C')).toBeDefined();
      });

      it('should return undefined for non-existent node in graph with subgraphs', () => {
        const model = fromDot('digraph G { subgraph cluster_test { A; B; } C; }');
        expect(findNodeById(model, 'NonExistent')).toBeUndefined();
      });

      it('should find first match when node exists at multiple levels', () => {
        const model = fromDot('digraph G { A; subgraph cluster_test { A; } }');
        const node = findNodeById(model, 'A');
        expect(node).toBeDefined();
        expect(node!.id).toBe('A');
      });
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

    describe('port support', () => {
      it('should collect edge IDs with ports', () => {
        const model = fromDot('digraph G { A:p1 -> B:p2; C -> D:p3; }');
        const edgeIds = collectAllEdgeIds(model);
        expect(edgeIds.size).toBe(2);
        expect(edgeIds.has('A:p1__to__B:p2')).toBe(true);
        expect(edgeIds.has('C__to__D:p3')).toBe(true);
      });

      it('should generate unique edge IDs for multi-port scenarios', () => {
        const model = fromDot('digraph G { A -> B:http; A -> B:https; A -> B:admin; }');
        const edgeIds = collectAllEdgeIds(model);
        expect(edgeIds.size).toBe(3);
        expect(edgeIds.has('A__to__B:http')).toBe(true);
        expect(edgeIds.has('A__to__B:https')).toBe(true);
        expect(edgeIds.has('A__to__B:admin')).toBe(true);
      });
    });

    describe('subgraph support', () => {
      it('should collect edges connecting nodes in different subgraphs', () => {
        const dot = `digraph G {
          subgraph cluster_a { A; }
          subgraph cluster_b { B; }
          A -> B;
        }`;
        const model = fromDot(dot);
        const edgeIds = collectAllEdgeIds(model);
        expect(edgeIds.has('A__to__B')).toBe(true);
      });

      it('should handle nested subgraphs with edges', () => {
        const dot = `digraph G {
          A;
          subgraph cluster_outer {
            B;
            subgraph cluster_inner { C; }
          }
          A -> B; B -> C;
        }`;
        const model = fromDot(dot);
        const edgeIds = collectAllEdgeIds(model);
        expect(edgeIds.size).toBe(2);
        expect(edgeIds.has('A__to__B')).toBe(true);
        expect(edgeIds.has('B__to__C')).toBe(true);
      });
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
