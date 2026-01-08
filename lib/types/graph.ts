export type NodeType = "evidence" | "validation" | "claim";
export type NodeStatus = "draft" | "committed";

export interface EvidenceData {
  title: string;
  content: string;
  shortDescription?: string;
  activity?: string;
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

