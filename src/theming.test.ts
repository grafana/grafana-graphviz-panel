import { applySvgTheming } from './theming';
import { GrafanaTheme2 } from '@grafana/data';

describe('theming', () => {
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

  function createSvgElement(content: string): SVGSVGElement {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<svg>${content}</svg>`, 'image/svg+xml');
    const svg = doc.documentElement as any as SVGSVGElement;

    if (!(svg as any).style) {
      (svg as any).style = {
        setProperty: jest.fn(),
        getPropertyValue: jest.fn(),
      };
    }

    return svg;
  }

  describe('applySvgTheming', () => {
    describe('SVG base styling', () => {
      it('should apply styling without errors', () => {
        const svg = createSvgElement('');

        expect(() => applySvgTheming(svg, mockTheme)).not.toThrow();
      });

      it('should remove white fill from polygons', () => {
        const svg = createSvgElement('<polygon fill="white"/>');

        applySvgTheming(svg, mockTheme);

        const polygon = svg.querySelector('polygon');
        expect(polygon?.getAttribute('fill')).toBe('none');
      });
    });

    describe('ellipse theming', () => {
      it('should apply theme color to ellipses with default stroke', () => {
        const svg = createSvgElement('<ellipse stroke="black"/>');

        applySvgTheming(svg, mockTheme);

        const ellipse = svg.querySelector('ellipse');
        expect(ellipse?.getAttribute('stroke')).toBe(mockTheme.colors.text.primary);
      });

      it('should preserve custom stroke on ellipses', () => {
        const svg = createSvgElement('<ellipse stroke="#FF0000"/>');

        applySvgTheming(svg, mockTheme);

        const ellipse = svg.querySelector('ellipse');
        expect(ellipse?.getAttribute('stroke')).toBe('#FF0000');
      });

      it('should apply theme fill to ellipses with default fill', () => {
        const svg = createSvgElement('<ellipse fill="white"/>');

        applySvgTheming(svg, mockTheme);

        const ellipse = svg.querySelector('ellipse');
        expect(ellipse?.getAttribute('fill')).toBe(mockTheme.colors.background.secondary);
      });

      it('should preserve custom fill on ellipses', () => {
        const svg = createSvgElement('<ellipse fill="blue"/>');

        applySvgTheming(svg, mockTheme);

        const ellipse = svg.querySelector('ellipse');
        expect(ellipse?.getAttribute('fill')).toBe('blue');
      });
    });

    describe('node polygon theming', () => {
      it('should apply theme stroke to node polygons with default stroke', () => {
        const svg = createSvgElement('<g class="node"><polygon stroke="black"/></g>');

        applySvgTheming(svg, mockTheme);

        const polygon = svg.querySelector('g.node polygon');
        expect(polygon?.getAttribute('stroke')).toBe(mockTheme.colors.text.primary);
      });

      it('should preserve custom stroke on node polygons', () => {
        const svg = createSvgElement('<g class="node"><polygon stroke="red"/></g>');

        applySvgTheming(svg, mockTheme);

        const polygon = svg.querySelector('g.node polygon');
        expect(polygon?.getAttribute('stroke')).toBe('red');
      });

      it('should apply theme fill to node polygons with default fill', () => {
        const svg = createSvgElement('<g class="node"><polygon fill="black"/></g>');

        applySvgTheming(svg, mockTheme);

        const polygon = svg.querySelector('g.node polygon');
        expect(polygon?.getAttribute('fill')).toBe(mockTheme.colors.background.secondary);
      });

      it('should not change fill="none" on node polygons', () => {
        const svg = createSvgElement('<g class="node"><polygon fill="none"/></g>');

        applySvgTheming(svg, mockTheme);

        const polygon = svg.querySelector('g.node polygon');
        expect(polygon?.getAttribute('fill')).toBe('none');
      });

      it('should preserve custom fill on node polygons', () => {
        const svg = createSvgElement('<g class="node"><polygon fill="green"/></g>');

        applySvgTheming(svg, mockTheme);

        const polygon = svg.querySelector('g.node polygon');
        expect(polygon?.getAttribute('fill')).toBe('green');
      });
    });

    describe('node polyline theming', () => {
      it('should apply theme stroke to node polylines with default stroke', () => {
        const svg = createSvgElement('<g class="node"><polyline stroke="black"/></g>');

        applySvgTheming(svg, mockTheme);

        const polyline = svg.querySelector('g.node polyline');
        expect(polyline?.getAttribute('stroke')).toBe(mockTheme.colors.text.primary);
      });

      it('should preserve custom stroke on node polylines', () => {
        const svg = createSvgElement('<g class="node"><polyline stroke="purple"/></g>');

        applySvgTheming(svg, mockTheme);

        const polyline = svg.querySelector('g.node polyline');
        expect(polyline?.getAttribute('stroke')).toBe('purple');
      });
    });

    describe('edge path theming', () => {
      it('should apply theme stroke to edge paths with default stroke', () => {
        const svg = createSvgElement('<g class="edge"><path stroke="black"/></g>');

        applySvgTheming(svg, mockTheme);

        const path = svg.querySelector('g.edge path');
        expect(path?.getAttribute('stroke')).toBe(mockTheme.colors.text.primary);
        expect(path?.getAttribute('fill')).toBe('none');
      });

      it('should preserve custom stroke on edge paths', () => {
        const svg = createSvgElement('<g class="edge"><path stroke="orange"/></g>');

        applySvgTheming(svg, mockTheme);

        const path = svg.querySelector('g.edge path');
        expect(path?.getAttribute('stroke')).toBe('orange');
      });

      it('should always set fill="none" on edge paths', () => {
        const svg = createSvgElement('<g class="edge"><path fill="red"/></g>');

        applySvgTheming(svg, mockTheme);

        const path = svg.querySelector('g.edge path');
        expect(path?.getAttribute('fill')).toBe('none');
      });
    });

    describe('node path theming', () => {
      it('should apply theme stroke to node paths with default stroke', () => {
        const svg = createSvgElement('<g class="node"><path stroke="black"/></g>');

        applySvgTheming(svg, mockTheme);

        const path = svg.querySelector('g.node path');
        expect(path?.getAttribute('stroke')).toBe(mockTheme.colors.text.primary);
      });

      it('should preserve custom stroke on node paths', () => {
        const svg = createSvgElement('<g class="node"><path stroke="yellow"/></g>');

        applySvgTheming(svg, mockTheme);

        const path = svg.querySelector('g.node path');
        expect(path?.getAttribute('stroke')).toBe('yellow');
      });

      it('should apply theme fill to node paths with default fill', () => {
        const svg = createSvgElement('<g class="node"><path fill="white"/></g>');

        applySvgTheming(svg, mockTheme);

        const path = svg.querySelector('g.node path');
        expect(path?.getAttribute('fill')).toBe(mockTheme.colors.background.secondary);
      });

      it('should not change fill="none" on node paths', () => {
        const svg = createSvgElement('<g class="node"><path fill="none"/></g>');

        applySvgTheming(svg, mockTheme);

        const path = svg.querySelector('g.node path');
        expect(path?.getAttribute('fill')).toBe('none');
      });

      it('should preserve custom fill on node paths', () => {
        const svg = createSvgElement('<g class="node"><path fill="cyan"/></g>');

        applySvgTheming(svg, mockTheme);

        const path = svg.querySelector('g.node path');
        expect(path?.getAttribute('fill')).toBe('cyan');
      });
    });

    describe('edge polygon (arrowhead) theming', () => {
      it('should apply theme color to edge polygons with default fill', () => {
        const svg = createSvgElement('<g class="edge"><polygon fill="black"/></g>');

        applySvgTheming(svg, mockTheme);

        const polygon = svg.querySelector('g.edge polygon');
        expect(polygon?.getAttribute('fill')).toBe(mockTheme.colors.text.primary);
        expect(polygon?.getAttribute('stroke')).toBe(mockTheme.colors.text.primary);
      });

      it('should apply theme color to edge polygons with default stroke', () => {
        const svg = createSvgElement('<g class="edge"><polygon stroke="white"/></g>');

        applySvgTheming(svg, mockTheme);

        const polygon = svg.querySelector('g.edge polygon');
        expect(polygon?.getAttribute('fill')).toBe(mockTheme.colors.text.primary);
        expect(polygon?.getAttribute('stroke')).toBe(mockTheme.colors.text.primary);
      });

      it('should preserve custom color on edge polygons', () => {
        const svg = createSvgElement('<g class="edge"><polygon fill="red" stroke="red"/></g>');

        applySvgTheming(svg, mockTheme);

        const polygon = svg.querySelector('g.edge polygon');
        expect(polygon?.getAttribute('fill')).toBe('red');
        expect(polygon?.getAttribute('stroke')).toBe('red');
      });

      it('should use fillColor when both are default', () => {
        const svg = createSvgElement('<g class="edge"><polygon fill="black" stroke="white"/></g>');

        applySvgTheming(svg, mockTheme);

        const polygon = svg.querySelector('g.edge polygon');
        expect(polygon?.getAttribute('fill')).toBe(mockTheme.colors.text.primary);
        expect(polygon?.getAttribute('stroke')).toBe(mockTheme.colors.text.primary);
      });
    });

    describe('text theming', () => {
      it('should apply theme font and color to all text elements', () => {
        const svg = createSvgElement('<text>Sample</text><text>Other</text>');

        applySvgTheming(svg, mockTheme);

        const texts = svg.querySelectorAll('text');
        texts.forEach((text) => {
          expect(text.getAttribute('fill')).toBe(mockTheme.colors.text.primary);
          expect(text.getAttribute('font-family')).toBe(mockTheme.typography.fontFamily);
        });
      });
    });

    describe('cluster theming', () => {
      it('should apply dashed border to cluster polygons', () => {
        const svg = createSvgElement('<g class="cluster"><polygon stroke="black"/></g>');

        applySvgTheming(svg, mockTheme);

        const polygon = svg.querySelector('g.cluster polygon');
        expect(polygon?.getAttribute('stroke')).toBe(mockTheme.colors.text.primary);
        expect(polygon?.getAttribute('fill')).toBe('none');
        expect(polygon?.getAttribute('stroke-dasharray')).toBe('3,3');
        expect(polygon?.getAttribute('stroke-width')).toBe('1.5');
        expect(polygon?.getAttribute('stroke-opacity')).toBe('0.3');
      });

      it('should preserve custom stroke on cluster polygons but override style', () => {
        const svg = createSvgElement('<g class="cluster"><polygon stroke="red"/></g>');

        applySvgTheming(svg, mockTheme);

        const polygon = svg.querySelector('g.cluster polygon');
        expect(polygon?.getAttribute('stroke')).toBe('red');
        expect(polygon?.getAttribute('fill')).toBe('none');
        expect(polygon?.getAttribute('stroke-dasharray')).toBe('3,3');
      });

      it('should apply dashed border to cluster rects', () => {
        const svg = createSvgElement('<g class="cluster"><rect stroke="black"/></g>');

        applySvgTheming(svg, mockTheme);

        const rect = svg.querySelector('g.cluster rect');
        expect(rect?.getAttribute('stroke')).toBe(mockTheme.colors.text.primary);
        expect(rect?.getAttribute('fill')).toBe('none');
        expect(rect?.getAttribute('stroke-dasharray')).toBe('3,3');
        expect(rect?.getAttribute('stroke-width')).toBe('1.5');
        expect(rect?.getAttribute('stroke-opacity')).toBe('0.3');
      });

      it('should preserve custom stroke on cluster rects but override style', () => {
        const svg = createSvgElement('<g class="cluster"><rect stroke="green"/></g>');

        applySvgTheming(svg, mockTheme);

        const rect = svg.querySelector('g.cluster rect');
        expect(rect?.getAttribute('stroke')).toBe('green');
        expect(rect?.getAttribute('fill')).toBe('none');
        expect(rect?.getAttribute('stroke-dasharray')).toBe('3,3');
      });
    });

    describe('edit mode tooltips', () => {
      it('should add node ID tooltips in edit mode', () => {
        const svg = createSvgElement(`
          <g class="node">
            <title>NodeA</title>
          </g>
        `);

        applySvgTheming(svg, mockTheme, true);

        const title = svg.querySelector('g.node title');
        expect(title?.textContent).toBe('Node ID: NodeA');
      });

      it('should handle nodes without existing title in edit mode', () => {
        const svg = createSvgElement('<g class="node"><title></title></g>');

        applySvgTheming(svg, mockTheme, true);

        const title = svg.querySelector('g.node title');
        expect(title?.textContent).toBe('Node ID: Unknown');
      });

      it('should add edge ID tooltips with arrow formatting in edit mode', () => {
        const svg = createSvgElement(`
          <g class="edge">
            <title>A→B</title>
          </g>
        `);

        applySvgTheming(svg, mockTheme, true);

        const title = svg.querySelector('g.edge title');
        expect(title?.textContent).toBe('Edge ID: A__to__B');
      });

      it('should handle edge IDs with -> arrows in edit mode', () => {
        const svg = createSvgElement(`
          <g class="edge">
            <title>X->Y</title>
          </g>
        `);

        applySvgTheming(svg, mockTheme, true);

        const title = svg.querySelector('g.edge title');
        expect(title?.textContent).toBe('Edge ID: X__to__Y');
      });

      it('should handle edges without existing title in edit mode', () => {
        const svg = createSvgElement('<g class="edge"><title></title></g>');

        applySvgTheming(svg, mockTheme, true);

        const title = svg.querySelector('g.edge title');
        expect(title?.textContent).toBe('Edge ID: ');
      });

      it('should remove non-node/edge titles in edit mode', () => {
        const svg = createSvgElement(`
          <title>Graph Title</title>
          <g class="node"><title>NodeA</title></g>
          <g class="edge"><title>A->B</title></g>
          <g class="other"><title>Other</title></g>
        `);

        applySvgTheming(svg, mockTheme, true);

        const titles = svg.querySelectorAll('title');
        expect(titles.length).toBe(2);
        expect(titles[0].parentElement?.classList.contains('node')).toBe(true);
        expect(titles[1].parentElement?.classList.contains('edge')).toBe(true);
      });

      it('should replace existing node titles in edit mode', () => {
        const svg = createSvgElement(`
          <g class="node">
            <title>OldNodeId</title>
            <title>Duplicate</title>
          </g>
        `);

        applySvgTheming(svg, mockTheme, true);

        const titles = svg.querySelectorAll('g.node title');
        expect(titles.length).toBe(1);
        expect(titles[0].textContent).toBe('Node ID: OldNodeId');
      });
    });

    describe('non-edit mode', () => {
      it('should remove all titles when not in edit mode', () => {
        const svg = createSvgElement(`
          <title>Graph Title</title>
          <g class="node"><title>NodeA</title></g>
          <g class="edge"><title>A->B</title></g>
        `);

        applySvgTheming(svg, mockTheme, false);

        const titles = svg.querySelectorAll('title');
        expect(titles.length).toBe(0);
      });

      it('should default to removing titles when isEditMode not provided', () => {
        const svg = createSvgElement(`
          <title>Title</title>
          <g class="node"><title>Node</title></g>
        `);

        applySvgTheming(svg, mockTheme);

        const titles = svg.querySelectorAll('title');
        expect(titles.length).toBe(0);
      });
    });

    describe('complex scenarios', () => {
      it('should handle multiple elements of different types', () => {
        const svg = createSvgElement(`
          <ellipse stroke="black" fill="white"/>
          <g class="node"><polygon stroke="black" fill="white"/></g>
          <g class="edge"><path stroke="black"/><polygon fill="black"/></g>
          <g class="cluster"><polygon stroke="black"/></g>
          <text>Label</text>
        `);

        applySvgTheming(svg, mockTheme);

        expect(svg.querySelector('ellipse')?.getAttribute('stroke')).toBe(mockTheme.colors.text.primary);
        expect(svg.querySelector('g.node polygon')?.getAttribute('stroke')).toBe(mockTheme.colors.text.primary);
        expect(svg.querySelector('g.edge path')?.getAttribute('stroke')).toBe(mockTheme.colors.text.primary);
        expect(svg.querySelector('g.edge polygon')?.getAttribute('fill')).toBe(mockTheme.colors.text.primary);
        expect(svg.querySelector('g.cluster polygon')?.getAttribute('fill')).toBe('none');
        expect(svg.querySelector('text')?.getAttribute('fill')).toBe(mockTheme.colors.text.primary);
      });

      it('should preserve mix of custom and default colors', () => {
        const svg = createSvgElement(`
          <g class="node"><path stroke="red" fill="black"/></g>
          <g class="node"><path stroke="black" fill="blue"/></g>
        `);

        applySvgTheming(svg, mockTheme);

        const paths = svg.querySelectorAll('g.node path');
        expect(paths[0].getAttribute('stroke')).toBe('red');
        expect(paths[0].getAttribute('fill')).toBe(mockTheme.colors.background.secondary);
        expect(paths[1].getAttribute('stroke')).toBe(mockTheme.colors.text.primary);
        expect(paths[1].getAttribute('fill')).toBe('blue');
      });
    });
  });
});
