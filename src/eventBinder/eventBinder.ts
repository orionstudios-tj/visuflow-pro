import type { EventBinding, LogicGraph } from '@/types/logic.types';
import { runWorkflow } from '@/engine/executionEngine';
import type { NodeExecutionContext } from '@/engine/nodeRegistry';

export function findBindingsForNode(
  uiNodeId: string,
  event: string,
  bindings: EventBinding[]
): EventBinding[] {
  return bindings.filter((b) => b.uiNodeId === uiNodeId && b.event === event);
}

export async function triggerEvent(
  uiNodeId: string,
  event: string,
  bindings: EventBinding[],
  graphs: LogicGraph[],
  context: NodeExecutionContext
) {
  const matched = findBindingsForNode(uiNodeId, event, bindings);
  const results = await Promise.all(
    matched.map((binding) => {
      const graph = graphs.find((g) => g.id === binding.workflowId);
      if (!graph) {
        console.warn(`Workflow ${binding.workflowId} not found for binding ${binding.id}`);
        return null;
      }
      return runWorkflow(graph, context);
    })
  );
  return results.filter(Boolean);
}
