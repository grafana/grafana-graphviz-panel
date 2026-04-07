// NOTE: This is a subset including only the most useful layout engines from:
//       https://graphviz.org/docs/layouts/
export enum LayoutEngine {
  HIERARCHICAL = 'dot',
  NETWORK = 'neato',
  FORCE_DIRECTED = 'fdp',
  CIRCULAR = 'circo',
}

export enum RankDirection {
  TOP_TO_BOTTOM = 'TB',
  BOTTOM_TO_TOP = 'BT',
  LEFT_TO_RIGHT = 'LR',
  RIGHT_TO_LEFT = 'RL',
}

export enum SplineType {
  ORTHOGONAL = 'ortho',
  POLYLINE = 'polyline',
  CURVED = 'true',
}

export enum InputMode {
  BUILDER = 'builder',
  CODE = 'code',
  QUERY = 'query',
}

export enum BuilderTool {
  EDIT = 'edit',
  DELETE = 'delete',
  EDGE = 'edge',
  NODE = 'node',
}

export enum RuleKind {
  STROKE_COLOR = 'strokeColor',
  FILL_COLOR = 'fillColor',
  STROKE_WIDTH = 'strokeWidth',
  LABEL = 'label',
  TOOLTIP = 'tooltip',
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

export interface TooltipRule {
  kind: RuleKind.TOOLTIP;
  header?: {
    showId?: boolean;
    showTimestamp?: boolean;
  };
  content?: {
    templates?: string[];
  };
  footer?: {
    links?: DataLink[];
  };
}

export type Rule = StrokeColorRule | FillColorRule | StrokeWidthRule | LabelRule | TooltipRule;

export interface DataLink {
  title: string;
  url: string;
  openInNewTab?: boolean;
}

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
  matchMode?: MatchMode;
  matchFieldName?: string;
  matchValue?: string;
  matchPattern?: string;
  rules: Rule[];
}

export interface BuilderModeActions {
  activeTool?: BuilderTool;
  addNodeTrigger?: number;
}

export interface DotQueryConfig {
  fieldName: string;
  maxSizeBytes?: number;
}

export interface PanelOptions {
  inputMode?: InputMode;
  dotDiagram: string;
  dotQueryConfig?: DotQueryConfig;
  layoutEngine: LayoutEngine;
  splineType?: SplineType;
  rankDirection: RankDirection;
  namedThresholds: NamedThreshold[];
  edgeOverrides: EdgeOverride[];
  nodeOverrides: NodeOverride[];
  builderModeActions?: BuilderModeActions;
}
