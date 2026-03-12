import { isDirectedGraph, formatEdgeId, parseEdgeId } from './builderMode';

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
});
