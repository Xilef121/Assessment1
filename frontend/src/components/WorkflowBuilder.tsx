// src/components/WorkflowBuilder.tsx
import React, { useState, useCallback } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Connection,
  addEdge,
  Edge,
  Node,
  NodeMouseHandler,
} from 'reactflow';
import 'reactflow/dist/style.css';

import AddButtonEdge, { OnAddNodePayload } from './AddButtonEdge';
import WorkflowNode from './WorkflowNode';

// Use unified node and edge types.
const nodeTypes = {
  workflowNode: WorkflowNode,
};

const edgeTypes = {
  addButton: AddButtonEdge,
};

// Initial Start and End nodes (with fixed positions for Start).
const initialNodes: Node[] = [
  {
    id: 'start',
    type: 'workflowNode',
    data: { label: 'Start Node', canDelete: false },
    position: { x: 300, y: 100 },
  },
  {
    id: 'end',
    type: 'workflowNode',
    data: { label: 'End Node', canDelete: false },
    position: { x: 300, y: 220 }, // initial; will be repositioned
  },
];

// A single initial edge connecting Start → End.
const initialEdges: Edge[] = [
  {
    id: 'edge-start-end',
    source: 'start',
    target: 'end',
    type: 'addButton',
    data: {},
  },
];

// Define a fixed spacing between nodes.
const NODE_SPACING = 120;

/**
 * recalcPositionsExtended():
 *  - Keeps the Start Node's position constant.
 *  - Adjusts the End Node's Y position so that the total height equals:
 *      startY + (totalNodes - 1) * NODE_SPACING.
 *  - Recalculates the Y positions for all Action Nodes evenly between Start and End.
 */
const recalcPositionsExtended = (nodes: Node[]): Node[] => {
  const startNode = nodes.find((n) => n.id === 'start');
  const endNode = nodes.find((n) => n.id === 'end');
  if (!startNode || !endNode) return nodes;

  // All action nodes: those that are not Start or End.
  const actionNodes = nodes.filter((n) => n.id !== 'start' && n.id !== 'end');
  const totalNodesCount = actionNodes.length + 2; // Start, Action(s), End

  const newEndY = startNode.position.y + (totalNodesCount - 1) * NODE_SPACING;

  // Update End Node.
  const updatedNodes = nodes.map((n) => {
    if (n.id === 'end') {
      return { ...n, position: { ...n.position, y: newEndY } };
    }
    return n;
  });

  // Sort action nodes by current Y (to preserve insertion order).
  const sortedActions = actionNodes.sort((a, b) => a.position.y - b.position.y);
  const updatedActions = sortedActions.map((node, idx) => ({
    ...node,
    position: { ...node.position, y: startNode.position.y + (idx + 1) * NODE_SPACING },
  }));

  // Combine and return: Start, updatedActions, End.
  const combined = updatedNodes.map((n) => {
    if (n.id === 'start' || n.id === 'end') return n;
    const found = updatedActions.find((a) => a.id === n.id);
    return found || n;
  });
  return combined;
};

