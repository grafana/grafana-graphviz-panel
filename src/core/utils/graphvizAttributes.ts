export function getEffectiveNodeAttribute(node: any, model: any, attrName: string): string | null {
  const nodeValue = node.attributes.get(attrName);
  if (nodeValue != null) {
    return nodeValue;
  }

  const graphValue = model.attributes.node.get(attrName);
  if (graphValue != null) {
    return graphValue;
  }

  return null;
}

export function getEffectiveEdgeAttribute(edge: any, model: any, attrName: string): string | null {
  const edgeValue = edge.attributes.get(attrName);
  if (edgeValue != null) {
    return edgeValue;
  }

  const graphValue = model.attributes.edge.get(attrName);
  if (graphValue != null) {
    return graphValue;
  }

  return null;
}
