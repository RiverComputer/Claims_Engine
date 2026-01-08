import { GraphNode } from "@/lib/types/graph";

export interface CommitResult {
  cid: string;
  attestationUID: string;
  metadata?: object;
}

export interface CommitAdapter {
  commit(node: GraphNode, payload: object): Promise<CommitResult>;
}

