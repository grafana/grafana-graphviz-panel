import { isEmptyDiagram, isHtmlLabel, isRecordLabel, extractGraphContent, buildGraphAttributes } from './graphvizDot';

describe('graphvizDot', () => {
  describe('isEmptyDiagram', () => {
    const testCases = [
      { name: 'should return true for empty string', input: '', expected: true },
      { name: 'should return true for whitespace-only string', input: '   \n\t  ', expected: true },
      { name: 'should return true for graph with no nodes or edges', input: 'digraph G {}', expected: true },
      { name: 'should return false for graph with nodes', input: 'digraph G { A; }', expected: false },
      { name: 'should return false for graph with edges', input: 'digraph G { A -> B; }', expected: false },
      { name: 'should return false for invalid DOT syntax', input: 'not valid dot', expected: false },
    ];

    testCases.forEach(({ name, input, expected }) => {
      it(name, () => {
        expect(isEmptyDiagram(input)).toBe(expected);
      });
    });
  });

  describe('isHtmlLabel', () => {
    const testCases = [
      {
        name: 'should return true for HTML table labels',
        input: '<TABLE><TR><TD>Cell</TD></TR></TABLE>',
        expected: true,
      },
      { name: 'should return true for HTML bold labels', input: '<B>Bold Text</B>', expected: true },
      { name: 'should return true with whitespace', input: '  <B>Bold</B>', expected: true },
      { name: 'should return false for record label port syntax', input: '<f0> left|<f1> right', expected: false },
      { name: 'should return false for plain text', input: 'Plain Text', expected: false },
      { name: 'should return false for null/undefined', input: null, expected: false },
    ];

    testCases.forEach(({ name, input, expected }) => {
      it(name, () => {
        expect(isHtmlLabel(input)).toBe(expected);
      });
    });
  });

  describe('isRecordLabel', () => {
    const testCases = [
      { name: 'should return true for simple pipe separator', input: 'left|right', expected: true },
      { name: 'should return true for port syntax', input: '<f0> left|<f1> middle|<f2> right', expected: true },
      {
        name: 'should return true for complex nested labels',
        input: 'hello\\nworld |{ b |{c|<here> d|e}| f}| g | h',
        expected: true,
      },
      { name: 'should return false for plain text', input: 'Plain Text', expected: false },
      {
        name: 'should return false for HTML without pipe',
        input: '<TABLE><TR><TD>Cell</TD></TR></TABLE>',
        expected: false,
      },
      { name: 'should return false for null/undefined', input: null, expected: false },
    ];

    testCases.forEach(({ name, input, expected }) => {
      it(name, () => {
        expect(isRecordLabel(input)).toBe(expected);
      });
    });
  });

  describe('extractGraphContent', () => {
    const testCases = [
      { name: 'should extract from simple digraph', input: 'digraph G { A -> B; }', expected: ' A -> B; ' },
      { name: 'should extract from quoted name', input: 'digraph "My Graph" { A -> B; }', expected: ' A -> B; ' },
      { name: 'should extract from undirected graph', input: 'graph G { A -- B; }', expected: ' A -- B; ' },
      { name: 'should handle whitespace', input: '  digraph G { A -> B; }', expected: ' A -> B; ' },
      { name: 'should preserve newlines', input: 'digraph G {\n  A -> B;\n}', expected: '\n  A -> B;\n' },
      {
        name: 'should preserve internal braces',
        input: 'digraph G { node [shape=box]; }',
        expected: ' node [shape=box]; ',
      },
    ];

    testCases.forEach(({ name, input, expected }) => {
      it(name, () => {
        expect(extractGraphContent(input)).toBe(expected);
      });
    });
  });

  describe('buildGraphAttributes', () => {
    const testCases = [
      { name: 'should return empty when no attributes', engine: 'neato', expected: [] },
      { name: 'should add rankdir for dot engine', engine: 'dot', rankdir: 'LR', expected: ['rankdir=LR'] },
      { name: 'should not add rankdir for non-dot engine', engine: 'neato', rankdir: 'LR', expected: [] },
      { name: 'should add splineType', engine: 'dot', splineType: 'ortho', expected: ['splines=ortho'] },
      {
        name: 'should add both attributes',
        engine: 'dot',
        rankdir: 'TB',
        splineType: 'curved',
        expected: ['rankdir=TB', 'splines=curved'],
      },
    ];

    testCases.forEach(({ name, engine, rankdir, splineType, expected }) => {
      it(name, () => {
        expect(buildGraphAttributes(engine, rankdir, splineType)).toEqual(expected);
      });
    });
  });
});
