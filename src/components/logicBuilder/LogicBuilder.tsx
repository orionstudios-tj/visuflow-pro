import React, { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Node,
  type Edge,
  BackgroundVariant,
  Handle,
  Position,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useAppStore } from '@/store/appStore';
import type { LogicGraph, LogicNode, LogicEdge, LogicNodeType } from '@/types/logic.types';
import { validateDAG } from '@/engine/dagUtils';
import { Zap, Globe, GitBranch, Clock, Database, Navigation, Plus, Play, AlertTriangle } from 'lucide-react';

const NODE_COLORS: Record<LogicNodeType, string> = {
  Trigger: 'hsl(167 70% 50%)',
  API: 'hsl(210 80% 55%)',
  Condition: 'hsl(40 85% 55%)',
  Delay: 'hsl(270 60% 60%)',
  SetState: 'hsl(330 70% 55%)',
  Navigate: 'hsl(15 80% 55%)',
};

const NODE_ICONS: Record<LogicNodeType, React.ReactNode> = {
  Trigger: <Zap size={14} />,
  API: <Globe size={14} />,
  Condition: <GitBranch size={14} />,
  Delay: <Clock size={14} />,
  SetState: <Database size={14} />,
  Navigate: <Navigation size={14} />,
};

/* ── Custom Node Component ── */
const LogicNodeComponent: React.FC<NodeProps> = ({ data }) => {
  const nodeType = data.nodeType as LogicNodeType;
  const color = NODE_COLORS[nodeType] || '#888';

  return (
    <div
      style={{
        background: 'hsl(225 15% 13%)',
        border: `2px solid ${color}`,
        borderRadius: '8px',
        padding: '8px 12px',
        minWidth: '140px',
        fontSize: '12px',
        color: 'hsl(210 20% 90%)',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: color, width: 8, height: 8 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ color }}>{NODE_ICONS[nodeType]}</span>
        <span style={{ fontWeight: 600 }}>{data.label as string}</span>
      </div>
      {nodeType === 'Condition' && (
        <>
          <Handle type="source" position={Position.Bottom} id="true" style={{ background: 'hsl(167 70% 50%)', left: '30%', width: 8, height: 8 }} />
          <Handle type="source" position={Position.Bottom} id="false" style={{ background: 'hsl(0 65% 55%)', left: '70%', width: 8, height: 8 }} />
        </>
      )}
      {nodeType !== 'Condition' && (
        <Handle type="source" position={Position.Bottom} style={{ background: color, width: 8, height: 8 }} />
      )}
    </div>
  );
};

const nodeTypes = { logicNode: LogicNodeComponent };

let flowCounter = 0;

