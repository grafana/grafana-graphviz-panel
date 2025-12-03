import { GrafanaTheme2 } from '@grafana/data';

export function getOrCreateSvgDefinitions(svgElement: SVGSVGElement): Element {
  return (
    svgElement.querySelector('defs') ||
    svgElement.insertBefore(document.createElementNS('http://www.w3.org/2000/svg', 'defs'), svgElement.firstChild)
  );
}

export function applyBlurGlowFilter(svgDefinitions: Element, svgElement: SVGSVGElement): void {
  const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
  filter.setAttribute('id', 'blur-glow');
  filter.setAttribute('x', '-50%');
  filter.setAttribute('y', '-50%');
  filter.setAttribute('width', '200%');
  filter.setAttribute('height', '200%');

  const blur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
  blur.setAttribute('in', 'SourceGraphic');
  blur.setAttribute('stdDeviation', '3');
  blur.setAttribute('result', 'blur');

  const luminance = document.createElementNS('http://www.w3.org/2000/svg', 'feColorMatrix');
  luminance.setAttribute('in', 'blur');
  luminance.setAttribute('type', 'luminanceToAlpha');
  luminance.setAttribute('result', 'luminanceAlpha');

  const componentTransfer = document.createElementNS('http://www.w3.org/2000/svg', 'feComponentTransfer');
  componentTransfer.setAttribute('in', 'luminanceAlpha');
  componentTransfer.setAttribute('result', 'glowAlpha');

  const funcA = document.createElementNS('http://www.w3.org/2000/svg', 'feFuncA');
  funcA.setAttribute('type', 'linear');
  funcA.setAttribute('slope', '2');
  funcA.setAttribute('intercept', '0');

  componentTransfer.appendChild(funcA);

  const composite = document.createElementNS('http://www.w3.org/2000/svg', 'feComposite');
  composite.setAttribute('in', 'blur');
  composite.setAttribute('in2', 'glowAlpha');
  composite.setAttribute('operator', 'in');
  composite.setAttribute('result', 'glow');

  const merge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');

  const mergeNode1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
  mergeNode1.setAttribute('in', 'glow');

  const mergeNode2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
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
    graph.setAttribute('filter', 'url(#blur-glow)');
  }
}

export function applyNodeGradient(svgDefinitions: Element, svgElement: SVGSVGElement, theme: GrafanaTheme2): void {
  const radialGradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
  radialGradient.setAttribute('id', 'node-gradient');
  radialGradient.setAttribute('cx', '40%');
  radialGradient.setAttribute('cy', '75%');
  radialGradient.setAttribute('r', '168.75%');

  const gradientColor = theme.isDark ? 'black' : 'white';

  const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop1.setAttribute('offset', '0%');
  stop1.setAttribute('stop-color', gradientColor);
  stop1.setAttribute('stop-opacity', '0.45');

  const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop2.setAttribute('offset', '100%');
  stop2.setAttribute('stop-color', gradientColor);
  stop2.setAttribute('stop-opacity', '0');

  radialGradient.appendChild(stop1);
  radialGradient.appendChild(stop2);
  svgDefinitions.appendChild(radialGradient);

  const nodeGroups = svgElement.querySelectorAll('.node');
  nodeGroups.forEach((nodeGroup) => {
    const shape = nodeGroup.querySelector('ellipse, polygon, path');
    if (shape) {
      const fillColor = shape.getAttribute('fill');
      if (fillColor && fillColor !== 'none') {
        const overlay = shape.cloneNode(true) as SVGElement;
        overlay.setAttribute('fill', 'url(#node-gradient)');
        overlay.setAttribute('stroke', 'none');

        shape.parentNode?.insertBefore(overlay, shape.nextSibling);
      }
    }
  });
}
