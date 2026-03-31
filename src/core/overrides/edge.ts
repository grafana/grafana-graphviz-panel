import { fromDot, toDot } from 'ts-graphviz';
import { EdgeOverride, RuleKind } from '../../types';
import { DataDrivenWidths } from '../../integrations/grafanaData';
import { getEdgeId } from '../utils/graphvizAst';

export function calculateEdgeWidthAndArrowSize(width: number): { width: number; arrowSize: number } {
  const clampedWidth = Math.min(Math.max(width, 0.1), 5);
  const arrowSize = Math.min(clampedWidth / 1.0, 1.5);
  return { width: clampedWidth, arrowSize };
}

export function applyEdgeStyleOverrides(dotString: string, edgeOverrides: EdgeOverride[]): string {
  if (!edgeOverrides || edgeOverrides.length === 0) {
    return dotString;
  }

  const model = fromDot(dotString);

  for (const mapping of edgeOverrides) {
    const colorRules = mapping.rules.filter((r) => r.kind === RuleKind.STROKE_COLOR);

    colorRules.forEach((rule) => {
      if (rule.staticColor) {
        for (const edge of model.edges) {
          const targets: any[] = edge.targets;
          for (let i = 0; i < targets.length - 1; i++) {
            const edgeId = getEdgeId(edge);

            if (edgeId && mapping.targetEdgeIds.includes(edgeId)) {
              edge.attributes.set('color', rule.staticColor);
            }
          }
        }
      }
    });
  }

  return toDot(model);
}

export function applyDataDrivenWidths(dotString: string, dataDrivenWidths: DataDrivenWidths): string {
  const model = fromDot(dotString);

  for (const edge of model.edges) {
    const edgeId = getEdgeId(edge);

    if (edgeId) {
      const width = dataDrivenWidths.edgeWidths.get(edgeId);
      if (width !== undefined) {
        const { width: clampedWidth, arrowSize } = calculateEdgeWidthAndArrowSize(width);

        edge.attributes.set('penwidth', clampedWidth);
        edge.attributes.set('arrowsize', arrowSize);
      }
    }
  }

  return toDot(model);
}
