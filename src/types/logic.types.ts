export type LogicNodeType = 'Trigger' | 'API' | 'Condition' | 'Delay' | 'SetState' | 'Navigate';

export interface LogicNodeConfig {
  // Trigger
  eventType?: string;

  // API
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: string;
  headers?: Record<string, string>;

  // Condition
  expression?: string;

  // Delay
  ms?: number;

  // SetState
  key?: string;
  value?: string;

  // Navigate
  path?: string;

  // Retry
  retries?: number;
  retryDelay?: number;

  [key: string]: unknown;
}

export interface LogicNode {
  id: string;
  type: LogicNodeType;
  label: string;
  config: LogicNodeConfig;
  position: { x: number; y: number };
}

export interface LogicEdge {
  id: string;
  source: string;
  target: string;
  label?: string;        // e.g. 'true' | 'false' for condition branches
  sourceHandle?: string;
}

export interface LogicGraph {
  id: string;
  name: string;
  nodes: LogicNode[];
  edges: LogicEdge[];
}

export interface EventBinding {
  id: string;
  uiNodeId: string;
  event: string;
  workflowId: string;
}

export interface ExecutionLogEntry {
  nodeId: string;
  nodeType: LogicNodeType;
  status: 'started' | 'completed' | 'error' | 'skipped';
  timestamp: number;
  duration?: number;
  result?: unknown;
  error?: string;
}

export interface ExecutionResult {
  workflowId: string;
  success: boolean;
  log: ExecutionLogEntry[];
  finalState: Record<string, unknown>;
}
