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
  nodeTooltipTemplate?: string;
  edgeTooltipTemplate?: string;
  builderModeActions?: BuilderModeActions;
}
