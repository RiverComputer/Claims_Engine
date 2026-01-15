import { NodeType } from "@/lib/types/graph";

/**
 * Check if an edge connection is allowed
 */
export function isEdgeAllowed(fromType: NodeType, toType: NodeType): boolean {
  // Allowed edges:
  // - Evidence → Validation
  // - Validation → Claim (including claim_root)
  // - Evidence → Claim (including claim_root)
  // - Validation → Evidence (evidence-of-validation)
  // - Validation → Validation (validation-of-validation)
  // - Claim → Claim (including claim_root) - for claim hierarchies

  if (fromType === "evidence" && toType === "validation") return true;
  if (fromType === "validation" && (toType === "claim" || toType === "claim_root")) return true;
  if (fromType === "evidence" && (toType === "claim" || toType === "claim_root")) return true;
  if (fromType === "validation" && toType === "evidence") return true;
  if (fromType === "validation" && toType === "validation") return true;
  if ((fromType === "claim" || fromType === "claim_root") && (toType === "claim" || toType === "claim_root")) return true;

  // Disallowed:
  // - Claim → Evidence
  // - Everything else
  return false;
}

/**
 * Get edge type label for a connection
 */
export function getEdgeType(fromType: NodeType, toType: NodeType): string {
  if (fromType === "evidence" && toType === "validation") return "references";
  if (fromType === "validation" && (toType === "claim" || toType === "claim_root")) return "validates";
  if (fromType === "evidence" && (toType === "claim" || toType === "claim_root")) return "includes";
  if (fromType === "validation" && toType === "evidence") return "evidence-of-validation";
  if (fromType === "validation" && toType === "validation") return "validates";
  if ((fromType === "claim" || fromType === "claim_root") && (toType === "claim" || toType === "claim_root")) return "contains";
  return "references";
}

