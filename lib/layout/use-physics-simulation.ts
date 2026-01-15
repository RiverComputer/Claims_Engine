/**
 * Real-time physics simulation hook for continuous node repulsion
 * Uses D3 Force to continuously update node positions
 */

import { useEffect, useRef, useState } from "react";
import { forceSimulation, forceManyBody, forceLink, forceCenter, forceCollide, SimulationNodeDatum } from "d3-force";
import { Node, Edge } from "reactflow";

interface ForceNode extends SimulationNodeDatum {
  id: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

const NODE_WIDTH = 200;
const NODE_HEIGHT = 100;
const NODE_RADIUS = Math.sqrt(NODE_WIDTH * NODE_WIDTH + NODE_HEIGHT * NODE_HEIGHT) / 2;

export function usePhysicsSimulation(
  nodes: Node[],
  edges: Edge[],
  enabled: boolean = true,
  onNodesUpdate: (updatedNodes: Node[]) => void
) {
  const simulationRef = useRef<any>(null);
  const isDraggingRef = useRef<Set<string>>(new Set());
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!enabled || nodes.length === 0) {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
      setIsRunning(false);
      return;
    }

    // Convert React Flow nodes to D3 force nodes
    const forceNodes: ForceNode[] = nodes.map((node) => {
      const existing = simulationRef.current?.nodes()?.find((n: ForceNode) => n.id === node.id);
      return {
        id: node.id,
        x: existing?.x ?? node.position.x + NODE_WIDTH / 2,
        y: existing?.y ?? node.position.y + NODE_HEIGHT / 2,
        fx: null, // Allow free movement
        fy: null,
      };
    });

    // Convert React Flow edges to D3 force links
    const forceLinks = edges.map((edge) => ({
      source: edge.source,
      target: edge.target,
    }));

    // Create or update simulation
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    const simulation = forceSimulation(forceNodes)
      .force(
        "charge",
        forceManyBody()
          .strength(-500) // Strong repulsion
          .distanceMax(600)
      )
      .force(
        "link",
        forceLink(forceLinks)
          .id((d: any) => d.id)
          .distance(280) // Desired distance between connected nodes
          .strength(0.6)
      )
      .force(
        "center",
        forceCenter(600, 400)
      )
      .force(
        "collision",
        forceCollide()
          .radius(NODE_RADIUS + 30) // Prevent overlap
          .strength(0.9)
      )
      .alpha(0.5) // Start with energy
      .alphaDecay(0.01) // Very slow decay for continuous movement
      .velocityDecay(0.3); // Less damping for more movement

    // Update React Flow nodes on each tick
    simulation.on("tick", () => {
      const updatedNodes = nodes.map((node) => {
        const forceNode = forceNodes.find((n) => n.id === node.id);
        if (forceNode && forceNode.x !== undefined && forceNode.y !== undefined) {
          // Don't update if node is being dragged
          if (isDraggingRef.current.has(node.id)) {
            return node;
          }
          return {
            ...node,
            position: {
              x: forceNode.x - NODE_WIDTH / 2,
              y: forceNode.y - NODE_HEIGHT / 2,
            },
          };
        }
        return node;
      });

      onNodesUpdate(updatedNodes);
    });

    // Keep simulation running continuously
    simulation.on("end", () => {
      if (enabled) {
        // Restart with fresh energy to keep it moving
        simulation.alpha(0.5).restart();
      }
    });

    simulationRef.current = simulation;
    setIsRunning(true);

    // Restart simulation periodically to keep it active
    const restartInterval = setInterval(() => {
      if (simulation.alpha() < 0.1) {
        simulation.alpha(0.3).restart();
      }
    }, 2000);

    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
      clearInterval(restartInterval);
      setIsRunning(false);
    };
  }, [nodes, edges, enabled, onNodesUpdate]);

  // Track when nodes are being dragged
  const setNodeDragging = (nodeId: string, isDragging: boolean) => {
    if (isDragging) {
      isDraggingRef.current.add(nodeId);
      // Lock position while dragging
      const node = simulationRef.current?.nodes()?.find((n: ForceNode) => n.id === nodeId);
      if (node) {
        node.fx = node.x;
        node.fy = node.y;
      }
    } else {
      isDraggingRef.current.delete(nodeId);
      // Unlock position after dragging
      const node = simulationRef.current?.nodes()?.find((n: ForceNode) => n.id === nodeId);
      if (node) {
        node.fx = null;
        node.fy = null;
      }
    }
  };

  return { isRunning, setNodeDragging };
}

