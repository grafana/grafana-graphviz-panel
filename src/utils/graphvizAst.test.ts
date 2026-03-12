import { getEdgeId, findNodeById, collectAllNodeIds, hasAnyHtmlLabels } from './graphvizAst';
import { fromDot } from 'ts-graphviz';

describe('graphvizAst', () => {
  describe('getEdgeId', () => {
    it('should return existing edge ID if present', () => {
      const model = fromDot('digraph G { A -> B [id="custom_id"]; }');
      const edge = Array.from(model.edges)[0];

      expect(getEdgeId(edge)).toBe('custom_id');
    });

    it('should derive edge ID from source and target nodes', () => {
      const model = fromDot('digraph G { A -> B; }');
      const edge = Array.from(model.edges)[0];

      expect(getEdgeId(edge)).toBe('A__to__B');
    });

    it('should derive edge ID with quoted node names', () => {
      const model = fromDot('digraph G { "Node 1" -> "Node 2"; }');
      const edge = Array.from(model.edges)[0];

      expect(getEdgeId(edge)).toBe('Node 1__to__Node 2');
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
    it('should find node by ID', () => {
      const model = fromDot('digraph G { A; B; C; }');

      const node = findNodeById(model, 'B');

      expect(node).toBeDefined();
      expect(node!.id).toBe('B');
    });

    it('should find node with quoted ID', () => {
      const model = fromDot('digraph G { "Node 1"; "Node 2"; }');

      const node = findNodeById(model, 'Node 1');

      expect(node).toBeDefined();
      expect(node!.id).toBe('Node 1');
    });

    it('should return undefined for non-existent node', () => {
      const model = fromDot('digraph G { A; B; }');

      const node = findNodeById(model, 'NonExistent');

      expect(node).toBeUndefined();
    });

    it('should find node in graph with edges', () => {
      const model = fromDot('digraph G { A; B; C; A -> B; B -> C; }');

      const nodeB = findNodeById(model, 'B');

      expect(nodeB).toBeDefined();
      expect(nodeB!.id).toBe('B');
    });
  });

  describe('collectAllNodeIds', () => {
    it('should collect explicit node IDs', () => {
      const model = fromDot('digraph G { A; B; C; }');
      const nodeIds = collectAllNodeIds(model);

      expect(nodeIds.size).toBe(3);
      expect(nodeIds.has('A')).toBe(true);
      expect(nodeIds.has('B')).toBe(true);
      expect(nodeIds.has('C')).toBe(true);
    });

    it('should collect implicit node IDs from edges', () => {
      const model = fromDot('digraph G { A -> B -> C; }');
      const nodeIds = collectAllNodeIds(model);

      expect(nodeIds.size).toBe(3);
      expect(nodeIds.has('A')).toBe(true);
      expect(nodeIds.has('B')).toBe(true);
      expect(nodeIds.has('C')).toBe(true);
    });

    it('should collect both explicit and implicit node IDs without duplicates', () => {
      const model = fromDot('digraph G { A; B; A -> B -> C; }');
      const nodeIds = collectAllNodeIds(model);

      expect(nodeIds.size).toBe(3);
      expect(nodeIds.has('A')).toBe(true);
      expect(nodeIds.has('B')).toBe(true);
      expect(nodeIds.has('C')).toBe(true);
    });

    it('should handle empty graph', () => {
      const model = fromDot('digraph G {}');
      const nodeIds = collectAllNodeIds(model);

      expect(nodeIds.size).toBe(0);
    });

    it('should handle multiple edges with overlapping nodes', () => {
      const model = fromDot('digraph G { A -> B; B -> C; C -> A; }');
      const nodeIds = collectAllNodeIds(model);

      expect(nodeIds.size).toBe(3);
      expect(nodeIds.has('A')).toBe(true);
      expect(nodeIds.has('B')).toBe(true);
      expect(nodeIds.has('C')).toBe(true);
    });

    it('should handle nodes with quoted IDs', () => {
      const model = fromDot('digraph G { "Node 1" -> "Node 2"; }');
      const nodeIds = collectAllNodeIds(model);

      expect(nodeIds.size).toBe(2);
      expect(nodeIds.has('Node 1')).toBe(true);
      expect(nodeIds.has('Node 2')).toBe(true);
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

    it('should return false when no HTML labels exist', () => {
      const model = fromDot('digraph G { A [label="Plain"]; B; }');
      expect(hasAnyHtmlLabels(model, mockIsHtmlLabel)).toBe(false);
    });

    it('should return true when HTML label exists', () => {
      const model = fromDot('digraph G { A [label=<<B>HTML</B>>]; B; }');
      expect(hasAnyHtmlLabels(model, mockIsHtmlLabel)).toBe(true);
    });

    it('should return true when any node has HTML label', () => {
      const model = fromDot('digraph G { A [label="Plain"]; B [label=<<TABLE></TABLE>>]; }');
      expect(hasAnyHtmlLabels(model, mockIsHtmlLabel)).toBe(true);
    });

    it('should return false for empty graph', () => {
      const model = fromDot('digraph G {}');
      expect(hasAnyHtmlLabels(model, mockIsHtmlLabel)).toBe(false);
    });

    it('should only check explicit nodes not implicit ones', () => {
      const model = fromDot('digraph G { A -> B -> C; }');
      expect(hasAnyHtmlLabels(model, mockIsHtmlLabel)).toBe(false);
    });

    it('should handle nodes without labels', () => {
      const model = fromDot('digraph G { A; B; C; }');
      expect(hasAnyHtmlLabels(model, mockIsHtmlLabel)).toBe(false);
    });
  });
});
