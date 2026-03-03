import type { LogicGraph, ExecutionLogEntry, ExecutionResult } from '@/types/logic.types';
import { getEntryNodes, getOutEdges } from './dagUtils';
import { getNodeExecutor, type NodeExecutionContext } from './nodeRegistry';

async function executeNodeWithRetry(
  nodeId: string,
  graph: LogicGraph,
  context: NodeExecutionContext,
  log: ExecutionLogEntry[],
  visited: Set<string>
): Promise<void> {
  if (visited.has(nodeId)) return;
  visited.add(nodeId);

  const node = graph.nodes.find((n) => n.id === nodeId);
  if (!node) return;

  const entry: ExecutionLogEntry = {
    nodeId,
    nodeType: node.type,
    status: 'started',
    timestamp: Date.now(),
  };
  log.push(entry);

  const retries = (node.config.retries as number) ?? 0;
  const retryDelay = (node.config.retryDelay as number) ?? 500;
  let attempt = 0;
  let result: unknown;

  while (attempt <= retries) {
    try {
      const executor = getNodeExecutor(node.type);
      result = await executor(node.config, context);
      entry.status = 'completed';
      entry.result = result;
      entry.duration = Date.now() - entry.timestamp;
      break;
    } catch (err) {
      attempt++;
      if (attempt > retries) {
        entry.status = 'error';
        entry.error = (err as Error).message;
        entry.duration = Date.now() - entry.timestamp;
        return; // stop execution on error
      }
      await new Promise((r) => setTimeout(r, retryDelay));
    }
  }

  // Determine next nodes
  if (node.type === 'Condition') {
    const condResult = (result as { result: boolean })?.result;
    const label = condResult ? 'true' : 'false';
    const nextEdges = getOutEdges(nodeId, graph.edges, label);
    // Also get edges without labels (fallback)
    const unlabeled = getOutEdges(nodeId, graph.edges).filter((e) => !e.label);
    const allNext = [...nextEdges, ...(condResult ? [] : unlabeled)];

    // Execute branches (parallel for same-label branches)
    await Promise.all(
      allNext.map((edge) => executeNodeWithRetry(edge.target, graph, context, log, visited))
    );
  } else {
    const nextEdges = getOutEdges(nodeId, graph.edges);
    // Parallel execution for all outgoing edges
    await Promise.all(
      nextEdges.map((edge) => executeNodeWithRetry(edge.target, graph, context, log, visited))
    );
  }
}

export async function runWorkflow(
  graph: LogicGraph,
  context: NodeExecutionContext
): Promise<ExecutionResult> {
  const log: ExecutionLogEntry[] = [];
  const visited = new Set<string>();
  const entryNodes = getEntryNodes(graph.nodes, graph.edges);

  // Execute all entry points in parallel
  await Promise.all(
    entryNodes.map((id) => executeNodeWithRetry(id, graph, context, log, visited))
  );

  return {
    workflowId: graph.id,
    success: log.every((e) => e.status !== 'error'),
    log,
    finalState: { ...context.appState },
  };
}
