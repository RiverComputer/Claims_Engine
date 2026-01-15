/**
 * Root Claim-of-Claims Node Management
 * Handles creation, lifecycle, and edge management for the root node
 */

import { Node, Edge } from "reactflow";
import { ClaimData } from "@/lib/types/graph";

export const ROOT_NODE_ID = "claim_root";

/**
 * Check if a node is the root node
 */
export function isRootNode(node: Node): boolean {
  return node.id === ROOT_NODE_ID || node.type === "claim_root";
}

/**
 * Create root node data
 */
export function createRootNodeData(): ClaimData {
  return {
    title: "Root Claim",
    shortDescription: "The root claim-of-claims that holds all claims together",
    evidenceCID: [],
    validationCID: [],
    createdAt: new Date().toISOString(),
  };
}

/**
 * Create root node React Flow node
 */
export function createRootNode(projectId: string, position?: { x: number; y: number }): Node {
  return {
    id: ROOT_NODE_ID,
    type: "claim_root",
    position: position || { x: 0, y: -320 },
    data: {
      ...createRootNodeData(),
      type: "claim_root",
      status: "draft",
      label: "Root Claim",
    },
  };
}

/**
 * Ensure root node exists in the graph
 * Returns the root node if it exists, or creates it if missing
 * If root node exists but has wrong ID, updates it to use ROOT_NODE_ID
 */
export function ensureRootNode(
  nodes: Node[],
  projectId: string
): { rootNode: Node; nodes: Node[] } {
  const existingRoot = nodes.find((n) => isRootNode(n));
  
  if (existingRoot) {
    // If root node exists but has wrong ID, update it to use ROOT_NODE_ID
    // This preserves the node's data (including user's custom title) but fixes the ID
    if (existingRoot.id !== ROOT_NODE_ID) {
      console.log("Root node found with ID", existingRoot.id, "updating to use ROOT_NODE_ID");
      const fixedRootNode: Node = {
        ...existingRoot,
        id: ROOT_NODE_ID, // Fix the ID to match ROOT_NODE_ID
      };
      // Replace the old root node with the fixed one
      const updatedNodes = nodes.map(n => n.id === existingRoot.id ? fixedRootNode : n);
      return { rootNode: fixedRootNode, nodes: updatedNodes };
    }
    return { rootNode: existingRoot, nodes };
  }
  
  // Create root node with default data only if it doesn't exist
  const rootNode = createRootNode(projectId);
  return {
    rootNode,
    nodes: [...nodes, rootNode],
  };
}

/**
 * Get all claim nodes (excluding root)
 */
export function getClaimNodes(nodes: Node[]): Node[] {
  return nodes.filter((n) => n.type === "claim" && !isRootNode(n));
}

/**
 * Create invisible root links for force layout
 * These are not stored as edges, but used in the simulation
 */
export function getRootLinks(nodes: Node[], rootNodeId: string): Edge[] {
  const claimNodes = getClaimNodes(nodes);
  
  return claimNodes.map((claim) => ({
    id: `root-link-${claim.id}`,
    source: rootNodeId,
    target: claim.id,
    type: "root-link",
    // Mark as invisible/transparent for rendering
    style: { opacity: 0 },
    hidden: true,
  }));
}

