import { fromDot } from 'ts-graphviz';

export function isEmptyDiagram(dotDiagram: string): boolean {
  if (!dotDiagram || dotDiagram.trim() === '') {
    return true;
  }

  try {
    const model = fromDot(dotDiagram);
    const nodes = Array.from(model.nodes);
    const edges = Array.from(model.edges);

    return nodes.length === 0 && edges.length === 0;
  } catch {
    return false;
  }
}

export function isHtmlLabel(label: any): boolean {
  if (!label) {
    return false;
  }
  const str = String(label).trim();
  return /^<[A-Z]/.test(str);
}

export function isRecordLabel(label: any): boolean {
  if (!label) {
    return false;
  }
  return String(label).includes('|');
}

export function extractGraphContent(dotString: string): string {
  return dotString.replace(/^\s*(di)?graph\s+("[^"]*"|\w*)\s*\{/, '').replace(/}\s*$/, '');
}

export function buildGraphAttributes(layoutEngine: string, rankDirection?: string, splineType?: string): string[] {
  const attributes: string[] = [];
  if (layoutEngine === 'dot' && rankDirection) {
    attributes.push(`rankdir=${rankDirection}`);
  }
  if (splineType) {
    attributes.push(`splines=${splineType}`);
  }
  return attributes;
}
