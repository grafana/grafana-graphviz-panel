import { isEmptyDiagram, isHtmlLabel, isRecordLabel, extractGraphContent, buildGraphAttributes } from './graphvizDot';

describe('graphvizDot', () => {
  describe('isEmptyDiagram', () => {
    it('should return true for empty string', () => {
      expect(isEmptyDiagram('')).toBe(true);
    });

    it('should return true for whitespace-only string', () => {
      expect(isEmptyDiagram('   \n\t  ')).toBe(true);
    });

    it('should return true for graph with no nodes or edges', () => {
      expect(isEmptyDiagram('digraph G {}')).toBe(true);
    });

    it('should return false for graph with nodes', () => {
      expect(isEmptyDiagram('digraph G { A; }')).toBe(false);
    });

    it('should return false for graph with edges', () => {
      expect(isEmptyDiagram('digraph G { A -> B; }')).toBe(false);
    });

    it('should return false for invalid DOT syntax', () => {
      expect(isEmptyDiagram('not valid dot')).toBe(false);
    });
  });

  describe('isHtmlLabel', () => {
    it('should return true for HTML table labels', () => {
      expect(isHtmlLabel('<TABLE><TR><TD>Cell</TD></TR></TABLE>')).toBe(true);
    });

    it('should return true for HTML bold labels', () => {
      expect(isHtmlLabel('<B>Bold Text</B>')).toBe(true);
    });

    it('should return true for HTML italic labels', () => {
      expect(isHtmlLabel('<I>Italic</I>')).toBe(true);
    });

    it('should return true for HTML font labels', () => {
      expect(isHtmlLabel('<FONT color="red">Red</FONT>')).toBe(true);
    });

    it('should return true for HTML underline labels', () => {
      expect(isHtmlLabel('<U>Underline</U>')).toBe(true);
    });

    it('should return false for record labels with port syntax', () => {
      expect(isHtmlLabel('<f0> left|<f1> right')).toBe(false);
    });

    it('should return false for plain text labels', () => {
      expect(isHtmlLabel('Plain Text')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isHtmlLabel('')).toBe(false);
    });

    it('should return false for null', () => {
      expect(isHtmlLabel(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isHtmlLabel(undefined)).toBe(false);
    });

    it('should handle labels with leading whitespace', () => {
      expect(isHtmlLabel('  <B>Bold</B>')).toBe(true);
    });

    it('should handle labels with trailing whitespace', () => {
      expect(isHtmlLabel('<TABLE></TABLE>  ')).toBe(true);
    });
  });

  describe('isRecordLabel', () => {
    it('should return true for simple record label with pipe separator', () => {
      expect(isRecordLabel('left|right')).toBe(true);
    });

    it('should return true for record label with port syntax', () => {
      expect(isRecordLabel('<f0> left|<f1> middle|<f2> right')).toBe(true);
    });

    it('should return true for complex nested record labels', () => {
      expect(isRecordLabel('hello\\nworld |{ b |{c|<here> d|e}| f}| g | h')).toBe(true);
    });

    it('should return true for record with single pipe', () => {
      expect(isRecordLabel('A|B')).toBe(true);
    });

    it('should return false for plain text without pipe', () => {
      expect(isRecordLabel('Plain Text')).toBe(false);
    });

    it('should return false for HTML labels without pipe', () => {
      expect(isRecordLabel('<TABLE><TR><TD>Cell</TD></TR></TABLE>')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isRecordLabel('')).toBe(false);
    });

    it('should return false for null', () => {
      expect(isRecordLabel(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isRecordLabel(undefined)).toBe(false);
    });
  });

  describe('extractGraphContent', () => {
    it('should extract content from simple digraph', () => {
      expect(extractGraphContent('digraph G { A -> B; }')).toBe(' A -> B; ');
    });

    it('should extract content from graph with quoted name', () => {
      expect(extractGraphContent('digraph "My Graph" { A -> B; }')).toBe(' A -> B; ');
    });

    it('should extract content from undirected graph', () => {
      expect(extractGraphContent('graph G { A -- B; }')).toBe(' A -- B; ');
    });

    it('should extract content from anonymous graph', () => {
      expect(extractGraphContent('digraph { A -> B; }')).toBe(' A -> B; ');
    });

    it('should handle leading whitespace', () => {
      expect(extractGraphContent('  digraph G { A -> B; }')).toBe(' A -> B; ');
    });

    it('should handle newlines', () => {
      expect(extractGraphContent('digraph G {\n  A -> B;\n}')).toBe('\n  A -> B;\n');
    });

    it('should handle complex graph with subgraphs', () => {
      const result = extractGraphContent('digraph G { subgraph cluster { A -> B; } }');
      expect(result).toBe(' subgraph cluster { A -> B; } ');
    });

    it('should preserve internal braces', () => {
      expect(extractGraphContent('digraph G { node [shape=box]; }')).toBe(' node [shape=box]; ');
    });
  });

  describe('buildGraphAttributes', () => {
    it('should return empty array when no attributes', () => {
      expect(buildGraphAttributes('neato')).toEqual([]);
    });

    it('should add rankdir for dot engine', () => {
      expect(buildGraphAttributes('dot', 'LR')).toEqual(['rankdir=LR']);
    });

    it('should not add rankdir for non-dot engine', () => {
      expect(buildGraphAttributes('neato', 'LR')).toEqual([]);
    });

    it('should add splineType when provided', () => {
      expect(buildGraphAttributes('dot', undefined, 'ortho')).toEqual(['splines=ortho']);
    });

    it('should add both rankdir and splineType', () => {
      expect(buildGraphAttributes('dot', 'TB', 'curved')).toEqual(['rankdir=TB', 'splines=curved']);
    });

    it('should handle all rank directions', () => {
      expect(buildGraphAttributes('dot', 'LR')).toEqual(['rankdir=LR']);
      expect(buildGraphAttributes('dot', 'RL')).toEqual(['rankdir=RL']);
      expect(buildGraphAttributes('dot', 'TB')).toEqual(['rankdir=TB']);
      expect(buildGraphAttributes('dot', 'BT')).toEqual(['rankdir=BT']);
    });

    it('should handle different spline types', () => {
      expect(buildGraphAttributes('dot', undefined, 'ortho')).toEqual(['splines=ortho']);
      expect(buildGraphAttributes('dot', undefined, 'polyline')).toEqual(['splines=polyline']);
      expect(buildGraphAttributes('dot', undefined, 'curved')).toEqual(['splines=curved']);
    });

    it('should respect engine check for rankdir', () => {
      expect(buildGraphAttributes('circo', 'LR')).toEqual([]);
      expect(buildGraphAttributes('fdp', 'TB')).toEqual([]);
    });
  });
});
