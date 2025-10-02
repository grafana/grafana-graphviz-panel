export enum RankDirection {
  TOP_TO_BOTTOM = 'TB',
  BOTTOM_TO_TOP = 'BT',
  LEFT_TO_RIGHT = 'LR',
  RIGHT_TO_LEFT = 'RL',
}

export interface EdgeStyleMapping {
  id: string;
  targetEdgeIds: string[];
  strokeColor: string;
  matchFieldName?: string;
  matchValue?: string;
  colorFieldName?: string;
}

export interface NodeStyleMapping {
  id: string;
  targetNodeIds: string[];
  strokeColor: string;
  matchFieldName?: string;
  matchValue?: string;
  colorFieldName?: string;
}

export interface SimpleOptions {
  dotDiagram: string;
  rankDirection: RankDirection;
  edgeStyleMappings: EdgeStyleMapping[];
  nodeStyleMappings: NodeStyleMapping[];
}
