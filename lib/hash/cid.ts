import { createHash } from "crypto";

/**
 * Canonicalize a JSON object by sorting keys recursively
 */
function canonicalize(obj: any): string {
  if (Array.isArray(obj)) {
    return JSON.stringify(obj.map(canonicalize));
  }
  if (obj !== null && typeof obj === "object") {
    const sorted: any = {};
    Object.keys(obj)
      .sort()
      .forEach((key) => {
        sorted[key] = obj[key];
      });
    return JSON.stringify(sorted, Object.keys(sorted).sort());
  }
  return JSON.stringify(obj);
}

/**
 * Compute deterministic CID from canonicalized payload
 * Format: cid:sha256:<hex>
 */
export function computeCID(payload: object): string {
  const canonical = JSON.stringify(canonicalize(payload));
  const hash = createHash("sha256").update(canonical, "utf8").digest("hex");
  return `cid:sha256:${hash}`;
}

/**
 * Generate fake attestation UID from CID
 * Format: uid_mock_<hexprefix>
 */
export function generateMockUID(cid: string): string {
  const hash = createHash("sha256").update(cid).digest("hex");
  return `uid_mock_${hash.substring(0, 16)}`;
}

