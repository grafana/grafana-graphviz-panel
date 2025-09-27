export enum RankDirection {
  TOP_TO_BOTTOM = 'TB',
  BOTTOM_TO_TOP = 'BT',
  LEFT_TO_RIGHT = 'LR',
  RIGHT_TO_LEFT = 'RL',
}

export interface SimpleOptions {
  dotDiagram: string;
  rankDirection: RankDirection;
}
