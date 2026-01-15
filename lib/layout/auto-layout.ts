/**
 * Automatic layout for React Flow nodes using dagre
 * Positions nodes in a hierarchical layout based on their types and connections
 */

import dagre from "dagre";
import { Node, Edge } from "reactflow";
import { applyForceLayout } from "./force-layout";

const NODE_WIDTH = 200;
const NODE_HEIGHT = 100;
const HORIZONTAL_SPACING = 250;
const VERTICAL_SPACING = 150;

/**
 * Apply automatic layout to nodes based on their connections
 */
export function applyAutoLayout(nodes: Node[], edges: Edge[]): Node[] {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ 
    rankdir: "LR", // Left to Right layout
    nodesep: HORIZONTAL_SPACING,
    ranksep: VERTICAL_SPACING,
    align: "UL", // Align to upper left
  });

  // Add nodes to dagre graph
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    });
  });

  // Add edges to dagre graph
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Run layout algorithm
  dagre.layout(dagreGraph);

  // Update node positions
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
    };
  });

  return layoutedNodes;
}

/**
 * Simple grid layout for nodes grouped by type
 * Useful when there are no edges or for initial positioning
 */
export function applyGridLayout(nodes: Node[]): Node[] {
  // Group nodes by type
  const nodesByType = new Map<string, Node[]>();
  nodes.forEach((node) => {
    const type = node.type || "unknown";
    if (!nodesByType.has(type)) {
      nodesByType.set(type, []);
    }
    nodesByType.get(type)!.push(node);
  });

  const layoutedNodes: Node[] = [];
  let currentX = 100;
  const startY = 100;
  const rowSpacing = 150;

  // Position by type: Evidence → Validation → Claim
  const typeOrder = ["evidence", "validation", "claim"];
  
  for (const type of typeOrder) {
    const typeNodes = nodesByType.get(type) || [];
    let currentY = startY;

    for (const node of typeNodes) {
      layoutedNodes.push({
        ...node,
        position: { x: currentX, y: currentY },
      });
      currentY += rowSpacing;
    }

    if (typeNodes.length > 0) {
      currentX += HORIZONTAL_SPACING;
    }
  }

  // Handle any nodes with unknown types
  const unknownNodes = nodesByType.get("unknown") || [];
  let currentY = startY;
  for (const node of unknownNodes) {
    layoutedNodes.push({
      ...node,
      position: { x: currentX, y: currentY },
    });
    currentY += rowSpacing;
  }

  return layoutedNodes;
}

/**
 * Smart layout: use force-directed physics for natural node spacing
 * Falls back to grid layout if there are very few nodes
 */
export function applySmartLayout(nodes: Node[], edges: Edge[]): Node[] {
  // Use force layout for physics-based positioning (repulsion + attraction)
  // This gives natural spacing and prevents overlaps
  if (nodes.length > 1) {
    return applyForceLayout(nodes, edges);
  } else {
    return nodes; // Single node, no layout needed
  }
}

