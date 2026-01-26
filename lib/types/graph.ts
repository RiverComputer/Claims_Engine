export type NodeType = "evidence" | "validation" | "claim" | "claim_root" | "shape" | "text";
export type NodeStatus = "draft" | "committed";

export interface EvidenceData {
  title: string;
  content: string;
  shortDescription?: string;
  activity?: string;
  fileRef?: string; // File reference URL (e.g., /api/files/[id])
  thumbnailRef?: string; // Thumbnail URL (blob or /api/files?id)
  imageRotation?: number; // Degrees (0/90/180/270)
  imageCrop?: {
    x: number; // 0..1
    y: number; // 0..1
    width: number; // 0..1
    height: number; // 0..1
  };
  imageAspectRatio?: number; // width / height
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

export interface ShapeData {
  shape: "rectangle" | "ellipse";
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  borderRadius?: number;
  createdAt: string;
}

export interface TextData {
  text: string;
  fontSize?: number;
  color?: string;
  width?: number;
  height?: number;
  align?: "left" | "center" | "right";
  createdAt: string;
}

export type NodeData = EvidenceData | ValidationData | ClaimData | ShapeData | TextData;

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

