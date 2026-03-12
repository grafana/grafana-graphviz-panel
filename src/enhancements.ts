import { fromDot, toDot } from 'ts-graphviz';

/**
 * Derives and assigns IDs to edges that don't have them.
 * Generates IDs based on the source and target node names in the format: "source__to__target"
 * Preserves existing edge IDs.
 *
 * @param dotString - The DOT notation string to process
 * @returns DOT string with edge IDs added to edges that didn't have them
 */
export function deriveEdgeIds(dotString: string): string {
  const model = fromDot(dotString);

  for (const edge of model.edges) {
    if (!edge.attributes.get('id')) {
      const targets: any[] = edge.targets;
      if (targets.length >= 2) {
        const derivedId = `${targets[0].id}__to__${targets[1].id}`;
        edge.attributes.set('id', derivedId);
      }
    }
  }

  return toDot(model);
}
