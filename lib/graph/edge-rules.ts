import { NodeType } from "@/lib/types/graph";

/**
 * Check if an edge connection is allowed
 */
export function isEdgeAllowed(fromType: NodeType, toType: NodeType): boolean {
  // Allowed edges:
  // - Evidence → Validation
  // - Validation → Claim
  // - Evidence → Claim
  // - Validation → Evidence (evidence-of-validation)

  if (fromType === "evidence" && toType === "validation") return true;
  if (fromType === "validation" && toType === "claim") return true;
  if (fromType === "evidence" && toType === "claim") return true;
  if (fromType === "validation" && toType === "evidence") return true;

  // Disallowed:
  // - Claim → Evidence
  // - Claim → Claim
  // - Everything else
  return false;
}

/**
 * Get edge type label for a connection
 */
export function getEdgeType(fromType: NodeType, toType: NodeType): string {
  if (fromType === "evidence" && toType === "validation") return "references";
  if (fromType === "validation" && toType === "claim") return "validates";
  if (fromType === "evidence" && toType === "claim") return "includes";
  if (fromType === "validation" && toType === "evidence") return "evidence-of-validation";
  return "references";
}