/* ── Logic Builder ── */
const LogicBuilder: React.FC = () => {
  const { logicGraphs, activeGraphId, setActiveGraph, addLogicGraph, updateLogicGraph } = useAppStore();
  const [dagError, setDagError] = useState<string | null>(null);

  const activeGraph = logicGraphs.find((g) => g.id === activeGraphId);

  // Convert logic nodes to React Flow nodes
  const rfNodes: Node[] = useMemo(
    () =>
      (activeGraph?.nodes || []).map((n) => ({
        id: n.id,
        type: 'logicNode',
        position: n.position,
        data: { label: n.label, nodeType: n.type, config: n.config },
      })),
    [activeGraph]
  );

  const rfEdges: Edge[] = useMemo(
    () =>
      (activeGraph?.edges || []).map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        label: e.label,
        style: { stroke: e.label === 'false' ? 'hsl(0 65% 55%)' : 'hsl(167 70% 50%)' },
        animated: true,
      })),
    [activeGraph]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(rfNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(rfEdges);

  // Sync when active graph changes
  React.useEffect(() => {
    setNodes(rfNodes);
    setEdges(rfEdges);
  }, [activeGraphId, rfNodes, rfEdges]);

  const syncToStore = useCallback(
    (newNodes: Node[], newEdges: Edge[]) => {
      if (!activeGraphId) return;
      const logicNodes: LogicNode[] = newNodes.map((n) => ({
        id: n.id,
        type: n.data.nodeType as LogicNodeType,
        label: n.data.label as string,
        config: (n.data.config as LogicNode['config']) || {},
        position: n.position,
      }));
      const logicEdges: LogicEdge[] = newEdges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label as string | undefined,
        sourceHandle: e.sourceHandle as string | undefined,
      }));
      const validation = validateDAG(logicNodes, logicEdges);
      setDagError(validation.valid ? null : validation.error || 'Invalid DAG');
      updateLogicGraph(activeGraphId, { nodes: logicNodes, edges: logicEdges });
    },
    [activeGraphId, updateLogicGraph]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const newEdges = addEdge(
        {
          ...connection,
          id: `e_${Date.now()}`,
          animated: true,
          style: { stroke: connection.sourceHandle === 'false' ? 'hsl(0 65% 55%)' : 'hsl(167 70% 50%)' },
          label: connection.sourceHandle || undefined,
        },
        edges
      );
      setEdges(newEdges);
      syncToStore(nodes, newEdges);
    },
    [edges, nodes, setEdges, syncToStore]
  );

  const handleNodesChange: typeof onNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes);
      // We'll sync on drag end via onNodeDragStop
    },
    [onNodesChange]
  );

  const onNodeDragStop = useCallback(() => {
    syncToStore(nodes, edges);
  }, [nodes, edges, syncToStore]);

  const addNewGraph = () => {
    flowCounter++;
    const graph: LogicGraph = {
      id: `flow_${flowCounter}_${Date.now()}`,
      name: `Workflow ${flowCounter}`,
      nodes: [],
      edges: [],
    };
    addLogicGraph(graph);
    setActiveGraph(graph.id);
  };

  const addNode = (type: LogicNodeType) => {
    if (!activeGraphId) return;
    const id = `${type.toLowerCase()}_${Date.now()}`;
    const newNode: Node = {
      id,
      type: 'logicNode',
      position: { x: 150 + Math.random() * 200, y: 100 + Math.random() * 200 },
      data: { label: type, nodeType: type, config: {} },
    };
    const updated = [...nodes, newNode];
    setNodes(updated);
    syncToStore(updated, edges);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Workflow list */}
      <div className="panel-header">
        <span>Workflows</span>
        <button onClick={addNewGraph} className="p-0.5 rounded hover:bg-muted bg-transparent border-none cursor-pointer text-muted-foreground">
          <Plus size={14} />
        </button>
      </div>
      <div className="flex gap-1 p-2 border-b border-border overflow-x-auto">
        {logicGraphs.map((g) => (
          <button
            key={g.id}
            onClick={() => setActiveGraph(g.id)}
            className={`px-2 py-1 rounded text-xs border-none cursor-pointer whitespace-nowrap ${
              activeGraphId === g.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-muted'
            }`}
          >
            {g.name}
          </button>
        ))}
        {logicGraphs.length === 0 && <span className="text-xs text-muted-foreground p-1">No workflows yet</span>}
      </div>

      {/* Node palette */}
      {activeGraph && (
        <div className="flex gap-1 p-2 border-b border-border flex-wrap">
          {(Object.keys(NODE_COLORS) as LogicNodeType[]).map((type) => (
            <button
              key={type}
              onClick={() => addNode(type)}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] border-none cursor-pointer bg-secondary text-secondary-foreground hover:bg-muted"
              style={{ borderLeft: `3px solid ${NODE_COLORS[type]}` }}
            >
              {NODE_ICONS[type]}
              {type}
            </button>
          ))}
        </div>
      )}

      {/* DAG Validation error */}
      {dagError && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-destructive/10 text-destructive text-xs">
          <AlertTriangle size={12} /> {dagError}
        </div>
      )}

      {/* React Flow canvas */}
      <div className="flex-1">
        {activeGraph ? (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDragStop={onNodeDragStop}
            nodeTypes={nodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="hsl(225 12% 20%)" />
            <Controls />
            <MiniMap
              nodeColor={(n) => NODE_COLORS[(n.data?.nodeType as LogicNodeType)] || '#666'}
              style={{ background: 'hsl(225 15% 13%)' }}
            />
          </ReactFlow>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Create a workflow to start
          </div>
        )}
      </div>
    </div>
  );
};

export default LogicBuilder;
