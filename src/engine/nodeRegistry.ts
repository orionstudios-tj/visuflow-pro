import type { LogicNode, LogicNodeConfig } from '@/types/logic.types';

export interface NodeExecutionContext {
  appState: Record<string, unknown>;
  setAppState: (key: string, value: unknown) => void;
  navigate?: (path: string) => void;
  eventValue?: unknown;
}

const resolveTemplate = (str: string, context: NodeExecutionContext): any => {
  if (typeof str !== 'string') return str;
  
  // Handle {{event.value}}
  if (str === '{{event.value}}') return context.eventValue;
  
  // Handle {{state.key}}
  return str.replace(/\{\{state\.(.*?)\}\}/g, (_, path) => {
    return (context.appState[path] as string) || '';
  });
};

export type NodeExecutor = (
  config: LogicNodeConfig,
  context: NodeExecutionContext
) => Promise<unknown>;

const executors: Record<string, NodeExecutor> = {
  Trigger: async (config) => {
    // Trigger nodes are entry points — they just pass through
    return { triggered: true, eventType: config.eventType };
  },

  API: async (config) => {
    const { url, method = 'GET', body, headers = {} } = config;
    if (!url) throw new Error('API node: url is required');
    const res = await fetch(url as string, {
      method: method as string,
      headers: headers as Record<string, string>,
      body: method !== 'GET' && body ? (body as string) : undefined,
    });
    if (!res.ok) throw new Error(`API ${method} ${url} failed: ${res.status}`);
    const contentType = res.headers.get('content-type');
    if (contentType?.includes('application/json')) return res.json();
    return res.text();
  },

  Condition: async (config, context) => {
    const { expression } = config;
    if (!expression) throw new Error('Condition node: expression is required');
    // Simple expression evaluation using appState
    const fn = new Function('state', `return !!(${expression})`);
    const result = fn(context.appState);
    return { result: Boolean(result) };
  },

  Delay: async (config) => {
    const ms = (config.ms as number) ?? 1000;
    await new Promise((resolve) => setTimeout(resolve, ms));
    return { delayed: ms };
  },

  SetState: async (config, context) => {
    const { key, value } = config;
    if (!key) throw new Error('SetState node: key is required');
    
    let resolvedValue = resolveTemplate(value as string, context);
    let parsedValue: unknown = resolvedValue;
    
    if (typeof resolvedValue === 'string') {
      try {
        parsedValue = JSON.parse(resolvedValue);
      } catch {
        // keep as string
      }
    }
    
    context.setAppState(key as string, parsedValue);
    return { key, value: parsedValue };
  },

  Navigate: async (config, context) => {
    const { path } = config;
    if (!path) throw new Error('Navigate node: path is required');
    context.navigate?.(path as string);
    return { navigated: path };
  },
};

export function getNodeExecutor(type: string): NodeExecutor {
  const executor = executors[type];
  if (!executor) throw new Error(`No executor registered for node type: ${type}`);
  return executor;
}

export function registerNodeExecutor(type: string, executor: NodeExecutor): void {
  executors[type] = executor;
}
