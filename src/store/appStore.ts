import { create } from 'zustand';
import type { UINode, UITree } from '@/types/ui.types';
import type { LogicGraph, EventBinding, ExecutionResult } from '@/types/logic.types';

const defaultRoot: UINode = {
  id: 'root',
  type: 'Page',
  props: { label: 'Root Page' },
  style: { padding: '24px', minHeight: '100%' },
  children: [],
  parentId: null,
};

interface AppState {
  // UI Tree
  uiTree: UITree;
  selectedUINodeId: string | null;
  setUITree: (tree: UITree) => void;
  selectUINode: (id: string | null) => void;
  addUINode: (parentId: string, node: UINode) => void;
  removeUINode: (nodeId: string) => void;
  updateUINode: (nodeId: string, updates: Partial<Pick<UINode, 'props' | 'style'>>) => void;

  // Logic Graphs
  logicGraphs: LogicGraph[];
  activeGraphId: string | null;
  setActiveGraph: (id: string | null) => void;
  addLogicGraph: (graph: LogicGraph) => void;
  updateLogicGraph: (id: string, graph: Partial<LogicGraph>) => void;
  removeLogicGraph: (id: string) => void;

  // Event Bindings
  eventBindings: EventBinding[];
  addEventBinding: (binding: EventBinding) => void;
  removeEventBinding: (id: string) => void;

  // App runtime state
  appState: Record<string, unknown>;
  setAppState: (key: string, value: unknown) => void;
  resetAppState: () => void;

  // Execution
  lastExecution: ExecutionResult | null;
  setLastExecution: (result: ExecutionResult) => void;

  // Active tab
  activeTab: 'ui' | 'logic' | 'preview';
  setActiveTab: (tab: 'ui' | 'logic' | 'preview') => void;
}

function findAndUpdate(node: UINode, id: string, updater: (n: UINode) => UINode): UINode {
  if (node.id === id) return updater(node);
  return { ...node, children: node.children.map(c => findAndUpdate(c, id, updater)) };
}

function findAndRemove(node: UINode, id: string): UINode {
  return {
    ...node,
    children: node.children
      .filter(c => c.id !== id)
      .map(c => findAndRemove(c, id)),
  };
}

function addChild(node: UINode, parentId: string, child: UINode): UINode {
  if (node.id === parentId) {
    return { ...node, children: [...node.children, child] };
  }
  return { ...node, children: node.children.map(c => addChild(c, parentId, child)) };
}

export const useAppStore = create<AppState>((set, get) => ({
  uiTree: { root: defaultRoot },
  selectedUINodeId: null,
  setUITree: (tree) => set({ uiTree: tree }),
  selectUINode: (id) => set({ selectedUINodeId: id }),
  addUINode: (parentId, node) =>
    set((s) => ({ uiTree: { root: addChild(s.uiTree.root, parentId, node) } })),
  removeUINode: (nodeId) =>
    set((s) => ({ uiTree: { root: findAndRemove(s.uiTree.root, nodeId) }, selectedUINodeId: s.selectedUINodeId === nodeId ? null : s.selectedUINodeId })),
  updateUINode: (nodeId, updates) =>
    set((s) => ({
      uiTree: {
        root: findAndUpdate(s.uiTree.root, nodeId, (n) => ({
          ...n,
          props: updates.props ? { ...n.props, ...updates.props } : n.props,
          style: updates.style ? { ...n.style, ...updates.style } : n.style,
        })),
      },
    })),

  logicGraphs: [],
  activeGraphId: null,
  setActiveGraph: (id) => set({ activeGraphId: id }),
  addLogicGraph: (graph) => set((s) => ({ logicGraphs: [...s.logicGraphs, graph] })),
  updateLogicGraph: (id, updates) =>
    set((s) => ({
      logicGraphs: s.logicGraphs.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    })),
  removeLogicGraph: (id) =>
    set((s) => ({
      logicGraphs: s.logicGraphs.filter((g) => g.id !== id),
      activeGraphId: s.activeGraphId === id ? null : s.activeGraphId,
    })),

  eventBindings: [],
  addEventBinding: (binding) => set((s) => ({ eventBindings: [...s.eventBindings, binding] })),
  removeEventBinding: (id) =>
    set((s) => ({ eventBindings: s.eventBindings.filter((b) => b.id !== id) })),

  appState: {},
  setAppState: (key, value) => set((s) => ({ appState: { ...s.appState, [key]: value } })),
  resetAppState: () => set({ appState: {} }),

  lastExecution: null,
  setLastExecution: (result) => set({ lastExecution: result }),

  activeTab: 'ui',
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