const WorkflowBuilder = () => {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  // Side panel state for editing Action Nodes.
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  // (A) Insertion logic: When a plus is clicked on an edge.
  const handleAddNodeFromEdge = useCallback(
    ({ id: edgeId, source, target, centerX, centerY }: OnAddNodePayload) => {
      // Generate a new node ID.
      const newNodeId = `action-${Date.now()}`;

      // Update nodes: add the new Action Node and recalc positions.
      setNodes((prevNodes) => {
        // We compute the X coordinate as the average of source and target nodes if available.
        let alignedX = centerX;
        const sourceNode = prevNodes.find((n) => n.id === source);
        const targetNode = prevNodes.find((n) => n.id === target);
        if (sourceNode && targetNode) {
          alignedX = (sourceNode.position.x + targetNode.position.x) / 2;
        }
        const newActionNode: Node = {
          id: newNodeId,
          type: 'workflowNode',
          data: { label: 'Action Node', canDelete: true },
          position: { x: alignedX, y: centerY - 25 },
        };
        const newNodes = [...prevNodes, newActionNode];
        return recalcPositionsExtended(newNodes);
      });

      // Update edges: remove the old edge and add two new edges.
      setEdges((prevEdges) => {
        const filteredEdges = prevEdges.filter((edge) => edge.id !== edgeId);
        const edgeA: Edge = {
          id: `edge-${source}-${newNodeId}`,
          source: source,
          target: newNodeId,
          type: 'addButton',
          data: {},
        };
        const edgeB: Edge = {
          id: `edge-${newNodeId}-${target}`,
          source: newNodeId,
          target: target,
          type: 'addButton',
          data: {},
        };
        return [...filteredEdges, edgeA, edgeB];
      });
    },
    []
  );

  // (B) Inject onAddNode callback into every edge of type 'addButton'.
  const updatedEdges = edges.map((edge) =>
    edge.type === 'addButton'
      ? { ...edge, data: { ...edge.data, onAddNode: handleAddNodeFromEdge } }
      : edge
  );

  // (C) Optional: manual connection.
  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge(params, eds));
  }, []);

  // (D) Node click handler: Toggle side panel for Action Nodes.
  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      if (node.type === 'workflowNode' && node.id !== 'start' && node.id !== 'end') {
        if (selectedNodeId === node.id) {
          setSelectedNodeId(null);
        } else {
          setSelectedNodeId(node.id);
          setNewName(node.data.label || '');
        }
      }
    },
    [selectedNodeId]
  );

  // (E) Save new name from side panel.
  const handleSaveName = () => {
    if (!selectedNodeId) return;
    setNodes((prevNodes) =>
      recalcPositionsExtended(
        prevNodes.map((node) =>
          node.id === selectedNodeId ? { ...node, data: { ...node.data, label: newName } } : node
        )
      )
    );
  };

  // (F) Delete the selected Action Node and bridge connected nodes.
  const handleDeleteNode = () => {
    if (!selectedNodeId) return;
    const connectedEdges = edges.filter(
      (e) => e.source === selectedNodeId || e.target === selectedNodeId
    );
    setNodes((prev) => recalcPositionsExtended(prev.filter((n) => n.id !== selectedNodeId)));
    setEdges((prev) => prev.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
    if (connectedEdges.length === 2) {
      const [edge1, edge2] = connectedEdges;
      const nodeA = edge1.source === selectedNodeId ? edge1.target : edge1.source;
      const nodeB = edge2.source === selectedNodeId ? edge2.target : edge2.source;
      const bridgingEdge: Edge = {
        id: `edge-${nodeA}-${nodeB}`,
        source: nodeA,
        target: nodeB,
        type: 'addButton',
        data: {},
      };
      setEdges((prev) => [...prev, bridgingEdge]);
    }
    setSelectedNodeId(null);
  };

  return (
    <ReactFlowProvider>
      <div style={{ display: 'flex' }}>
        {/* React Flow Canvas */}
        <div style={{ width: '70%', height: '80vh', border: '1px solid #ccc' }}>
          <ReactFlow
            nodes={nodes}
            edges={updatedEdges}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
          />
        </div>
        {/* Side Panel */}
        {selectedNode && (
          <div style={{ width: '30%', padding: '1rem', borderLeft: '1px solid #ccc', background: '#f9f9f9' }}>
            <h2>Action Node Settings</h2>
            <div style={{ marginBottom: '1rem' }}>
              <label>Action Name:</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                style={{ display: 'block', width: '100%', marginTop: '0.5rem' }}
              />
              <button onClick={handleSaveName} style={{ marginTop: '0.5rem' }}>
                Save
              </button>
            </div>
            <button
              onClick={handleDeleteNode}
              style={{ backgroundColor: 'red', color: '#fff', padding: '0.5rem 1rem' }}
            >
              Delete Node
            </button>
          </div>
        )}
      </div>
    </ReactFlowProvider>
  );
};

export default WorkflowBuilder;
