/**
 * React Hook for Force Layout v3
 * Integrates d3-force simulation with React Flow
 */

import { useEffect, useRef, useCallback, useMemo } from "react";
import { Node, Edge } from "reactflow";
import { Simulation } from "d3-force";
import {
  SimNode,
  SimLink,
  ForceConfig,
  DEFAULT_CONFIG,
  mapToSimNodes,
  mapToSimLinks,
  createSimulation,
  syncToReactFlow,
} from "@/lib/layout/force-layout-v3";

export interface UseForceLayoutOptions {
  enabled: boolean;
  config?: Partial<ForceConfig>;
  rootNodeId?: string;
  onTick?: (nodes: Node[]) => void;
  throttleMs?: number; // Throttle updates to avoid React thrash
}

export interface UseForceLayoutReturn {
  simulation: Simulation<SimNode, SimLink> | null;
  isRunning: boolean;
  reheat: () => void;
  pause: () => void;
  resume: () => void;
  stabilize: () => void;
  pinNode: (nodeId: string, pinned: boolean) => void;
  isNodePinned: (nodeId: string) => boolean;
}

export function useForceLayout(
  nodes: Node[],
  edges: Edge[],
  options: UseForceLayoutOptions
): UseForceLayoutReturn {
  const {
    enabled,
    config = {},
    rootNodeId,
    onTick,
    throttleMs = 16, // ~60fps
  } = options;

  const simulationRef = useRef<Simulation<SimNode, SimLink> | null>(null);
  const simNodesRef = useRef<Map<string, SimNode>>(new Map());
  const pinnedNodesRef = useRef<Set<string>>(new Set());
  const lastUpdateRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const isRunningRef = useRef<boolean>(false);

  // Merge config with defaults
  const fullConfig: ForceConfig = useMemo(
    () => ({ ...DEFAULT_CONFIG, ...config }),
    [config]
  );

  // Create graph signature for memoization
  const graphSignature = useMemo(
    () =>
      `${nodes.map((n) => n.id).sort().join(",")}|${edges
        .map((e) => `${e.source}-${e.target}`)
        .sort()
        .join(",")}`,
    [nodes, edges]
  );

  // Track previous graph state to detect changes
  const prevGraphRef = useRef<{ nodeIds: Set<string>; edgeIds: Set<string> }>({
    nodeIds: new Set(),
    edgeIds: new Set(),
  });

  // Initialize or update simulation
  useEffect(() => {
    if (!enabled || nodes.length === 0) {
      if (simulationRef.current) {
        simulationRef.current.stop();
        simulationRef.current = null;
      }
      isRunningRef.current = false;
      return;
    }

    // Detect what changed
    const currentNodeIds = new Set(nodes.map((n) => n.id));
    const currentEdgeIds = new Set(edges.map((e) => e.id));
    const prevNodeIds = prevGraphRef.current.nodeIds;
    const prevEdgeIds = prevGraphRef.current.edgeIds;

    // Check if it's just a new node being added (not removed, not edges changed)
    const addedNodes = [...currentNodeIds].filter((id) => !prevNodeIds.has(id));
    const removedNodes = [...prevNodeIds].filter((id) => !currentNodeIds.has(id));
    const edgesChanged = currentEdgeIds.size !== prevEdgeIds.size ||
      [...currentEdgeIds].some((id) => !prevEdgeIds.has(id));

    const isNewNodeAddition = addedNodes.length === 1 && 
                              removedNodes.length === 0 && 
                              !edgesChanged &&
                              simulationRef.current !== null;

    // Map to simulation nodes (preserve existing positions)
    const simNodes = mapToSimNodes(nodes, simNodesRef.current);
    
    // For new nodes, ensure they start with zero velocity to prevent sudden movement
    simNodes.forEach((simNode) => {
      if (!prevNodeIds.has(simNode.id)) {
        // New node - ensure it starts with zero velocity and no fixed position
        simNode.vx = 0;
        simNode.vy = 0;
        simNode.fx = null;
        simNode.fy = null;
      }
    });
    
    simNodesRef.current = new Map(simNodes.map((n) => [n.id, n]));

    // Map to simulation links
    const simLinks = mapToSimLinks(nodes, edges, rootNodeId);

    // Create or update simulation
    if (simulationRef.current) {
      if (isNewNodeAddition) {
        // For new node addition: pin ALL existing nodes BEFORE updating simulation
        // Use positions from React Flow state (database positions), not simulation positions
        const existingNodeIds = new Set([...prevNodeIds]);
        
        // Pin existing nodes at their React Flow positions (from database)
        simNodes.forEach((simNode) => {
          if (existingNodeIds.has(simNode.id)) {
            // Pin at the position from React Flow (which comes from database)
            // This ensures we use the saved positions, not simulation positions
            simNode.fx = simNode.x ?? 0;
            simNode.fy = simNode.y ?? 0;
            // Zero out velocity to prevent any drift
            simNode.vx = 0;
            simNode.vy = 0;
          }
        });
      }
      
      // Update existing simulation with pinned nodes
      simulationRef.current.nodes(simNodes);
      simulationRef.current.force<SimLink>("link")?.links(simLinks);
      
      if (isNewNodeAddition) {
        // DON'T restart the simulation - just let it continue naturally
        // Existing nodes are pinned, so they won't move
        // Only wake up slightly if simulation has completely stopped
        const currentAlpha = simulationRef.current.alpha();
        if (currentAlpha < 0.01) {
          // Simulation has stopped - give it a tiny nudge for the new node
          simulationRef.current.alpha(0.1);
        }
        // Don't call restart() - this prevents the aggressive movement
        
        // Keep existing nodes pinned for 3 seconds, then very gently allow adjustment
        setTimeout(() => {
          if (simulationRef.current) {
            const nodesToUnpin = simulationRef.current.nodes() as SimNode[];
            const existingNodeIds = new Set([...prevNodeIds]);
            nodesToUnpin.forEach((simNode) => {
              // Only unpin if it's an existing node and not manually pinned
              if (existingNodeIds.has(simNode.id) && !pinnedNodesRef.current.has(simNode.id)) {
                simNode.fx = null;
                simNode.fy = null;
              }
            });
            // Very gentle wake - minimal movement allowed
            const currentAlpha = simulationRef.current.alpha();
            if (currentAlpha < 0.05) {
              simulationRef.current.alpha(0.05);
            }
          }
        }, 3000); // Keep pinned for 3 seconds to ensure new node fully settles
      } else {
        // Full reheat for structural changes (edges added/removed, nodes removed)
        simulationRef.current.alpha(1).restart();
      }
    } else {
      // Create new simulation
      const simulation = createSimulation(
        simNodes,
        simLinks,
        fullConfig,
        rootNodeId
      );

      // Throttled tick handler
      simulation.on("tick", () => {
        const now = Date.now();
        if (now - lastUpdateRef.current < throttleMs) {
          return; // Skip this tick
        }
        lastUpdateRef.current = now;

        // Update sim nodes map
        simulation.nodes().forEach((node) => {
          simNodesRef.current.set(node.id, node);
        });

        // Sync to React Flow and notify
        if (onTick && rafRef.current === null) {
          rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null;
            const updatedNodes = syncToReactFlow(
              Array.from(simNodesRef.current.values()),
              nodes
            );
            onTick(updatedNodes);
          });
        }
      });

      simulation.on("end", () => {
        isRunningRef.current = false;
      });

      simulationRef.current = simulation;
      isRunningRef.current = true;
    }

    // Update previous graph state
    prevGraphRef.current = {
      nodeIds: currentNodeIds,
      edgeIds: currentEdgeIds,
    };

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [enabled, graphSignature, fullConfig, rootNodeId, nodes, edges, onTick, throttleMs]);

  // Reheat simulation
  const reheat = useCallback(() => {
    if (simulationRef.current) {
      simulationRef.current.alpha(1).restart();
      isRunningRef.current = true;
    }
  }, []);

  // Pause simulation
  const pause = useCallback(() => {
    if (simulationRef.current) {
      simulationRef.current.stop();
      isRunningRef.current = false;
    }
  }, []);

  // Resume simulation
  const resume = useCallback(() => {
    if (simulationRef.current) {
      simulationRef.current.alpha(0.3).restart();
      isRunningRef.current = true;
    }
  }, []);

  // Stabilize (set alphaTarget to 0, increase decay)
  const stabilize = useCallback(() => {
    if (simulationRef.current) {
      simulationRef.current.alphaTarget(0);
      simulationRef.current.alphaDecay(fullConfig.alphaDecay * 2);
      simulationRef.current.restart();
    }
  }, [fullConfig.alphaDecay]);

  // Pin/unpin node
  const pinNode = useCallback(
    (nodeId: string, pinned: boolean) => {
      const simNode = simNodesRef.current.get(nodeId);
      if (!simNode || !simulationRef.current) return;

      if (pinned) {
        pinnedNodesRef.current.add(nodeId);
        simNode.fx = simNode.x ?? 0;
        simNode.fy = simNode.y ?? 0;
      } else {
        pinnedNodesRef.current.delete(nodeId);
        simNode.fx = null;
        simNode.fy = null;
      }

      simulationRef.current.alpha(0.3).restart();
    },
    []
  );

  // Check if node is pinned
  const isNodePinned = useCallback((nodeId: string) => {
    return pinnedNodesRef.current.has(nodeId);
  }, []);

  return {
    simulation: simulationRef.current,
    isRunning: isRunningRef.current,
    reheat,
    pause,
    resume,
    stabilize,
    pinNode,
    isNodePinned,
  };
}

