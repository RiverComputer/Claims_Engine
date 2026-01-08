import { NodeType, NodeData, GraphNode, GraphEdge } from "@/lib/types/graph";
import { EvidenceSchema, ValidationSchema, ClaimSchema } from "@/lib/schemas";

export interface CommitValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate that a node can be committed
 */
export function validateCommit(
  node: GraphNode,
  edges: GraphEdge[]
): CommitValidationResult {
  const errors: string[] = [];

  // Validate payload against schema
  try {
    switch (node.type) {
      case "evidence":
        EvidenceSchema.parse(node.data);
        break;
      case "validation":
        ValidationSchema.parse(node.data);
        // Check evidenceCID references
        const validationData = node.data as any;
        if (validationData.evidenceCID && validationData.evidenceCID.length === 0) {
          errors.push("Validation must reference at least one Evidence");
        }
        break;
      case "claim":
        ClaimSchema.parse(node.data);
        // Check evidenceCID and validationCID references
        const claimData = node.data as any;
        if (!claimData.evidenceCID || claimData.evidenceCID.length === 0) {
          errors.push("Claim must reference at least one Evidence");
        }
        if (!claimData.validationCID || claimData.validationCID.length === 0) {
          errors.push("Claim must reference at least one Validation");
        }
        break;
    }
  } catch (error: any) {
    if (error.errors) {
      errors.push(...error.errors.map((e: any) => e.message));
    } else {
      errors.push(error.message || "Validation failed");
    }
  }

  // Check edge requirements
  if (node.type === "validation") {
    const validationData = node.data as any;
    const evidenceCIDs = validationData.evidenceCID || [];
    const connectedEvidence = edges.filter(
      (e) => e.target === node.id && e.type === "references"
    );
    if (connectedEvidence.length === 0 && evidenceCIDs.length === 0) {
      errors.push("Validation must have at least one Evidence reference (connect an Evidence node)");
    }
  }

  if (node.type === "claim") {
    const claimData = node.data as any;
    const hasEvidence = edges.some((e) => e.target === node.id && e.type === "includes");
    const hasValidation = edges.some((e) => e.target === node.id && e.type === "validates");
    
    if (!hasEvidence && (!claimData.evidenceCID || claimData.evidenceCID.length === 0)) {
      errors.push("Claim must have at least one Evidence reference (connect an Evidence node)");
    }
    if (!hasValidation && (!claimData.validationCID || claimData.validationCID.length === 0)) {
      errors.push("Claim must have at least one Validation reference (connect a Validation node)");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

