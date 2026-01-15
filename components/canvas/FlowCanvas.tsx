"use client";

import React, { useCallback, useMemo, useEffect, useRef } from "react";
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
  ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";
import { EvidenceNode, ValidationNode, ClaimNode, RootClaimNode } from "./NodeTypes";
import { isEdgeAllowed } from "@/lib/graph/edge-rules";
import { NodeType } from "@/lib/types/graph";

// Define nodeTypes outside component to avoid React Flow warning
// Using Object.freeze to ensure it's truly immutable
const nodeTypes: NodeTypes = Object.freeze({
  evidence: EvidenceNode,
  validation: ValidationNode,
  claim: ClaimNode,
  claim_root: RootClaimNode,
}) as NodeTypes;

interface FlowCanvasProps {
  initialNodes: Node[];
  initialEdges: Edge[];
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onConnect: (connection: Connection) => void;
  onNodeClick?: (node: Node) => void;
  onPaneClick?: () => void;
  onNodeDragStop?: (event: React.MouseEvent, node: Node) => void;
}

export function FlowCanvas({
  initialNodes,
  initialEdges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onPaneClick,
  onNodeDragStop,
}: FlowCanvasProps) {
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(initialEdges);
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

  // Smart sync: only update when nodes are actually added/removed, preserve positions of existing nodes
  const prevNodeIdsRef = useRef<Set<string>>(new Set());
  const isInitialMountRef = useRef(true);
  const prevEdgesRef = useRef<string>("");

  useEffect(() => {
    const currentNodeIds = new Set(initialNodes.map(n => n.id));
    const prevNodeIds = prevNodeIdsRef.current;
    
    // On initial mount, always sync all nodes from database
    if (isInitialMountRef.current) {
      console.log("FlowCanvas: Initial mount - syncing all nodes from DB");
      setNodes(initialNodes.map(n => ({ ...n })));
      prevNodeIdsRef.current = currentNodeIds;
      isInitialMountRef.current = false;
      return;
    }
    
    // Check if nodes were added or removed
    const nodesAdded = initialNodes.filter(n => !prevNodeIds.has(n.id));
    const nodesRemoved = nodes.filter(n => !currentNodeIds.has(n.id));
    const nodesChanged = nodesAdded.length > 0 || nodesRemoved.length > 0;
    
    if (nodesChanged) {
      console.log("FlowCanvas: Nodes added/removed", {
        added: nodesAdded.length,
        removed: nodesRemoved.length,
        currentCount: nodes.length,
        newCount: initialNodes.length,
      });
      
      // For new nodes, use their positions from initialNodes
      // For existing nodes, preserve their current React Flow positions (user may have moved them)
      setNodes((prevNodes) => {
        const nodeMap = new Map(prevNodes.map(n => [n.id, n]));
        
        // Update with new nodes or nodes from initialNodes
        return initialNodes.map(initialNode => {
          const existingNode = nodeMap.get(initialNode.id);
          
          if (existingNode) {
            // Node exists - preserve its current position (user may have moved it)
            return {
              ...existingNode,
              data: initialNode.data, // Update data but keep position
            };
          } else {
            // New node - use position from initialNodes
            return { ...initialNode };
          }
        });
      });
      
      prevNodeIdsRef.current = currentNodeIds;
    }
  }, [initialNodes]); // Only depend on initialNodes, not nodes (to avoid circular updates)

  useEffect(() => {
    // Create a signature of edge IDs to detect changes
    const edgesSignature = initialEdges.map(e => e.id).sort().join(',');
    
    if (edgesSignature !== prevEdgesRef.current) {
      console.log("FlowCanvas: Syncing edges from DB", {
        currentCount: edges.length,
        newCount: initialEdges.length,
      });
      setEdges(initialEdges.map(e => ({ ...e })));
      prevEdgesRef.current = edgesSignature;
    }
  }, [initialEdges]); // Sync when initialEdges change

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

  // nodeTypes is already defined outside component and frozen, so it's stable
  // No need to memoize since it's a constant

  // Removed automatic fitView - user controls view manually via Controls component

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onInit={(instance) => {
          reactFlowInstance.current = instance;
        }}
        onNodeClick={(event, node) => {
          console.log("FlowCanvas: Node clicked", node.id);
          if (onNodeClick) {
            onNodeClick(node);
          }
        }}
        onPaneClick={(event) => {
          console.log("FlowCanvas: Pane clicked (blank canvas)");
          if (onPaneClick) {
            onPaneClick();
          }
        }}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView={false}
        minZoom={0.01}
        maxZoom={4}
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
      >
        <Background 
          color="#e5e5e7" 
          gap={20}
          size={1}
        />
        <Controls 
          style={{
            button: {
              backgroundColor: 'white',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '8px',
              color: '#1d1d1f',
            }
          }}
        />
        <MiniMap 
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '12px',
          }}
          nodeColor="#007aff"
          maskColor="rgba(0, 0, 0, 0.05)"
        />
      </ReactFlow>
    </div>
  );
}

