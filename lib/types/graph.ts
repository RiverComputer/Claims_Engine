export type NodeType = "evidence" | "validation" | "claim" | "claim_root";
export type NodeStatus = "draft" | "committed";

export interface EvidenceData {
  title: string;
  content: string;
  shortDescription?: string;
  activity?: string;
  fileRef?: string; // File reference URL (e.g., /api/files/[id])
  color?: string; // Optional custom node color (hex)
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  units?: string;
  createdAt: string;
}

export interface ValidationData {
  shortSummary: string;
  validatorNames: string[];
  validationType: string;
  evidenceCID: string[];
  color?: string; // Optional custom node color (hex)
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  createdAt: string;
}

export interface ClaimData {
  title: string;
  shortDescription: string;
  evidenceCID: string[];
  validationCID: string[];
  image?: string;
  project?: string;
  color?: string; // Optional custom node color (hex)
  createdAt: string;
}

export type NodeData = EvidenceData | ValidationData | ClaimData;

export interface GraphNode {
  id: string;
  type: NodeType;
  status: NodeStatus;
  position: { x: number; y: number };
  data: NodeData;
  cid?: string;
  attestationUID?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  locked: boolean;
}

