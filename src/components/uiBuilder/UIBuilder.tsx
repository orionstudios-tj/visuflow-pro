import React, { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import type { UINode, UIComponentType } from '@/types/ui.types';
import { isContainer } from '@/uiEngine/componentRegistry';
import { ChevronRight, ChevronDown, Plus, Trash2, Square, LayoutGrid, CreditCard, MousePointerClick, Type, TextCursorInput } from 'lucide-react';

const COMPONENT_PALETTE: { type: UIComponentType; icon: React.ReactNode; label: string }[] = [
  { type: 'Page', icon: <Square size={14} />, label: 'Page' },
  { type: 'Grid', icon: <LayoutGrid size={14} />, label: 'Grid' },
  { type: 'Card', icon: <CreditCard size={14} />, label: 'Card' },
  { type: 'Button', icon: <MousePointerClick size={14} />, label: 'Button' },
  { type: 'Input', icon: <TextCursorInput size={14} />, label: 'Input' },
  { type: 'Text', icon: <Type size={14} />, label: 'Text' },
];

let nodeCounter = 0;
function createNode(type: UIComponentType, parentId: string): UINode {
  nodeCounter++;
  const id = `${type.toLowerCase()}_${nodeCounter}_${Date.now()}`;
  const defaults: Record<UIComponentType, Partial<UINode>> = {
    Page: { props: { label: 'Page' }, style: { padding: '16px', minHeight: '200px' } },
    Grid: { props: { label: 'Grid', columns: 2, gap: 12 }, style: {} },
    Card: { props: { label: 'Card' }, style: { padding: '16px' } },
    Button: { props: { label: 'Button', text: 'Click me' }, style: {} },
    Input: { props: { label: 'Input', placeholder: 'Type here...' }, style: {} },
    Text: { props: { label: 'Text', text: 'Hello World' }, style: {} },
  };
  const d = defaults[type] || {};
  return { id, type, props: d.props || {}, style: d.style || {}, children: [], parentId };
}

/* ── Tree Node ── */
const TreeNode: React.FC<{ node: UINode; depth: number }> = ({ node, depth }) => {
  const [expanded, setExpanded] = useState(true);
  const { selectedUINodeId, selectUINode, addUINode, removeUINode } = useAppStore();
  const selected = selectedUINodeId === node.id;
  const hasChildren = node.children.length > 0;
  const container = isContainer(node.type);

  return (
    <div>
      <div
        className={`tree-node ${selected ? 'selected' : ''}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => selectUINode(node.id)}
      >
        {hasChildren ? (
          <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className="p-0 bg-transparent border-none text-muted-foreground">
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        ) : (
          <span style={{ width: 12 }} />
        )}
        <span className="text-xs text-muted-foreground">{node.type}</span>
        <span className="text-xs truncate flex-1">{node.props.label || node.id}</span>
        {container && (
          <button
            onClick={(e) => { e.stopPropagation(); }}
            className="p-0 bg-transparent border-none text-muted-foreground opacity-0 group-hover:opacity-100"
          >
          </button>
        )}
      </div>
      {expanded && hasChildren && node.children.map((child) => (
        <TreeNode key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  );
};

/* ── Props Editor ── */
function findNode(root: UINode, id: string): UINode | null {
  if (root.id === id) return root;
  for (const child of root.children) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

const PropsEditor: React.FC = () => {
  const { selectedUINodeId, uiTree, updateUINode, removeUINode } = useAppStore();
  if (!selectedUINodeId) return <div className="p-3 text-xs text-muted-foreground">Select a node to edit</div>;

  const node = findNode(uiTree.root, selectedUINodeId);
  if (!node) return null;

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">{node.type}</span>
        {node.id !== 'root' && (
          <button onClick={() => removeUINode(node.id)} className="p-1 rounded hover:bg-destructive/20 text-destructive bg-transparent border-none cursor-pointer">
            <Trash2 size={14} />
          </button>
        )}
      </div>
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Label</label>
        <input
          className="w-full px-2 py-1 rounded text-xs bg-secondary border border-border text-foreground outline-none focus:ring-1 focus:ring-ring"
          value={(node.props.label as string) || ''}
          onChange={(e) => updateUINode(node.id, { props: { label: e.target.value } })}
        />
      </div>
      {(node.type === 'Button' || node.type === 'Text') && (
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Text</label>
          <input
            className="w-full px-2 py-1 rounded text-xs bg-secondary border border-border text-foreground outline-none focus:ring-1 focus:ring-ring"
            value={(node.props.text as string) || ''}
            onChange={(e) => updateUINode(node.id, { props: { text: e.target.value } })}
          />
        </div>
      )}
      {node.type === 'Input' && (
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Placeholder</label>
          <input
            className="w-full px-2 py-1 rounded text-xs bg-secondary border border-border text-foreground outline-none focus:ring-1 focus:ring-ring"
            value={(node.props.placeholder as string) || ''}
            onChange={(e) => updateUINode(node.id, { props: { placeholder: e.target.value } })}
          />
        </div>
      )}
      {node.type === 'Grid' && (
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Columns</label>
          <input
            type="number" min={1} max={12}
            className="w-full px-2 py-1 rounded text-xs bg-secondary border border-border text-foreground outline-none focus:ring-1 focus:ring-ring"
            value={(node.props.columns as number) || 2}
            onChange={(e) => updateUINode(node.id, { props: { columns: parseInt(e.target.value) || 2 } })}
          />
        </div>
      )}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Padding</label>
        <input
          className="w-full px-2 py-1 rounded text-xs bg-secondary border border-border text-foreground outline-none focus:ring-1 focus:ring-ring"
          value={node.style.padding || ''}
          onChange={(e) => updateUINode(node.id, { style: { padding: e.target.value } })}
        />
      </div>
    </div>
  );
};

/* ── Main UI Builder ── */
const UIBuilder: React.FC = () => {
  const { uiTree, selectedUINodeId, addUINode } = useAppStore();

  const handleAddComponent = (type: UIComponentType) => {
    const parentId = selectedUINodeId || 'root';
    const node = createNode(type, parentId);
    addUINode(parentId, node);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Component Palette */}
      <div className="panel-header">Components</div>
      <div className="p-2 grid grid-cols-3 gap-1.5 border-b border-border">
        {COMPONENT_PALETTE.map((item) => (
          <button
            key={item.type}
            onClick={() => handleAddComponent(item.type)}
            className="drag-item flex-col gap-1 py-2 justify-center items-center text-center border-none"
          >
            {item.icon}
            <span className="text-[10px]">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Tree */}
      <div className="panel-header">Tree</div>
      <div className="flex-1 overflow-auto py-1">
        <TreeNode node={uiTree.root} depth={0} />
      </div>

      {/* Props */}
      <div className="panel-header">Properties</div>
      <div className="overflow-auto" style={{ maxHeight: '40%' }}>
        <PropsEditor />
      </div>
    </div>
  );
};

export default UIBuilder;
