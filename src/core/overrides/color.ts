export function addStyleToCommaList(existingStyle: string | null, newStyle: string): string {
  const current = existingStyle || '';
  return current.includes(newStyle) ? current : `${current ? current + ',' : ''}${newStyle}`;
}

export function applyNodeBorderColor(node: any, color: string): void {
  node.attributes.set('color', color);
}

export function applyNodeFillColor(node: any, color: string): void {
  const existingStyle = node.attributes.get('style');
  const newStyle = addStyleToCommaList(existingStyle, 'filled');

  node.attributes.set('fillcolor', color);
  node.attributes.set('style', newStyle as any);
}

export function applyEdgeColor(edge: any, color: string): void {
  edge.attributes.set('color', color);
}
