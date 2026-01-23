import { LocationNode } from "@domas/ui";

/**
 * Recursively finds the path to a specific node in the location tree.
 */
export function findLocationPath(
  nodes: LocationNode[],
  targetId: string | number,
): LocationNode[] | null {
  for (const node of nodes) {
    if (String(node.id) === String(targetId)) return [node];
    if (node.children) {
      const path = findLocationPath(node.children, targetId);
      if (path) return [node, ...path];
    }
  }
  return null;
}
