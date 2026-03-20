import { applyGraphDefaults } from './sanitization';
import { GrafanaTheme2 } from '@grafana/data';

describe('sanitization', () => {
  const mockTheme: GrafanaTheme2 = {
    colors: {
      primary: {
        main: '#3274D9',
        border: '#6E9FFF',
        contrastText: '#FFFFFF',
      },
      background: {
        primary: '#111217',
        secondary: '#18181B',
      },
      text: {
        primary: '#D8D9DA',
      },
    },
    typography: {
      fontFamily: 'Inter, Helvetica, Arial, sans-serif',
      fontSize: 14,
    },
  } as any;

  describe('applyGraphDefaults', () => {
    it('should apply theme defaults to simple graph', () => {
      const dot = 'digraph G { A -> B; }';

      const result = applyGraphDefaults(dot, mockTheme);

      expect(result).toContain('digraph');
      expect(result).toContain('A');
      expect(result).toContain('B');
      expect(result).toContain('Inter');
    });

    it('should preserve existing node attributes', () => {
      const dot = 'digraph G { A [label="Node A", color=red]; }';

      const result = applyGraphDefaults(dot, mockTheme);

      expect(result).toContain('Node A');
      expect(result).toContain('red');
    });

    it('should handle empty graph', () => {
      const dot = 'digraph G {}';

      const result = applyGraphDefaults(dot, mockTheme);

      expect(result).toContain('digraph');
    });

    it('should handle undirected graph', () => {
      const dot = 'graph G { A -- B; }';

      const result = applyGraphDefaults(dot, mockTheme);

      expect(result).toContain('graph');
      expect(result).toContain('A');
      expect(result).toContain('B');
    });

    it('should return original string on parse error', () => {
      const invalidDot = 'invalid syntax {{{';

      const result = applyGraphDefaults(invalidDot, mockTheme);

      expect(result).toBe(invalidDot);
    });

    it('should handle graph with subgraphs', () => {
      const dot = `digraph G {
        subgraph cluster_0 {
          A -> B;
        }
      }`;

      const result = applyGraphDefaults(dot, mockTheme);

      expect(result).toContain('subgraph');
      expect(result).toContain('A');
      expect(result).toContain('B');
    });

    it('should apply font attributes from theme', () => {
      const dot = 'digraph G { A; }';

      const result = applyGraphDefaults(dot, mockTheme);

      expect(result).toContain('fontname');
      expect(result).toContain('fontsize');
    });

    it('should handle graph with existing graph-level attributes', () => {
      const dot = 'digraph G { graph [rankdir=LR]; A -> B; }';

      const result = applyGraphDefaults(dot, mockTheme);

      expect(result).toContain('rankdir');
      expect(result).toContain('A');
      expect(result).toContain('B');
    });

    it('should handle multiple nodes and edges', () => {
      const dot = 'digraph G { A -> B; B -> C; C -> D; D -> A; }';

      const result = applyGraphDefaults(dot, mockTheme);

      expect(result).toContain('A');
      expect(result).toContain('B');
      expect(result).toContain('C');
      expect(result).toContain('D');
    });

    it('should handle nodes with shapes', () => {
      const dot = 'digraph G { A [shape=box]; B [shape=circle]; }';

      const result = applyGraphDefaults(dot, mockTheme);

      expect(result).toContain('box');
      expect(result).toContain('circle');
    });

    it('should handle HTML labels', () => {
      const dot = `digraph G {
        A [label=<<TABLE><TR><TD>Cell</TD></TR></TABLE>>];
      }`;

      const result = applyGraphDefaults(dot, mockTheme);

      expect(result).toContain('TABLE');
      expect(result).toContain('Cell');
    });

    it('should preserve edge attributes', () => {
      const dot = 'digraph G { A -> B [label="edge", color=blue]; }';

      const result = applyGraphDefaults(dot, mockTheme);

      expect(result).toContain('edge');
      expect(result).toContain('blue');
    });

    it('should handle plaintext shape nodes', () => {
      const dot = 'digraph G { graph [node [shape=plaintext]]; A; B; }';

      const result = applyGraphDefaults(dot, mockTheme);

      expect(result).toContain('plaintext');
      expect(result).toContain('A');
      expect(result).toContain('B');
    });

    it('should skip style/fillcolor/color for plaintext shapes (no HTML labels)', () => {
      const dot = 'digraph G { node [shape=plaintext]; A; B; }';

      const result = applyGraphDefaults(dot, mockTheme);

      expect(result).toContain('plaintext');
      expect(result).not.toContain('filled');
      expect(result).not.toContain('fillcolor');
    });

    it('should skip style/fillcolor/color for plaintext shapes (with HTML labels)', () => {
      const dot = `digraph G {
        node [shape=plaintext];
        A [label=<<B>Bold</B>>];
        B;
      }`;

      const result = applyGraphDefaults(dot, mockTheme);

      expect(result).toContain('plaintext');
      expect(result).toContain('Bold');
      expect(result).not.toContain('filled');
    });

    it('should handle HTML label without existing font attributes', () => {
      const dot = `digraph G {
        A [label=<<TABLE><TR><TD>Cell 1</TD></TR></TABLE>>];
        B [label="Plain text"];
      }`;

      const result = applyGraphDefaults(dot, mockTheme);

      expect(result).toContain('TABLE');
      expect(result).toContain('Cell 1');
      expect(result).toContain('Plain text');
      expect(result).toContain('fontname');
    });

    it('should apply font attributes to non-HTML nodes when HTML labels exist', () => {
      const dot = `digraph G {
        A [label=<<B>HTML</B>>];
        B;
        C [label="Plain"];
      }`;

      const result = applyGraphDefaults(dot, mockTheme);

      expect(result).toContain('HTML');
      expect(result).toContain('fontname');
      expect(result).toContain('fontsize');
    });

    it('should promote implicit nodes when HTML labels exist', () => {
      const dot = `digraph G {
        A [label=<<I>Italic</I>>];
        A -> B;
        B -> C;
      }`;

      const result = applyGraphDefaults(dot, mockTheme);

      expect(result).toContain('Italic');
      expect(result).toContain('B');
      expect(result).toContain('C');
    });

    it('should skip font attributes for nodes with HTML labels', () => {
      const dot = `digraph G {
        A [label=<<TABLE BORDER="0"><TR><TD>HTML Content</TD></TR></TABLE>>];
        B [label="Normal"];
      }`;

      const result = applyGraphDefaults(dot, mockTheme);

      expect(result).toContain('HTML Content');
      expect(result).toContain('Normal');
    });

    it('should handle mixed HTML and non-HTML labels with existing attributes', () => {
      const dot = `digraph G {
        A [label=<<B>Bold</B>>, color=red];
        B [label="Plain", fontsize=20];
        C;
      }`;

      const result = applyGraphDefaults(dot, mockTheme);

      expect(result).toContain('Bold');
      expect(result).toContain('Plain');
      expect(result).toContain('red');
      expect(result).toContain('20');
    });

    it('should handle HTML labels with implicit node promotion', () => {
      const dot = `digraph G {
        X -> Y;
        Y [label=<<U>Underline</U>>];
        Y -> Z;
      }`;

      const result = applyGraphDefaults(dot, mockTheme);

      expect(result).toContain('Underline');
      expect(result).toContain('X');
      expect(result).toContain('Z');
    });

    it('should apply edge defaults at graph level', () => {
      const dot = 'digraph G { A -> B; B -> C; }';

      const result = applyGraphDefaults(dot, mockTheme);

      expect(result).toContain('edge');
      expect(result).toContain('fontname');
      expect(result).toContain('Inter');
    });

    it('should not override existing edge attributes', () => {
      const dot = 'digraph G { edge [fontsize=20]; A -> B; }';

      const result = applyGraphDefaults(dot, mockTheme);

      expect(result).toContain('20');
    });

    it('should apply font attributes to non-HTML nodes when HTML labels exist elsewhere', () => {
      const dot = `digraph G {
        node1 [label=<<B>HTML Label</B>>];
        node2 [label="Plain Text"];
        node3;
      }`;

      const result = applyGraphDefaults(dot, mockTheme);

      expect(result).toContain('HTML Label');
      expect(result).toContain('Plain Text');
      expect(result).toContain('fontname');
      expect(result).toContain('Inter');
    });

    it('should promote implicit nodes when HTML labels are present', () => {
      const dot = `digraph G {
        A [label=<<I>HTML</I>>];
        A -> B;
        B -> C;
      }`;

      const result = applyGraphDefaults(dot, mockTheme);

      expect(result).toContain('HTML');
      expect(result).toContain('B');
      expect(result).toContain('C');
      expect(result).toContain('fontname');
    });

    it('should skip font attributes for nodes with HTML labels', () => {
      const dot = `digraph G {
        A [label=<<TABLE><TR><TD>Cell</TD></TR></TABLE>>];
        B [label="Normal"];
      }`;

      const result = applyGraphDefaults(dot, mockTheme);

      expect(result).toContain('TABLE');
      expect(result).toContain('Normal');
      expect(result).toContain('fontname');
    });

    it('should handle nodes with both HTML and non-HTML labels in same graph', () => {
      const dot = `digraph G {
        html_node [label=<<B>Bold</B>>];
        plain_node1 [label="Plain 1"];
        plain_node2 [label="Plain 2"];
        html_node -> plain_node1;
        plain_node1 -> plain_node2;
      }`;

      const result = applyGraphDefaults(dot, mockTheme);

      expect(result).toContain('Bold');
      expect(result).toContain('Plain 1');
      expect(result).toContain('Plain 2');
    });

    it('should skip style/fillcolor for plaintext shapes with HTML labels present', () => {
      const dot = `digraph G {
        node [shape=plaintext];
        html_node [label=<<B>HTML</B>>];
        plain_node;
      }`;

      const result = applyGraphDefaults(dot, mockTheme);

      expect(result).toContain('HTML');
      expect(result).toContain('plaintext');
      expect(result).not.toContain('filled');
    });

    it('should handle graph with only implicit nodes and HTML label', () => {
      const dot = `digraph G {
        A [label=<<U>Underlined</U>>];
        A -> B -> C -> D;
      }`;

      const result = applyGraphDefaults(dot, mockTheme);

      expect(result).toContain('Underlined');
      expect(result).toContain('B');
      expect(result).toContain('C');
      expect(result).toContain('D');
    });

    it('should handle complex HTML labels with nested elements', () => {
      const dot = `digraph G {
        node1 [label=<<TABLE BORDER="1"><TR><TD><B>Header</B></TD></TR><TR><TD>Data</TD></TR></TABLE>>];
        node2 [label="Simple"];
      }`;

      const result = applyGraphDefaults(dot, mockTheme);

      expect(result).toContain('Header');
      expect(result).toContain('Data');
      expect(result).toContain('Simple');
    });

    it('should not apply font attributes to nodes already having them', () => {
      const dot = `digraph G {
        A [label=<<I>HTML</I>>];
        B [label="Plain", fontname="Arial", fontsize=16];
        C;
      }`;

      const result = applyGraphDefaults(dot, mockTheme);

      expect(result).toContain('Arial');
      expect(result).toContain('16');
    });

    it('should handle multiple HTML-labeled nodes', () => {
      const dot = `digraph G {
        A [label=<<B>Bold A</B>>];
        B [label=<<I>Italic B</I>>];
        C [label="Plain C"];
      }`;

      const result = applyGraphDefaults(dot, mockTheme);

      expect(result).toContain('Bold A');
      expect(result).toContain('Italic B');
      expect(result).toContain('Plain C');
    });
  });

  describe('normalizeNodePathStyling', () => {
    it('should mark path elements with custom fill colors', () => {
      const svgString = `
        <svg>
          <g class="node">
            <path fill="#FF0000"></path>
          </g>
        </svg>
      `;
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgString, 'image/svg+xml');
      const svgElement = doc.documentElement as any as SVGSVGElement;
      const { normalizeNodePathStyling } = require('./sanitization');
      const d3 = require('d3-selection');

      normalizeNodePathStyling(d3.select(svgElement));

      const path = svgElement.querySelector('path');
      expect(path?.getAttribute('data-has-custom-fill')).toBe('true');
    });

    it('should not mark path elements with fill="none"', () => {
      const svgString = `
        <svg>
          <g class="node">
            <path fill="none"></path>
          </g>
        </svg>
      `;
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgString, 'image/svg+xml');
      const svgElement = doc.documentElement as any as SVGSVGElement;
      const { normalizeNodePathStyling } = require('./sanitization');
      const d3 = require('d3-selection');

      normalizeNodePathStyling(d3.select(svgElement));

      const path = svgElement.querySelector('path');
      expect(path?.getAttribute('data-has-custom-fill')).toBeNull();
    });

    it('should not mark path elements with default colors', () => {
      const svgString = `
        <svg>
          <g class="node">
            <path fill="black"></path>
          </g>
          <g class="node">
            <path fill="white"></path>
          </g>
        </svg>
      `;
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgString, 'image/svg+xml');
      const svgElement = doc.documentElement as any as SVGSVGElement;
      const { normalizeNodePathStyling } = require('./sanitization');
      const d3 = require('d3-selection');

      normalizeNodePathStyling(d3.select(svgElement));

      const paths = svgElement.querySelectorAll('path');
      paths.forEach((path) => {
        expect(path.getAttribute('data-has-custom-fill')).toBeNull();
      });
    });

    it('should handle multiple node paths correctly', () => {
      const svgString = `
        <svg>
          <g class="node">
            <path fill="#00FF00"></path>
          </g>
          <g class="node">
            <path fill="blue"></path>
          </g>
          <g class="node">
            <path fill="none"></path>
          </g>
        </svg>
      `;
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgString, 'image/svg+xml');
      const svgElement = doc.documentElement as any as SVGSVGElement;
      const { normalizeNodePathStyling } = require('./sanitization');
      const d3 = require('d3-selection');

      normalizeNodePathStyling(d3.select(svgElement));

      const paths = svgElement.querySelectorAll('path');
      expect(paths[0].getAttribute('data-has-custom-fill')).toBe('true');
      expect(paths[1].getAttribute('data-has-custom-fill')).toBe('true');
      expect(paths[2].getAttribute('data-has-custom-fill')).toBeNull();
    });
  });

  describe('HTML label handling with mixed node types', () => {
    it('should skip font attributes for HTML-labeled nodes but apply to plaintext nodes', () => {
      const dot = `digraph G {
        html_node [label=<<B>HTML</B>>];
        plain_node1 [label="Plain"];
        plain_node2;
      }`;

      const result = applyGraphDefaults(dot, mockTheme);

      expect(result).toContain('HTML');
      expect(result).toContain('Plain');
      expect(result).toContain('fontname');
    });

    it('should handle plaintext shapes when HTML labels exist', () => {
      const dot = `digraph G {
        node [shape=plaintext];
        html_node [label=<<I>Italic</I>>];
        plain_node;
      }`;

      const result = applyGraphDefaults(dot, mockTheme);

      expect(result).toContain('Italic');
      expect(result).toContain('plaintext');
    });

    it('should promote implicit nodes when HTML labels exist', () => {
      const dot = `digraph G {
        A [label=<<U>Underlined</U>>];
        A -> B -> C;
      }`;

      const result = applyGraphDefaults(dot, mockTheme);

      expect(result).toContain('Underlined');
      expect(result).toContain('B');
      expect(result).toContain('C');
    });

    it('should handle nodes with existing font attributes', () => {
      const dot = `digraph G {
        A [label=<<B>Bold</B>>];
        B [label="Plain", fontname="Arial"];
        C;
      }`;

      const result = applyGraphDefaults(dot, mockTheme);

      expect(result).toContain('Bold');
      expect(result).toContain('Arial');
    });

    it('should apply non-font attributes at graph level when HTML exists', () => {
      const dot = `digraph G {
        html_node [label=<<TABLE><TR><TD>Data</TD></TR></TABLE>>];
        plain_node;
      }`;

      const result = applyGraphDefaults(dot, mockTheme);

      expect(result).toContain('TABLE');
      expect(result).toContain('style');
    });

    it('should handle all implicit nodes in edge chains with HTML', () => {
      const dot = `digraph G {
        Start [label=<<FONT>Start</FONT>>];
        Start -> Middle1 -> Middle2 -> End;
      }`;

      const result = applyGraphDefaults(dot, mockTheme);

      expect(result).toContain('Start');
      expect(result).toContain('Middle1');
      expect(result).toContain('Middle2');
      expect(result).toContain('End');
    });

    it('should not apply style/fillcolor to plaintext shapes with HTML labels', () => {
      const dot = `digraph G {
        graph [node [shape=plaintext]];
        A [label=<<B>HTML</B>>];
        B;
      }`;

      const result = applyGraphDefaults(dot, mockTheme);

      expect(result).toContain('HTML');
      expect(result).toContain('plaintext');
    });

    it('should handle mixed HTML and plaintext in complex graphs', () => {
      const dot = `digraph G {
        node1 [label=<<TABLE BORDER="1"><TR><TD>Cell1</TD></TR></TABLE>>];
        node2 [label="Plain Label"];
        node3 [label=<<I>Italic</I>>];
        node4;
        node1 -> node2 -> node3 -> node4;
      }`;

      const result = applyGraphDefaults(dot, mockTheme);

      expect(result).toContain('TABLE');
      expect(result).toContain('Plain Label');
      expect(result).toContain('Italic');
      expect(result).toContain('fontname');
    });
  });
});
