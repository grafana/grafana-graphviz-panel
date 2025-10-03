// NOTE: This is a subset including only the most useful layout engines from:
//       https://graphviz.org/docs/layouts/
export enum LayoutEngine {
  HIERARCHICAL = 'dot',
  NETWORK = 'neato',
  FORCE_DIRECTED = 'fdp',
  CIRCULAR = 'circo',
  RADIAL = 'twopi',
}

export enum RankDirection {
  TOP_TO_BOTTOM = 'TB',
  BOTTOM_TO_TOP = 'BT',
  LEFT_TO_RIGHT = 'LR',
  RIGHT_TO_LEFT = 'RL',
}

export enum RuleKind {
  STROKE_COLOR = 'strokeColor',
  STROKE_WIDTH = 'strokeWidth',
}

export interface StrokeColorRule {
  kind: RuleKind.STROKE_COLOR;
  matchFieldName?: string;
  matchValue?: string;
  colorFieldName?: string;
  staticColor?: string;
}

export interface StrokeWidthRule {
  kind: RuleKind.STROKE_WIDTH;
  matchFieldName?: string;
  matchValue?: string;
  widthFieldName?: string;
  staticWidth?: number;
}

export type Rule = StrokeColorRule | StrokeWidthRule;

export interface EdgeMapping {
  id: string;
  targetEdgeIds: string[];
  rules: Rule[];
}

export interface NodeMapping {
  id: string;
  targetNodeIds: string[];
  rules: Rule[];
}

export interface SimpleOptions {
  dotDiagram: string;
  layoutEngine: LayoutEngine;
  rankDirection: RankDirection;
  edgeMappings: EdgeMapping[];
  nodeMappings: NodeMapping[];
  enableNodeTooltips: boolean;
}
