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

export enum InputMode {
  CODE = 'code',
  BUILDER = 'builder',
  URL = 'url',
}

export enum RuleKind {
  STROKE_COLOR = 'strokeColor',
  FILL_COLOR = 'fillColor',
  STROKE_WIDTH = 'strokeWidth',
  LABEL = 'label',
}

export enum DataFormatStrategy {
  WIDE = 'wide',
  TIMESERIES = 'timeseries',
  MIXED = 'mixed',
}

export enum MatchMode {
  AUTODETECT = 'autodetect',
  MANUAL = 'manual',
}

export enum MappingStrategy {
  ROW = 'row',
  FIELD = 'field',
}

export interface FieldMapping {
  nodeId: string;
  fieldName: string;
  dataFrameIndex?: number;
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
  colorFieldName?: string;
  thresholdId?: string;
  staticColor?: string;
}

export interface FillColorRule {
  kind: RuleKind.FILL_COLOR;
  colorFieldName?: string;
  thresholdId?: string;
  staticColor?: string;
}

export interface StrokeWidthRule {
  kind: RuleKind.STROKE_WIDTH;
  widthFieldName?: string;
  staticWidth?: number;
}

export interface LabelRule {
  kind: RuleKind.LABEL;
  labelTemplate?: string;
}

export type Rule = StrokeColorRule | FillColorRule | StrokeWidthRule | LabelRule;

export interface EdgeOverride {
  id: string;
  targetEdgeIds: string[];
  matchMode?: MatchMode;
  matchFieldName?: string;
  matchValue?: string;
  matchPattern?: string;
  rules: Rule[];
}

export interface NodeOverride {
  id: string;
  targetNodeIds: string[];
  mappingStrategy?: MappingStrategy;
  matchMode?: MatchMode;
  matchFieldName?: string;
  matchValue?: string;
  matchPattern?: string;
  fieldMatchPattern?: string;
  fieldMappings?: FieldMapping[];
  rules: Rule[];
}

export interface BuilderModeActions {
  addNodeTrigger?: number;
  addEdgeTrigger?: number;
}

export interface SimpleOptions {
  inputMode?: InputMode;
  dotDiagram: string;
  dotDiagramUrl: string;
  layoutEngine: LayoutEngine;
  rankDirection: RankDirection;
  namedThresholds: NamedThreshold[];
  edgeOverrides: EdgeOverride[];
  nodeOverrides: NodeOverride[];
  builderModeActions?: BuilderModeActions;
}
