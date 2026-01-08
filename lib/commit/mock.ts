import { CommitAdapter, CommitResult } from "./adapter";
import { GraphNode } from "@/lib/types/graph";
import { computeCID, generateMockUID } from "@/lib/hash/cid";

/**
 * Mock commit adapter for MVP
 * - Generates deterministic CID from payload
 * - Generates fake attestation UID
 * - Simulates async delay
 */
export class MockAdapter implements CommitAdapter {
  async commit(node: GraphNode, payload: object): Promise<CommitResult> {
    // Simulate async delay (100-300ms)
    await new Promise((resolve) => setTimeout(resolve, 150 + Math.random() * 200));

    // Compute deterministic CID
    const cid = computeCID(payload);

    // Generate fake UID
    const attestationUID = generateMockUID(cid);

    return {
      cid,
      attestationUID,
      metadata: {
        adapter: "mock",
        timestamp: new Date().toISOString(),
      },
    };
  }
}

