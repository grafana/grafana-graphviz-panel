export type GraphModel = any;

export interface GraphNode {
  id: string;
  attributes: {
    get(key: string): any;
    set(key: string, value: any): void;
    delete(key: string): void;
  };
}

export interface GraphEdge {
  targets: any[];
  attributes: {
    get(key: string): any;
    set(key: string, value: any): void;
  };
}

export function getEdgeId(edge: any): string | null {
  const existingId = edge.attributes.get('id');
  if (existingId) {
    return existingId;
  }

  const targets: any[] = edge.targets;
  return targets.length >= 2 ? `${targets[0].id}__to__${targets[1].id}` : null;
}

export function findNodeById(model: GraphModel, nodeId: string): GraphNode | undefined {
  return Array.from(model.nodes).find((n: any) => n.id === nodeId) as GraphNode | undefined;
}

export function collectAllNodeIds(model: GraphModel): Set<string> {
  const allNodeIds = new Set<string>();

  for (const node of model.nodes) {
    allNodeIds.add(node.id);
  }

  for (const edge of model.edges) {
    for (const target of edge.targets) {
      allNodeIds.add(target.id);
    }
  }

  return allNodeIds;
}

export function hasAnyHtmlLabels(model: GraphModel, isHtmlLabelFn: (label: any) => boolean): boolean {
  for (const node of model.nodes) {
    if (isHtmlLabelFn(node.attributes.get('label'))) {
      return true;
    }
  }
  return false;
}
