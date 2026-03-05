import { isEmptyDiagram } from './graphvizDot';

describe('isEmptyDiagram', () => {
  it.each([
    ['empty string', '', true],
    ['whitespace only - spaces', '   ', true],
    ['whitespace only - mixed', '\n\t  ', true],
    ['digraph with no nodes', 'digraph {}', true],
    ['named digraph with no nodes', 'digraph G {}', true],
    ['undirected graph with no nodes', 'graph {}', true],
    ['undefined input', undefined, true],
    ['null input', null, true],
    ['digraph with single node', 'digraph { A }', false],
    ['digraph with edge', 'digraph { A -> B }', false],
    ['digraph with multiple edges', 'digraph G { A -> B -> C; }', false],
    ['invalid DOT syntax - incomplete edge', 'digraph { A -> }', false],
    ['invalid DOT syntax - not DOT', 'invalid syntax', false],
  ])('should return %s for %s', (_description: string, input: any, expected: boolean) => {
    expect(isEmptyDiagram(input)).toBe(expected);
  });
});
