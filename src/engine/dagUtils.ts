import type { LogicNode, LogicEdge } from '@/types/logic.types';

/** Topological sort using Kahn's algorithm. Returns sorted node IDs or throws if cycle detected. */
export function topologicalSort(nodes: LogicNode[], edges: LogicEdge[]): string[] {
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adj.set(node.id, []);
  }

  for (const edge of edges) {
    adj.get(edge.source)?.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(current);
    for (const neighbor of adj.get(current) ?? []) {
      const newDeg = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }

  if (sorted.length !== nodes.length) {
    throw new Error('Cycle detected in logic graph — not a valid DAG');
  }

  return sorted;
}

/** Validate that the graph is a DAG */
export function validateDAG(nodes: LogicNode[], edges: LogicEdge[]): { valid: boolean; error?: string } {
  try {
    topologicalSort(nodes, edges);
    return { valid: true };
  } catch (e) {
    return { valid: false, error: (e as Error).message };
  }
}

/** Get direct children of a node */
export function getChildren(nodeId: string, edges: LogicEdge[]): string[] {
  return edges.filter((e) => e.source === nodeId).map((e) => e.target);
}

/** Get nodes with no incoming edges (entry points) */
export function getEntryNodes(nodes: LogicNode[], edges: LogicEdge[]): string[] {
  const targets = new Set(edges.map((e) => e.target));
  return nodes.filter((n) => !targets.has(n.id)).map((n) => n.id);
}

/** Get edges leaving a specific node, optionally filtered by label */
export function getOutEdges(nodeId: string, edges: LogicEdge[], label?: string): LogicEdge[] {
  return edges.filter((e) => e.source === nodeId && (label === undefined || e.label === label));
}
