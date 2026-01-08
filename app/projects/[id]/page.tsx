"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Node, Edge, Connection } from "reactflow";
import { FlowCanvas } from "@/components/canvas/FlowCanvas";
import { NodePalette } from "@/components/canvas/NodePalette";
import { InspectorPanel } from "@/components/inspector/InspectorPanel";
import { ExportPanel } from "@/components/export/ExportPanel";
import { MintModal } from "@/components/mint/MintModal";
import { NodeType, NodeData } from "@/lib/types/graph";
import { getEdgeType } from "@/lib/graph/edge-rules";

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<any>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isMintModalOpen, setIsMintModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const loadProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Check if response is an error
      if (data.error) {
        console.error("API error:", data.error, data.details);
        return;
      }
      
      setProject(data);

      // Convert DB nodes to React Flow nodes (handle undefined/null)
      const flowNodes: Node[] = (data.nodes || []).map((n: any) => {
        const nodeData = JSON.parse(n.data);
        const label = nodeData.title || nodeData.shortSummary || "";
        return {
          id: n.id,
          type: n.type,
          position: { x: n.positionX, y: n.positionY },
          data: {
            ...nodeData,
            type: n.type,
            status: n.status,
            cid: n.cid,
            attestationUID: n.attestationUID,
            label: label || n.type,
          },
        };
      });

      // Convert DB edges to React Flow edges (handle undefined/null)
      const flowEdges: Edge[] = (data.edges || []).map((e: any) => ({
        id: e.id,
        source: e.fromNodeId,
        target: e.toNodeId,
        type: "smoothstep",
        label: e.type,
        style: { stroke: e.locked ? "#999" : "#333" },
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch (error) {
      console.error("Error loading project:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNode = async (type: NodeType) => {
    const position = { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 };
    const defaultData: any = {
      createdAt: new Date().toISOString(),
    };

    if (type === "evidence") {
      defaultData.title = "";
      defaultData.content = "";
    } else if (type === "validation") {
      defaultData.shortSummary = "";
      defaultData.validatorNames = [];
      defaultData.validationType = "";
      defaultData.evidenceCID = [];
    } else if (type === "claim") {
      defaultData.title = "";
      defaultData.shortDescription = "";
      defaultData.evidenceCID = [];
      defaultData.validationCID = [];
    }

    try {
      const response = await fetch("/api/nodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          type,
          positionX: position.x,
          positionY: position.y,
          data: defaultData,
        }),
      });

      if (response.ok) {
        const newNode = await response.json();
        const parsedData = JSON.parse(newNode.data);
        const label = parsedData.title || parsedData.shortSummary || "";
        const flowNode: Node = {
          id: newNode.id,
          type: newNode.type,
          position: { x: newNode.positionX, y: newNode.positionY },
          data: {
            ...parsedData,
            type: newNode.type,
            status: newNode.status || "draft",
            label: label || newNode.type,
          },
        };
        setNodes((prevNodes) => [...prevNodes, flowNode]);
        // Auto-select the newly created node so user can edit it immediately
        setSelectedNode(flowNode);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to create node:", errorData);
        alert(`Failed to create node: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error creating node:", error);
    }
  };

  const handleNodesChange = async (changes: any) => {
    // Update positions in DB
    for (const change of changes) {
      if (change.type === "position" && change.position) {
        try {
          await fetch(`/api/nodes/${change.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              positionX: change.position.x,
              positionY: change.position.y,
            }),
          });
        } catch (error) {
          console.error("Error updating node position:", error);
        }
      }
    }
  };

  const handleEdgesChange = (changes: any) => {
    // Handle edge deletions
    for (const change of changes) {
      if (change.type === "remove") {
        fetch(`/api/edges/${change.id}`, { method: "DELETE" }).catch(console.error);
      }
    }
  };

  const handleConnect = async (connection: Connection) => {
    if (!connection.source || !connection.target) return;

    try {
      const response = await fetch("/api/edges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          fromNodeId: connection.source,
          toNodeId: connection.target,
        }),
      });

      if (response.ok) {
        const newEdge = await response.json();
        const flowEdge: Edge = {
          id: newEdge.id,
          source: newEdge.fromNodeId,
          target: newEdge.toNodeId,
          type: "smoothstep",
          label: newEdge.type,
          style: { stroke: newEdge.locked ? "#999" : "#333" },
        };
        // Add edge without triggering any layout changes
        setEdges((prevEdges) => {
          // Check if edge already exists
          if (prevEdges.find(e => e.id === flowEdge.id)) {
            return prevEdges;
          }
          return [...prevEdges, flowEdge];
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to create edge:", errorData);
        alert(`Failed to create edge: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error creating edge:", error);
      alert("Error creating edge. Check console for details.");
    }
  };

  const handleUpdateNode = async (nodeId: string, data: NodeData): Promise<void> => {
    try {
      const response = await fetch(`/api/nodes/${nodeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update node");
      }

      // Compute label from title or shortSummary
      const label = (data as any).title || (data as any).shortSummary || "";

      // Update local state
      setNodes((prevNodes) => {
        const updatedNodes = prevNodes.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                data: {
                  ...data,
                  type: n.type,
                  status: (n.data as any)?.status || "draft",
                  label: label || n.type,
                },
              }
            : n
        );
        
        // Update selected node if it's the one being updated
        if (selectedNode?.id === nodeId) {
          const updatedNode = updatedNodes.find((n) => n.id === nodeId);
          if (updatedNode) {
            setSelectedNode({
              ...updatedNode,
              data: {
                ...data,
                type: updatedNode.type,
                status: (updatedNode.data as any)?.status || "draft",
                label: label || updatedNode.type,
              },
            });
          }
        }
        
        return updatedNodes;
      });
    } catch (error) {
      console.error("Error updating node:", error);
      throw error; // Re-throw so InspectorPanel can handle it
    }
  };

  if (loading) {
    return <div className="p-8">Loading project...</div>;
  }

  return (
    <div className="flex h-screen">
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-300 p-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">{project?.title || "Project"}</h1>
            <p className="text-sm text-gray-500">{project?.description || ""}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsMintModalOpen(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Mint
            </button>
            <a
              href="/"
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Back
            </a>
          </div>
        </div>
        <div className="flex-1 relative">
          <FlowCanvas
            initialNodes={nodes}
            initialEdges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={handleConnect}
            onNodeClick={(node) => {
              console.log("ProjectPage: Node clicked", node.id);
              // Find the full node from our state to ensure we have all data
              const fullNode = nodes.find((n) => n.id === node.id) || node;
              console.log("ProjectPage: Full node data", fullNode.data);
              setSelectedNode(fullNode);
            }}
          />
        </div>
      </div>
      <div className="w-80 bg-gray-100 border-l border-gray-300 p-4 space-y-4 overflow-y-auto">
        <NodePalette onAddNode={handleAddNode} />
        <ExportPanel projectId={projectId} />
      </div>
      <InspectorPanel
        selectedNode={selectedNode}
        onUpdateNode={handleUpdateNode}
        projectId={projectId}
      />
      <MintModal
        isOpen={isMintModalOpen}
        onClose={() => setIsMintModalOpen(false)}
        projectId={projectId}
      />
    </div>
  );
}

