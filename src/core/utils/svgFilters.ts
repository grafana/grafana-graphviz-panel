import { GrafanaTheme2 } from '@grafana/data';

const BLUR_GLOW_FILTER_ID = 'blur-glow';
const NODE_GRADIENT_ID = 'node-gradient';
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

export function getOrCreateSvgDefinitions(svgElement: SVGSVGElement): Element {
  return (
    svgElement.querySelector('defs') ||
    svgElement.insertBefore(document.createElementNS(SVG_NAMESPACE, 'defs'), svgElement.firstChild)
  );
}

export function applyBlurGlowFilter(svgDefinitions: Element, svgElement: SVGSVGElement): void {
  const filter = document.createElementNS(SVG_NAMESPACE, 'filter');
  filter.setAttribute('id', BLUR_GLOW_FILTER_ID);
  filter.setAttribute('x', '-25%');
  filter.setAttribute('y', '-25%');
  filter.setAttribute('width', '200%');
  filter.setAttribute('height', '200%');

  const blur = document.createElementNS(SVG_NAMESPACE, 'feGaussianBlur');
  blur.setAttribute('in', 'SourceGraphic');
  blur.setAttribute('stdDeviation', '1');
  blur.setAttribute('result', 'blur');

  const luminance = document.createElementNS(SVG_NAMESPACE, 'feColorMatrix');
  luminance.setAttribute('in', 'blur');
  luminance.setAttribute('type', 'luminanceToAlpha');
  luminance.setAttribute('result', 'luminanceAlpha');

  const componentTransfer = document.createElementNS(SVG_NAMESPACE, 'feComponentTransfer');
  componentTransfer.setAttribute('in', 'luminanceAlpha');
  componentTransfer.setAttribute('result', 'glowAlpha');

  const funcA = document.createElementNS(SVG_NAMESPACE, 'feFuncA');
  funcA.setAttribute('type', 'linear');
  funcA.setAttribute('slope', '0.9');
  funcA.setAttribute('intercept', '0');

  componentTransfer.appendChild(funcA);

  const composite = document.createElementNS(SVG_NAMESPACE, 'feComposite');
  composite.setAttribute('in', 'blur');
  composite.setAttribute('in2', 'glowAlpha');
  composite.setAttribute('operator', 'in');
  composite.setAttribute('result', 'glow');

  const merge = document.createElementNS(SVG_NAMESPACE, 'feMerge');

  const mergeNode1 = document.createElementNS(SVG_NAMESPACE, 'feMergeNode');
  mergeNode1.setAttribute('in', 'glow');

  const mergeNode2 = document.createElementNS(SVG_NAMESPACE, 'feMergeNode');
  mergeNode2.setAttribute('in', 'SourceGraphic');

  merge.appendChild(mergeNode1);
  merge.appendChild(mergeNode2);

  filter.appendChild(blur);
  filter.appendChild(luminance);
  filter.appendChild(componentTransfer);
  filter.appendChild(composite);
  filter.appendChild(merge);

  svgDefinitions.appendChild(filter);

  const graph = svgElement.querySelector('g.graph');
  if (graph) {
    graph.setAttribute('filter', `url(#${BLUR_GLOW_FILTER_ID})`);
  }
}

export function applyNodeGradient(svgDefinitions: Element, svgElement: SVGSVGElement, theme: GrafanaTheme2): void {
  const radialGradient = document.createElementNS(SVG_NAMESPACE, 'radialGradient');
  radialGradient.setAttribute('id', NODE_GRADIENT_ID);
  radialGradient.setAttribute('cx', '10%');
  radialGradient.setAttribute('cy', '75%');
  radialGradient.setAttribute('r', '168.75%');

  const gradientColor = theme.isDark ? 'black' : 'white';

  const stop1 = document.createElementNS(SVG_NAMESPACE, 'stop');
  stop1.setAttribute('offset', '0%');
  stop1.setAttribute('stop-color', gradientColor);
  stop1.setAttribute('stop-opacity', '0.45');

  const stop2 = document.createElementNS(SVG_NAMESPACE, 'stop');
  stop2.setAttribute('offset', '100%');
  stop2.setAttribute('stop-color', gradientColor);
  stop2.setAttribute('stop-opacity', '0');

  radialGradient.appendChild(stop1);
  radialGradient.appendChild(stop2);
  svgDefinitions.appendChild(radialGradient);

  const nodeGroups = svgElement.querySelectorAll('.node');
  for (const nodeGroup of nodeGroups) {
    const shape = nodeGroup.querySelector('ellipse, polygon, path');
    if (shape) {
      const fillColor = shape.getAttribute('fill');
      if (fillColor && fillColor !== 'none') {
        const overlay = shape.cloneNode(true) as SVGElement;
        overlay.setAttribute('fill', `url(#${NODE_GRADIENT_ID})`);
        overlay.setAttribute('stroke', 'none');

        shape.parentNode?.insertBefore(overlay, shape.nextSibling);
      }
    }
  }
}
