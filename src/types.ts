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

export enum DiagramSourceType {
  CODE = 'code',
  URL = 'url',
}

export enum RuleKind {
  STROKE_COLOR = 'strokeColor',
  FILL_COLOR = 'fillColor',
  STROKE_WIDTH = 'strokeWidth',
}

export enum DataFormatStrategy {
  WIDE = 'wide',
  TIMESERIES = 'timeseries',
  MIXED = 'mixed',
}

export interface ThresholdStep {
  color: string;
  value: number;
}

export interface NamedThreshold {
  id: string;
  name: string;
  steps: ThresholdStep[];
}

export interface StrokeColorRule {
  kind: RuleKind.STROKE_COLOR;
  matchFieldName?: string;
  matchValue?: string;
  matchPattern?: string;
  colorFieldName?: string;
  thresholdId?: string;
  staticColor?: string;
}

export interface FillColorRule {
  kind: RuleKind.FILL_COLOR;
  matchFieldName?: string;
  matchValue?: string;
  matchPattern?: string;
  colorFieldName?: string;
  thresholdId?: string;
  staticColor?: string;
}

export interface StrokeWidthRule {
  kind: RuleKind.STROKE_WIDTH;
  matchFieldName?: string;
  matchValue?: string;
  matchPattern?: string;
  widthFieldName?: string;
  staticWidth?: number;
}

export type Rule = StrokeColorRule | FillColorRule | StrokeWidthRule;

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
  diagramSourceType: DiagramSourceType;
  dotDiagram: string;
  dotDiagramUrl: string;
  layoutEngine: LayoutEngine;
  rankDirection: RankDirection;
  namedThresholds: NamedThreshold[];
  edgeMappings: EdgeMapping[];
  nodeMappings: NodeMapping[];
  enableNodeTooltips: boolean;
}
