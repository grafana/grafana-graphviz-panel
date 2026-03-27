import { applySvgTheming } from './grafanaTheme';
import { createTheme, GrafanaTheme2 } from '@grafana/data';

describe('theming', () => {
  const darkTheme: GrafanaTheme2 = createTheme({ colors: { mode: 'dark' } });

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
    it('should apply styling without errors', () => {
      const svg = createSvgElement('');

      expect(() => applySvgTheming(svg, darkTheme)).not.toThrow();
    });

    describe('default color replacement', () => {
      it('should replace default strokes with theme color', () => {
        const svg = createSvgElement(`
          <ellipse stroke="black"/>
          <g class="node"><polygon stroke="black"/></g>
          <g class="edge"><path stroke="black"/></g>
        `);

        applySvgTheming(svg, darkTheme);

        expect(svg.querySelector('ellipse')?.getAttribute('stroke')).toBe(darkTheme.colors.text.secondary);
        expect(svg.querySelector('g.node polygon')?.getAttribute('stroke')).toBe(darkTheme.colors.text.secondary);
        expect(svg.querySelector('g.edge path')?.getAttribute('stroke')).toBe(darkTheme.colors.text.secondary);
      });

      it('should replace default fills with theme color', () => {
        const svg = createSvgElement(`
          <ellipse fill="white"/>
          <g class="node"><polygon fill="black"/></g>
        `);

        applySvgTheming(svg, darkTheme);

        expect(svg.querySelector('ellipse')?.getAttribute('fill')).toBe(darkTheme.colors.background.secondary);
        expect(svg.querySelector('g.node polygon')?.getAttribute('fill')).toBe(darkTheme.colors.background.secondary);
      });

      it('should apply theme font to text elements', () => {
        const svg = createSvgElement('<text>Label</text>');

        applySvgTheming(svg, darkTheme);

        const text = svg.querySelector('text');
        expect(text?.getAttribute('fill')).toBe(darkTheme.colors.text.primary);
        expect(text?.getAttribute('font-family')).toBe(darkTheme.typography.fontFamily);
      });
    });

    describe('custom color preservation', () => {
      it('should preserve custom strokes', () => {
        const svg = createSvgElement(`
          <ellipse stroke="#FF0000"/>
          <g class="node"><polygon stroke="blue"/></g>
          <g class="edge"><path stroke="rgb(0,255,0)"/></g>
        `);

        applySvgTheming(svg, darkTheme);

        expect(svg.querySelector('ellipse')?.getAttribute('stroke')).toBe('#FF0000');
        expect(svg.querySelector('g.node polygon')?.getAttribute('stroke')).toBe('blue');
        expect(svg.querySelector('g.edge path')?.getAttribute('stroke')).toBe('rgb(0,255,0)');
      });

      it('should preserve custom fills', () => {
        const svg = createSvgElement(`
          <ellipse fill="red"/>
          <g class="node"><polygon fill="#00FF00"/></g>
        `);

        applySvgTheming(svg, darkTheme);

        expect(svg.querySelector('ellipse')?.getAttribute('fill')).toBe('red');
        expect(svg.querySelector('g.node polygon')?.getAttribute('fill')).toBe('#00FF00');
      });
    });

    describe('special cases', () => {
      it('should remove white fill from polygons', () => {
        const svg = createSvgElement('<polygon fill="white"/>');

        applySvgTheming(svg, darkTheme);

        expect(svg.querySelector('polygon')?.getAttribute('fill')).toBe('none');
      });

      it('should preserve fill="none"', () => {
        const svg = createSvgElement('<g class="node"><polygon fill="none"/></g>');

        applySvgTheming(svg, darkTheme);

        expect(svg.querySelector('polygon')?.getAttribute('fill')).toBe('none');
      });

      it('should set edge paths to fill="none"', () => {
        const svg = createSvgElement('<g class="edge"><path fill="red"/></g>');

        applySvgTheming(svg, darkTheme);

        expect(svg.querySelector('g.edge path')?.getAttribute('fill')).toBe('none');
      });

      it('should apply theme color to edge arrowheads', () => {
        const svg = createSvgElement('<g class="edge"><polygon fill="black"/></g>');

        applySvgTheming(svg, darkTheme);

        const polygon = svg.querySelector('g.edge polygon');
        expect(polygon?.getAttribute('fill')).toBe(darkTheme.colors.text.secondary);
        expect(polygon?.getAttribute('stroke')).toBe(darkTheme.colors.text.secondary);
      });

      it('should style cluster borders', () => {
        const svg = createSvgElement(`
          <g class="cluster"><polygon stroke="black"/></g>
          <g class="cluster"><rect stroke="black"/></g>
        `);

        applySvgTheming(svg, darkTheme);

        const polygon = svg.querySelector('g.cluster polygon');
        expect(polygon?.getAttribute('stroke')).toBe(darkTheme.colors.text.secondary);
        expect(polygon?.getAttribute('fill')).toBe('none');
        expect(polygon?.getAttribute('stroke-dasharray')).toBe('3,3');

        const rect = svg.querySelector('g.cluster rect');
        expect(rect?.getAttribute('stroke')).toBe(darkTheme.colors.text.secondary);
        expect(rect?.getAttribute('fill')).toBe('none');
        expect(rect?.getAttribute('stroke-dasharray')).toBe('3,3');
      });
    });

    describe('edit mode', () => {
      it('should add tooltips to nodes in edit mode', () => {
        const svg = createSvgElement('<g class="node"><title>NodeA</title></g>');

        applySvgTheming(svg, darkTheme, true);

        const title = svg.querySelector('g.node title');
        expect(title?.textContent).toBe('Node ID: NodeA');
      });

      it('should add tooltips to edges in edit mode', () => {
        const svg = createSvgElement('<g class="edge"><title>A->B</title></g>');

        applySvgTheming(svg, darkTheme, true);

        const title = svg.querySelector('g.edge title');
        expect(title?.textContent).toBe('Edge ID: A__to__B');
      });

      it('should remove all other titles in edit mode', () => {
        const svg = createSvgElement(`
          <g class="graph"><title>G</title></g>
          <g class="node"><title>A</title></g>
        `);

        applySvgTheming(svg, darkTheme, true);

        const titles = svg.querySelectorAll('title');
        expect(titles.length).toBe(1);
        expect(titles[0].textContent).toBe('Node ID: A');
      });

      it('should remove all titles when not in edit mode', () => {
        const svg = createSvgElement(`
          <g class="node"><title>A</title></g>
          <g class="edge"><title>A->B</title></g>
          <title>Graph</title>
        `);

        applySvgTheming(svg, darkTheme, false);

        expect(svg.querySelectorAll('title').length).toBe(0);
      });
    });
  });
});
