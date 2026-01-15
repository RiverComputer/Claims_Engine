/**
 * Force Layout Engine v3 - Visual Ecology
 * Pure d3-force layout engine for Evidence → Validation → Claim graph structure
 */

import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCollide,
  forceCenter,
  forceX,
  forceY,
  Simulation,
  SimulationNodeDatum,
  SimulationLinkDatum,
} from "d3-force";
import { Node, Edge } from "reactflow";

export type NodeKind = "evidence" | "validation" | "claim" | "claim_root";
export type LinkKind = "EV" | "VC" | "EC" | "VE" | "ROOT" | "CC";

export interface SimNode extends SimulationNodeDatum {
  id: string;
  kind: NodeKind;
  r: number; // Collision radius
  originalId?: string; // Map back to React Flow node
}

export interface SimLink extends SimulationLinkDatum<SimNode> {
  source: string | SimNode;
  target: string | SimNode;
  kind: LinkKind;
  distance: number;
  strength: number;
}

export interface ForceConfig {
  // Collision
  collisionPadding: number;
  collisionIterations: number;
  
  // Link forces
  linkDistanceEV: number; // Evidence → Validation
  linkStrengthEV: number;
  linkDistanceVC: number; // Validation → Claim
  linkStrengthVC: number;
  linkDistanceEC: number; // Evidence → Claim (optional)
  linkStrengthEC: number;
  linkDistanceROOT: number; // Root → Claim
  linkStrengthROOT: number;
  linkDistanceCC: number; // Claim → Claim
  linkStrengthCC: number;
  
  // Repulsion (charge)
  chargeEvidence: number;
  chargeValidation: number;
  chargeClaim: number;
  chargeRoot: number;
  
  // Layering (vertical stratification)
  layerStrength: number;
  layerEvidenceY: number;
  layerValidationY: number;
  layerClaimY: number;
  layerRootY: number;
  
  // Centering
  centerX: number;
  centerY: number;
  centerStrength: number;
  
  // Simulation
  alphaDecay: number;
  alphaTarget: number;
  velocityDecay: number;
}

export const DEFAULT_CONFIG: ForceConfig = {
  // Collision
  collisionPadding: 12,
  collisionIterations: 2,
  
  // Link forces
  linkDistanceEV: 80,
  linkStrengthEV: 0.9,
  linkDistanceVC: 140,
  linkStrengthVC: 0.7,
  linkDistanceEC: 220,
  linkStrengthEC: 0.2,
  linkDistanceROOT: 180,
  linkStrengthROOT: 0.12,
  linkDistanceCC: 160, // Claim-to-Claim: moderate distance for claim hierarchies
  linkStrengthCC: 0.5, // Moderate strength for claim relationships
  
  // Repulsion
  chargeEvidence: -250,
  chargeValidation: -120,
  chargeClaim: -80,
  chargeRoot: -20,
  
  // Layering
  layerStrength: 0.08,
  layerEvidenceY: 200,
  layerValidationY: 0,
  layerClaimY: -200,
  layerRootY: -320,
  
  // Centering
  centerX: 0,
  centerY: 0,
  centerStrength: 0.1,
  
  // Simulation
  alphaDecay: 0.0228, // ~2-10 seconds to settle
  alphaTarget: 0,
  velocityDecay: 0.4,
};

/**
 * Get collision radius for a node kind
 */
export function getNodeRadius(kind: NodeKind): number {
  switch (kind) {
    case "evidence":
      return 40;
    case "validation":
      return 50;
    case "claim":
      return 60;
    case "claim_root":
      return 70;
    default:
      return 50;
  }
}

/**
 * Classify an edge based on source and target node kinds
 */
export function classifyEdge(sourceKind: NodeKind, targetKind: NodeKind): LinkKind {
  if (sourceKind === "evidence" && targetKind === "validation") return "EV";
  if (sourceKind === "validation" && (targetKind === "claim" || targetKind === "claim_root")) return "VC";
  if (sourceKind === "evidence" && (targetKind === "claim" || targetKind === "claim_root")) return "EC";
  if (sourceKind === "validation" && targetKind === "evidence") return "VE";
  if (sourceKind === "validation" && targetKind === "validation") return "VC"; // Treat V→V like V→C
  if (sourceKind === "claim_root" && targetKind === "claim") return "ROOT";
  if (sourceKind === "claim" && targetKind === "claim_root") return "ROOT";
  if ((sourceKind === "claim" || sourceKind === "claim_root") && (targetKind === "claim" || targetKind === "claim_root")) return "CC"; // Claim-to-Claim
  
  // Default fallback
  return "EV";
}

/**
 * Map React Flow nodes to simulation nodes
 */
export function mapToSimNodes(
  reactFlowNodes: Node[],
  existingSimNodes?: Map<string, SimNode>
): SimNode[] {
  return reactFlowNodes.map((node) => {
    const kind = (node.type as NodeKind) || "evidence";
    const existing = existingSimNodes?.get(node.id);
    
    // Calculate center position from React Flow node
    const nodeWidth = (node.width as number) || 200;
    const nodeHeight = (node.height as number) || 100;
    const centerX = node.position.x + nodeWidth / 2;
    const centerY = node.position.y + nodeHeight / 2;
    
    return {
      id: node.id,
      kind,
      r: getNodeRadius(kind),
      originalId: node.id,
      // CRITICAL: If node exists in simulation, preserve its exact position and velocity
      // This prevents nodes from jumping when graph updates
      x: existing?.x ?? centerX,
      y: existing?.y ?? centerY,
      // Preserve fixed position if it was pinned
      fx: existing?.fx ?? null,
      fy: existing?.fy ?? null,
      // Preserve velocity to maintain smooth motion
      vx: existing?.vx ?? 0,
      vy: existing?.vy ?? 0,
    };
  });
}

