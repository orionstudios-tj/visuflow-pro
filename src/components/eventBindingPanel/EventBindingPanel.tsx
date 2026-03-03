import React, { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import type { EventBinding } from '@/types/logic.types';
import type { UINode } from '@/types/ui.types';
import { Link, Trash2, Plus } from 'lucide-react';

function flattenTree(node: UINode): UINode[] {
  return [node, ...node.children.flatMap(flattenTree)];
}

const EventBindingPanel: React.FC = () => {
  const { eventBindings, addEventBinding, removeEventBinding, uiTree, logicGraphs } = useAppStore();
  const [uiNodeId, setUiNodeId] = useState('');
  const [event, setEvent] = useState('onClick');
  const [workflowId, setWorkflowId] = useState('');

  const allUINodes = flattenTree(uiTree.root);

  const handleAdd = () => {
    if (!uiNodeId || !workflowId) return;
    const binding: EventBinding = {
      id: `bind_${Date.now()}`,
      uiNodeId,
      event,
      workflowId,
    };
    addEventBinding(binding);
    setUiNodeId('');
    setWorkflowId('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="panel-header">
        <span className="flex items-center gap-1.5"><Link size={12} /> Event Bindings</span>
      </div>

      {/* Add binding form */}
      <div className="p-3 space-y-2 border-b border-border">
        <select
          className="w-full px-2 py-1 rounded text-xs bg-secondary border border-border text-foreground outline-none"
          value={uiNodeId}
          onChange={(e) => setUiNodeId(e.target.value)}
        >
          <option value="">Select UI Node...</option>
          {allUINodes.map((n) => (
            <option key={n.id} value={n.id}>
              {n.type}: {n.props.label || n.id}
            </option>
          ))}
        </select>
        <select
          className="w-full px-2 py-1 rounded text-xs bg-secondary border border-border text-foreground outline-none"
          value={event}
          onChange={(e) => setEvent(e.target.value)}
        >
          <option value="onClick">onClick</option>
          <option value="onChange">onChange</option>
          <option value="onFocus">onFocus</option>
          <option value="onBlur">onBlur</option>
        </select>
        <select
          className="w-full px-2 py-1 rounded text-xs bg-secondary border border-border text-foreground outline-none"
          value={workflowId}
          onChange={(e) => setWorkflowId(e.target.value)}
        >
          <option value="">Select Workflow...</option>
          {logicGraphs.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        <button
          onClick={handleAdd}
          disabled={!uiNodeId || !workflowId}
          className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-xs bg-primary text-primary-foreground border-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
        >
          <Plus size={12} /> Bind Event
        </button>
      </div>

      {/* Bindings list */}
      <div className="flex-1 overflow-auto p-2 space-y-1.5">
        {eventBindings.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">No bindings yet</p>
        )}
        {eventBindings.map((b) => {
          const uiNode = allUINodes.find((n) => n.id === b.uiNodeId);
          const graph = logicGraphs.find((g) => g.id === b.workflowId);
          return (
            <div key={b.id} className="flex items-center gap-2 p-2 rounded bg-secondary text-xs">
              <div className="flex-1 min-w-0">
                <div className="truncate text-foreground">
                  {uiNode?.type}:{uiNode?.props.label || b.uiNodeId}
                </div>
                <div className="text-muted-foreground">
                  {b.event} → {graph?.name || b.workflowId}
                </div>
              </div>
              <button
                onClick={() => removeEventBinding(b.id)}
                className="p-1 rounded hover:bg-destructive/20 text-destructive bg-transparent border-none cursor-pointer"
              >
                <Trash2 size={12} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EventBindingPanel;
