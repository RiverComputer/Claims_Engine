"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { Node, Edge, Connection } from "reactflow";
import { FlowCanvas } from "@/components/canvas/FlowCanvas";
import { NodePalette } from "@/components/canvas/NodePalette";
import { InspectorPanel } from "@/components/inspector/InspectorPanel";
import { ExportPanel } from "@/components/export/ExportPanel";
import { MintModal } from "@/components/mint/MintModal";
import { NodeType, NodeData } from "@/lib/types/graph";
import { getEdgeType } from "@/lib/graph/edge-rules";
import { applySmartLayout } from "@/lib/layout/auto-layout";
// Auto-layout removed for stability
// Force layout removed for stability

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<any>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isMintModalOpen, setIsMintModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  // Force layout disabled for stability - nodes stay where placed
  const [forceLayoutEnabled, setForceLayoutEnabled] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const loadProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}?lite=1`);
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
      // CRITICAL: Always use positions from database - they are the source of truth
      // The database positions are what were last saved when the user moved nodes
      const flowNodes: Node[] = (data.nodes || []).map((n: any) => {
        const nodeData = JSON.parse(n.data);
        const label = nodeData.title || nodeData.shortSummary || nodeData.text || "";
        
        // ALWAYS use position from database - it represents the last saved state
        // On page refresh, nodes will be empty, so we use DB positions
        // The DB positions are saved immediately when user drags nodes (see handleNodesChange)
        const position = { 
          x: n.positionX ?? 0, 
          y: n.positionY ?? 0 
        };
        
        // Verify position values are valid numbers
        if (isNaN(position.x) || isNaN(position.y)) {
          console.warn(`⚠️ Invalid position for node ${n.id}:`, n.positionX, n.positionY, "using defaults");
          position.x = 0;
          position.y = 0;
        }
        
        console.log("loadProject: Loading node from DB", n.id, "position:", position, "DB values:", n.positionX, n.positionY);
        
        return {
          id: n.id,
          type: n.type,
          position: position, // Always use DB position - it's the saved state
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
      // Simple mapping - no root node magic, no auto-creation
      const flowEdges: Edge[] = (data.edges || []).map((e: any) => ({
        id: e.id,
        source: e.fromNodeId,
        target: e.toNodeId,
        type: "bezier",
        label: e.type,
        style: { stroke: e.locked ? "#999" : "#333" },
      }));
      
      // Simply use what's in the database - no auto-creation, no modifications
      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch (error) {
      console.error("Error loading project:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadFullNode = useCallback(async (nodeId: string) => {
    const existing = nodes.find((n) => n.id === nodeId);
    if (!existing) return null;

    const isLite = Boolean((existing.data as any)?._lite);
    if (!isLite) return existing;

    try {
      const response = await fetch(`/api/nodes/${nodeId}`);
      if (!response.ok) {
        console.error("Failed to hydrate node", nodeId, response.status);
        return existing;
      }

      const fullNode = await response.json();
      const parsedData = JSON.parse(fullNode.data);
      const label = parsedData.title || parsedData.shortSummary || "";

      const hydratedNode: Node = {
        ...existing,
        data: {
          ...parsedData,
          type: existing.type,
          status: fullNode.status || "draft",
          label: label || existing.type,
        },
      };

      setNodes((prevNodes) =>
        prevNodes.map((n) => (n.id === nodeId ? hydratedNode : n))
      );

      return hydratedNode;
    } catch (error) {
      console.error("Error hydrating node:", error);
      return existing;
    }
  }, [nodes]);

  const handleAddNode = async (type: NodeType) => {
    console.log("handleAddNode called with type:", type);
    
    // Place new node near the center of existing nodes, or use a smart position
    let position = { x: 0, y: 0 };
    if (nodes.length > 0) {
      // Calculate center of existing nodes
      const centerX = nodes.reduce((sum, n) => sum + n.position.x, 0) / nodes.length;
      const centerY = nodes.reduce((sum, n) => sum + n.position.y, 0) / nodes.length;
      // Place new node slightly offset from center based on type
      const offsetX = type === "evidence" ? 150 : type === "validation" ? 0 : -150;
      const offsetY = type === "evidence" ? 100 : type === "validation" ? 0 : -100;
      position = { x: centerX + offsetX, y: centerY + offsetY };
    } else {
      // First node - place at origin
      position = { x: 0, y: 0 };
    }
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
    } else if (type === "shape") {
      defaultData.shape = "rectangle";
      defaultData.width = 220;
      defaultData.height = 140;
      defaultData.fill = "rgba(148, 163, 184, 0.2)";
      defaultData.stroke = "rgba(71, 85, 105, 0.6)";
      defaultData.strokeWidth = 2;
      defaultData.borderRadius = 16;
    } else if (type === "text") {
      defaultData.text = "Text";
      defaultData.fontSize = 16;
      defaultData.color = "#111827";
      defaultData.width = 220;
      defaultData.height = 120;
      defaultData.align = "left";
    }

    try {
      console.log("Creating node with data:", { projectId, type, position, defaultData });
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

      console.log("Response status:", response.status);
      
      if (response.ok) {
        const newNode = await response.json();
        console.log("New node created:", newNode);
        const parsedData = JSON.parse(newNode.data);
        const label = parsedData.title || parsedData.shortSummary || parsedData.text || "";
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
        // Update nodes state - this will trigger FlowCanvas to update
        setNodes((prevNodes) => {
          const updated = [...prevNodes, flowNode];
          console.log("Node added to state", { nodeId: flowNode.id, totalNodes: updated.length });
          return updated;
        });
        // Auto-select the newly created node so user can edit it immediately
        setSelectedNode(flowNode);
        console.log("Node added to state and selected");
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to create node:", errorData);
        alert(`Failed to create node: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error creating node:", error);
      alert(`Error creating node: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  // Simple drag handler - just save position to DB when drag ends
  const handleNodeDragStop = useCallback(async (event: React.MouseEvent, node: Node) => {
    // Verify node exists in current state before saving
    const nodeExists = nodes.find(n => n.id === node.id);
    if (!nodeExists) {
      console.warn("Cannot save position: node not found in state", node.id);
      return;
    }
    
    // Save position to DB when drag ends
    try {
      const response = await fetch(`/api/nodes/${node.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          positionX: node.position.x,
          positionY: node.position.y,
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        const errorData = JSON.parse(errorText).catch(() => ({ error: errorText }));
        // Only log if it's not a 404 (node might have been deleted)
        if (response.status !== 404) {
          console.error("Failed to save node position after drag:", errorData);
        }
      }
    } catch (error) {
      console.error("Error saving node position after drag:", error);
    }
  }, [nodes]);

  // Handle node changes from React Flow
  const handleNodesChange = useCallback((changes: any) => {
    // Handle node deletions
    for (const change of changes) {
      if (change.type === "remove") {
        // Delete node from database
        fetch(`/api/nodes/${change.id}`, { method: "DELETE" })
          .then(async response => {
            if (!response.ok) {
              const errorText = await response.text();
              console.error("Failed to delete node:", errorText);
            } else {
              // Remove from local state
              setNodes((prevNodes) => prevNodes.filter(n => n.id !== change.id));
              // Clear selection if deleted node was selected
              if (selectedNode?.id === change.id) {
                setSelectedNode(null);
              }
            }
          })
          .catch(error => {
            console.error("Error deleting node:", error);
          });
      } else if (change.type === "position" && change.dragging === false && change.position) {
        // Save position when drag ends (backup to handleNodeDragStop)
        // Verify node exists before saving
        const nodeExists = nodes.find(n => n.id === change.id);
        if (nodeExists) {
          fetch(`/api/nodes/${change.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              positionX: change.position.x,
              positionY: change.position.y,
            }),
          }).catch((error) => {
            // Only log if it's not a 404 (node might have been deleted)
            if (error?.status !== 404) {
              console.error("Error saving node position:", error);
            }
          });
        }
      }
    }
  }, [selectedNode, nodes]);

  const handleSelectionDragStop = useCallback(async (movedNodes: Node[]) => {
    if (!movedNodes || movedNodes.length === 0) return;

    try {
      const updates = movedNodes.map((node) =>
        fetch(`/api/nodes/${node.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            positionX: node.position.x,
            positionY: node.position.y,
          }),
        })
      );
      await Promise.all(updates);
    } catch (error) {
      console.error("Error saving selection positions:", error);
    }
  }, []);

  const handleEdgesChange = (changes: any) => {
    // Handle edge deletions
    // Filter out root-link edges - they're virtual and don't exist in the database
    for (const change of changes) {
      if (change.type === "remove" && !change.id?.startsWith("root-link-")) {
        fetch(`/api/edges/${change.id}`, { method: "DELETE" }).catch(console.error);
      }
    }
  };

  const handleConnect = async (connection: Connection) => {
    if (!connection.source || !connection.target) return;

    // Verify nodes exist in current state before attempting to create edge
    const sourceNode = nodes.find(n => n.id === connection.source);
    const targetNode = nodes.find(n => n.id === connection.target);
    
    if (!sourceNode || !targetNode) {
      console.error("Cannot create edge: nodes not found in state", {
        source: connection.source,
        target: connection.target,
        availableNodes: nodes.map(n => ({ id: n.id, type: n.type })),
      });
      alert(`Cannot create edge: nodes not found. Please refresh the page.`);
      return;
    }

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
          type: "bezier",
          label: newEdge.type,
          style: { stroke: newEdge.locked ? "#999" : "#333" },
        };
        
        // Add edge to state
        setEdges((prevEdges) => {
          // Check if edge already exists
          if (prevEdges.find(e => e.id === flowEdge.id || (e.source === flowEdge.source && e.target === flowEdge.target))) {
            return prevEdges;
          }
          return [...prevEdges, flowEdge];
        });
        
        // Refresh affected nodes to ensure their data is up to date
        // Use the database IDs from the edge response
        const refreshNodes = async () => {
          try {
            const [sourceResponse, targetResponse] = await Promise.all([
              fetch(`/api/nodes/${newEdge.fromNodeId}`).catch(() => null),
              fetch(`/api/nodes/${newEdge.toNodeId}`).catch(() => null),
            ]);
            
            if (sourceResponse?.ok && targetResponse?.ok) {
              const [sourceNode, targetNode] = await Promise.all([
                sourceResponse.json(),
                targetResponse.json(),
              ]);
              
              // Update nodes state with fresh data, preserving positions
              setNodes((prevNodes) => {
                return prevNodes.map((node) => {
                  if (node.id === newEdge.fromNodeId) {
                    const nodeData = JSON.parse(sourceNode.data);
                    const label = nodeData.title || nodeData.shortSummary || "";
                    return {
                      ...node, // Preserve position and other properties
                      data: {
                        ...nodeData,
                        type: node.type,
                        status: sourceNode.status || "draft",
                        label: label || node.type,
                      },
                    };
                  }
                  if (node.id === newEdge.toNodeId) {
                    const nodeData = JSON.parse(targetNode.data);
                    const label = nodeData.title || nodeData.shortSummary || "";
                    return {
                      ...node, // Preserve position and other properties
                      data: {
                        ...nodeData,
                        type: node.type,
                        status: targetNode.status || "draft",
                        label: label || node.type,
                      },
                    };
                  }
                  return node;
                });
              });
            }
          } catch (error) {
            console.error("Error refreshing nodes after edge creation:", error);
          }
        };
        
        refreshNodes();
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to create edge:", errorData);
        alert(`Failed to create edge: ${errorData.error || errorData.details || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error creating edge:", error);
      alert("Error creating edge. Check console for details.");
    }
  };

  const handleAutoLayout = async () => {
    try {
      // Apply layout algorithm
      const layoutedNodes = applySmartLayout(nodes, edges);

      // Update positions in database
      const updatePromises = layoutedNodes.map((node) =>
        fetch(`/api/nodes/${node.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            positionX: node.position.x,
            positionY: node.position.y,
          }),
        })
      );

      await Promise.all(updatePromises);

      // Update local state
      setNodes(layoutedNodes);
    } catch (error) {
      console.error("Error applying auto-layout:", error);
      alert("Failed to apply auto-layout");
    }
  };


  const handleUpdateNode = async (nodeId: string, data: NodeData): Promise<void> => {
    console.log("ProjectPage: handleUpdateNode called", { nodeId, data, dataType: typeof data, dataKeys: Object.keys(data || {}) });
    try {
      // Ensure data is a plain object (not already stringified)
      const dataToSend = typeof data === "string" ? JSON.parse(data) : data;
      
      const response = await fetch(`/api/nodes/${nodeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: dataToSend }),
      });

      console.log("ProjectPage: Update response status", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || "Unknown error" };
        }
        console.error("ProjectPage: Update failed", { status: response.status, errorData, errorText });
        throw new Error(errorData.error || errorData.details || "Failed to update node");
      }

      const updatedNode = await response.json();
      console.log("ProjectPage: Node updated in DB", updatedNode);

      // Parse the updated data from DB
      const updatedData = JSON.parse(updatedNode.data);

      // Compute label from title or shortSummary
      const label = (updatedData as any).title || (updatedData as any).shortSummary || "";

      // Update local state - preserve position!
      setNodes((prevNodes) => {
        const updatedNodes = prevNodes.map((n) =>
          n.id === nodeId
            ? {
                ...n, // Preserve position and all other properties
                data: {
                  ...updatedData,
                  type: n.type,
                  status: updatedNode.status || "draft",
                  label: label || n.type,
                },
              }
            : n
        );
        
        // Update selected node if it's the one being updated - create new object to trigger re-render
        if (selectedNode?.id === nodeId) {
          const updatedNodeObj = updatedNodes.find((n) => n.id === nodeId);
          if (updatedNodeObj) {
            const newSelectedNode = {
              ...updatedNodeObj,
              data: {
                ...updatedData,
                type: updatedNodeObj.type,
                status: updatedNode.status || "draft",
                label: label || updatedNodeObj.type,
              },
            };
            console.log("ProjectPage: Updating selectedNode", newSelectedNode);
            setSelectedNode(newSelectedNode);
          }
        }
        
        return updatedNodes;
      });
      
      console.log("ProjectPage: Node update complete");
    } catch (error) {
      console.error("ProjectPage: Error updating node:", error);
      throw error; // Re-throw so InspectorPanel can handle it
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#f5f5f7]">
        <div className="text-center">
          <div className="text-gray-600 text-lg mb-2">Loading project...</div>
          <div className="w-8 h-8 border-2 border-gray-300 border-t-[#007aff] rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <div className="flex-1 flex flex-col">
        <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 mb-0.5">{project?.title || "Project"}</h1>
            <p className="text-xs text-gray-600">{project?.description || ""}</p>
          </div>
          <div className="flex gap-3 items-center">
            <button
              onClick={() => setIsMintModalOpen(true)}
              className="apple-button apple-button-primary"
            >
              Mint
            </button>
            <a
              href="/"
              className="apple-button"
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
              loadFullNode(node.id).then((fullNode) => {
                const resolvedNode = fullNode || nodes.find((n) => n.id === node.id) || node;
                console.log("ProjectPage: Full node data", resolvedNode.data);
                setSelectedNode(resolvedNode);
              });
            }}
            onPaneClick={() => {
              console.log("ProjectPage: Canvas clicked - clearing selection");
              setSelectedNode(null);
            }}
            onNodeDragStop={handleNodeDragStop}
            onSelectionDragStop={handleSelectionDragStop}
          />
        </div>
      </div>
      <div className="w-48 bg-white/60 backdrop-blur-xl border-l border-gray-200/50 p-3 space-y-4 overflow-y-auto">
        <NodePalette onAddNode={handleAddNode} />
        <ExportPanel projectId={projectId} />
      </div>
      {selectedNode && (
      <InspectorPanel
        selectedNode={selectedNode}
        onUpdateNode={handleUpdateNode}
        projectId={projectId}
      />
      )}
      <MintModal
        isOpen={isMintModalOpen}
        onClose={() => setIsMintModalOpen(false)}
        projectId={projectId}
      />
    </div>
  );
}

