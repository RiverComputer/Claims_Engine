/**
 * Force-directed layout using D3 Force for physics-based node positioning
 * Nodes repel each other and are attracted along edges
 */

import { forceSimulation, forceManyBody, forceLink, forceCenter, forceCollide, SimulationNodeDatum, SimulationLinkDatum } from "d3-force";
import { Node, Edge } from "reactflow";

interface ForceNode extends SimulationNodeDatum {
  id: string;
  x?: number;
  y?: number;
}

interface ForceLink extends SimulationLinkDatum<ForceNode> {
  source: string | ForceNode;
  target: string | ForceNode;
}

const NODE_WIDTH = 200;
const NODE_HEIGHT = 100;
const NODE_RADIUS = Math.sqrt(NODE_WIDTH * NODE_WIDTH + NODE_HEIGHT * NODE_HEIGHT) / 2;

/**
 * Apply force-directed layout to nodes
 * Uses D3 Force simulation with repulsion, attraction, and collision forces
 */
export function applyForceLayout(nodes: Node[], edges: Edge[], iterations: number = 300): Node[] {
  if (nodes.length === 0) return nodes;

  // Convert React Flow nodes to D3 force nodes
  const forceNodes: ForceNode[] = nodes.map((node) => ({
    id: node.id,
    x: node.position.x + NODE_WIDTH / 2,
    y: node.position.y + NODE_HEIGHT / 2,
  }));

  // Convert React Flow edges to D3 force links
  const forceLinks: ForceLink[] = edges.map((edge) => ({
    source: edge.source,
    target: edge.target,
  }));

  // Create force simulation
  const simulation = forceSimulation(forceNodes)
    .force(
      "charge",
      forceManyBody()
        .strength(-400) // Repulsion strength (negative = repulsion)
        .distanceMax(500) // Maximum distance for repulsion
    )
    .force(
      "link",
      forceLink(forceLinks)
        .id((d: any) => d.id)
        .distance(250) // Desired distance between connected nodes
        .strength(0.5) // Attraction strength along edges
    )
    .force(
      "center",
      forceCenter(600, 400) // Center of the canvas
    )
    .force(
      "collision",
      forceCollide()
        .radius(NODE_RADIUS + 20) // Collision radius (node size + padding)
        .strength(0.8) // Collision strength
    )
    .stop();

  // Run simulation for specified iterations
  for (let i = 0; i < iterations; ++i) {
    simulation.tick();
  }

  // Convert back to React Flow nodes with updated positions
  const nodeMap = new Map(forceNodes.map((n) => [n.id, n]));
  
  return nodes.map((node) => {
    const forceNode = nodeMap.get(node.id);
    if (forceNode && forceNode.x !== undefined && forceNode.y !== undefined) {
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
}