/**
 * Map React Flow edges to simulation links
 */
export function mapToSimLinks(
  reactFlowNodes: Node[],
  reactFlowEdges: Edge[],
  rootNodeId?: string
): SimLink[] {
  const nodeMap = new Map(reactFlowNodes.map((n) => [n.id, n]));
  const links: SimLink[] = [];
  
  // Add explicit edges
  for (const edge of reactFlowEdges) {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);
    
    if (!sourceNode || !targetNode) continue;
    
    const sourceKind = (sourceNode.type as NodeKind) || "evidence";
    const targetKind = (targetNode.type as NodeKind) || "evidence";
    const kind = classifyEdge(sourceKind, targetKind);
    
    const config = DEFAULT_CONFIG;
    let distance: number;
    let strength: number;
    
    switch (kind) {
      case "EV":
      case "VE":
        distance = config.linkDistanceEV;
        strength = config.linkStrengthEV;
        break;
      case "VC":
        distance = config.linkDistanceVC;
        strength = config.linkStrengthVC;
        break;
      case "EC":
        distance = config.linkDistanceEC;
        strength = config.linkStrengthEC;
        break;
      case "ROOT":
        distance = config.linkDistanceROOT;
        strength = config.linkStrengthROOT;
        break;
      case "CC":
        distance = config.linkDistanceCC;
        strength = config.linkStrengthCC;
        break;
      default:
        distance = config.linkDistanceEV;
        strength = config.linkStrengthEV;
    }
    
    links.push({
      source: edge.source,
      target: edge.target,
      kind,
      distance,
      strength,
    });
  }
  
  // Add invisible root links if root node exists
  if (rootNodeId) {
    const rootNode = nodeMap.get(rootNodeId);
    if (rootNode) {
      // Link root to all claim nodes (not claim_root itself)
      for (const node of reactFlowNodes) {
        if (node.type === "claim" && node.id !== rootNodeId) {
          links.push({
            source: rootNodeId,
            target: node.id,
            kind: "ROOT",
            distance: DEFAULT_CONFIG.linkDistanceROOT,
            strength: DEFAULT_CONFIG.linkStrengthROOT,
          });
        }
      }
    }
  }
  
  return links;
}

/**
 * Create and configure the force simulation
 */
export function createSimulation(
  simNodes: SimNode[],
  simLinks: SimLink[],
  config: ForceConfig = DEFAULT_CONFIG,
  rootNodeId?: string
): Simulation<SimNode, SimLink> {
  const simulation = forceSimulation<SimNode>(simNodes)
    .alphaDecay(config.alphaDecay)
    .alphaTarget(config.alphaTarget)
    .velocityDecay(config.velocityDecay);
  
  // Collision force
  simulation.force(
    "collision",
    forceCollide<SimNode>()
      .radius((d) => d.r + config.collisionPadding)
      .iterations(config.collisionIterations)
      .strength(0.9)
  );
  
  // Link force
  const linkForce = forceLink<SimNode, SimLink>(simLinks)
    .id((d) => (typeof d === "string" ? d : d.id))
    .distance((d) => d.distance)
    .strength((d) => d.strength);
  
  simulation.force("link", linkForce);
  
  // Repulsion (many-body)
  simulation.force(
    "charge",
    forceManyBody<SimNode>()
      .strength((d) => {
        switch (d.kind) {
          case "evidence":
            return config.chargeEvidence;
          case "validation":
            return config.chargeValidation;
          case "claim":
            return config.chargeClaim;
          case "claim_root":
            return config.chargeRoot;
          default:
            return -100;
        }
      })
      .distanceMax(600)
  );
  
  // Layering (vertical stratification)
  simulation.force(
    "layer",
    forceY<SimNode>()
      .strength(config.layerStrength)
      .y((d) => {
        switch (d.kind) {
          case "evidence":
            return config.layerEvidenceY;
          case "validation":
            return config.layerValidationY;
          case "claim":
            return config.layerClaimY;
          case "claim_root":
            return config.layerRootY;
          default:
            return 0;
        }
      })
  );
  
  // Centering
  simulation.force(
    "center",
    forceCenter(config.centerX, config.centerY).strength(config.centerStrength)
  );
  
  return simulation;
}

/**
 * Update React Flow nodes with simulation positions
 */
export function syncToReactFlow(
  simNodes: SimNode[],
  reactFlowNodes: Node[]
): Node[] {
  const simNodeMap = new Map(simNodes.map((n) => [n.id, n]));
  
  return reactFlowNodes.map((node) => {
    const simNode = simNodeMap.get(node.id);
    if (!simNode || simNode.x === undefined || simNode.y === undefined) {
      return node;
    }
    
    // Convert from center coordinates to top-left
    const nodeWidth = (node.width as number) || 200;
    const nodeHeight = (node.height as number) || 100;
    
    return {
      ...node,
      position: {
        x: simNode.x - nodeWidth / 2,
        y: simNode.y - nodeHeight / 2,
      },
    };
  });
}

