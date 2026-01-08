"use client";

import React, { useCallback, useMemo, useEffect } from "react";
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";
import { EvidenceNode, ValidationNode, ClaimNode } from "./NodeTypes";
import { isEdgeAllowed } from "@/lib/graph/edge-rules";
import { NodeType } from "@/lib/types/graph";

// Define nodeTypes outside component to avoid React Flow warning
const nodeTypes: NodeTypes = {
  evidence: EvidenceNode,
  validation: ValidationNode,
  claim: ClaimNode,
} as const;

interface FlowCanvasProps {
  initialNodes: Node[];
  initialEdges: Edge[];
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onConnect: (connection: Connection) => void;
  onNodeClick?: (node: Node) => void;
}

export function FlowCanvas({
  initialNodes,
  initialEdges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
}: FlowCanvasProps) {
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(initialEdges);

  // Sync with parent when initialNodes/initialEdges change
  // But ALWAYS preserve positions from internal state to prevent nodes from moving
  useEffect(() => {
    // Merge: use positions from current state, data from initialNodes
    const mergedNodes = initialNodes.map(newNode => {
      const existingNode = nodes.find(n => n.id === newNode.id);
      if (existingNode) {
        // Always preserve position from existing node
        return {
          ...newNode,
          position: existingNode.position,
        };
      }
      return newNode;
    });
    
    // Only update if there are actual changes (new nodes or data changes)
    const hasNewNodes = mergedNodes.length !== nodes.length;
    const hasDataChanges = mergedNodes.some(newNode => {
      const oldNode = nodes.find(n => n.id === newNode.id);
      if (!oldNode) return true; // New node
      return JSON.stringify(newNode.data) !== JSON.stringify(oldNode.data);
    });
    
    if (hasNewNodes || hasDataChanges) {
      setNodes(mergedNodes);
    }
  }, [initialNodes, nodes, setNodes]);

  useEffect(() => {
    const currentIds = new Set(edges.map(e => e.id));
    const newIds = new Set(initialEdges.map(e => e.id));
    if (currentIds.size !== newIds.size || ![...currentIds].every(id => newIds.has(id))) {
      setEdges(initialEdges);
    }
  }, [initialEdges, edges, setEdges]);

  // Handle node changes (position updates)
  const handleNodesChange = useCallback(
    (changes: any) => {
      onNodesChangeInternal(changes);
      onNodesChange(changes);
    },
    [onNodesChange, onNodesChangeInternal]
  );

  // Handle edge changes
  const handleEdgesChange = useCallback(
    (changes: any) => {
      onEdgesChangeInternal(changes);
      onEdgesChange(changes);
    },
    [onEdgesChange, onEdgesChangeInternal]
  );

  // Handle new connections with validation
  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;

      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);

      if (!sourceNode || !targetNode) {
        console.warn("Source or target node not found", { source: connection.source, target: connection.target });
        return;
      }

      const sourceType = sourceNode.type as NodeType;
      const targetType = targetNode.type as NodeType;

      if (isEdgeAllowed(sourceType, targetType)) {
        // Don't add edge here - let parent handle it via API
        // This prevents duplicate edges and ensures we use the correct edge ID from the database
        onConnect(connection);
      } else {
        alert(`Cannot connect ${sourceType} to ${targetType}`);
      }
    },
    [nodes, onConnect]
  );

  // Memoize nodeTypes to ensure stable reference and avoid React Flow warning
  const memoizedNodeTypes = useMemo(() => nodeTypes, []);

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onNodeClick={onNodeClick}
        nodeTypes={memoizedNodeTypes}
        fitView={false}
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}

