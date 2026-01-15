/**
 * Classify documents into 4 claim types:
 * 1. Information Gathering - Field reports, technical reports, data reports
 * 2. Kinship Gathering - Meetings, dialogues, FGD/KII transcripts, attendance
 * 3. Governance Gathering - Bylaws, organizational documents
 * 4. Intervention - Action documentation (future)
 */

export type ClaimType = "information-gathering" | "kinship-gathering" | "governance-gathering" | "intervention";

export interface ClassificationResult {
  claimType: ClaimType;
  confidence: "high" | "medium" | "low";
  indicators: string[];
}

/**
 * Classify a document based on filename, path, and content
 */
export function classifyDocument(
  filename: string,
  filepath: string,
  content?: string
): ClassificationResult {
  const lowerFilename = filename.toLowerCase();
  const lowerPath = filepath.toLowerCase();
  const lowerContent = content?.toLowerCase() || "";

  const indicators: string[] = [];
  let claimType: ClaimType = "information-gathering";
  let confidence: "high" | "medium" | "low" = "low";

  // Information Gathering patterns
  const infoGatheringPatterns = [
    "field data",
    "field report",
    "technical",
    "mapping report",
    "data report",
    "nalubaaga field",
    "technical mapping",
    "community map",
    "kmz",
    "mpkx",
  ];

  // Kinship Gathering patterns
  const kinshipPatterns = [
    "meeting",
    "dialogue",
    "dialog",
    "fgd",
    "kii",
    "attendance",
    "conference",
    "landsteward",
    "neighbourhood",
    "neighborhood",
    "stories",
    "transcript",
    "participant",
  ];

  // Governance Gathering patterns
  const governancePatterns = [
    "bylaw",
    "organizing committee",
    "governance",
    "nvc",
    "inaugural",
    "committee",
  ];

  // Intervention patterns (future)
  const interventionPatterns = [
    "intervention",
    "action",
    "clean",
    "clear",
    "remove",
    "pollutant",
  ];

  // Check filename and path
  const allText = `${lowerFilename} ${lowerPath} ${lowerContent}`;

  // Count matches for each category
  let infoMatches = 0;
  let kinshipMatches = 0;
  let governanceMatches = 0;
  let interventionMatches = 0;

  infoGatheringPatterns.forEach((pattern) => {
    if (allText.includes(pattern)) {
      infoMatches++;
      indicators.push(`Contains "${pattern}"`);
    }
  });

  kinshipPatterns.forEach((pattern) => {
    if (allText.includes(pattern)) {
      kinshipMatches++;
      indicators.push(`Contains "${pattern}"`);
    }
  });

  governancePatterns.forEach((pattern) => {
    if (allText.includes(pattern)) {
      governanceMatches++;
      indicators.push(`Contains "${pattern}"`);
    }
  });

  interventionPatterns.forEach((pattern) => {
    if (allText.includes(pattern)) {
      interventionMatches++;
      indicators.push(`Contains "${pattern}"`);
    }
  });

  // Determine claim type based on matches
  const maxMatches = Math.max(
    infoMatches,
    kinshipMatches,
    governanceMatches,
    interventionMatches
  );

  if (maxMatches === 0) {
    // Default to information gathering if no clear match
    claimType = "information-gathering";
    confidence = "low";
  } else if (interventionMatches === maxMatches) {
    claimType = "intervention";
    confidence = interventionMatches >= 2 ? "high" : "medium";
  } else if (governanceMatches === maxMatches) {
    claimType = "governance-gathering";
    confidence = governanceMatches >= 2 ? "high" : "medium";
  } else if (kinshipMatches === maxMatches) {
    claimType = "kinship-gathering";
    confidence = kinshipMatches >= 2 ? "high" : "medium";
  } else {
    claimType = "information-gathering";
    confidence = infoMatches >= 2 ? "high" : "medium";
  }

  // Special case: FGD/KII transcripts are always kinship gathering
  if (lowerFilename.includes("fgd") || lowerFilename.includes("kii")) {
    claimType = "kinship-gathering";
    confidence = "high";
    indicators.push("FGD/KII transcript detected");
  }

  // Special case: Attendance lists are kinship gathering
  if (lowerFilename.includes("attendance") || lowerFilename.includes("participant")) {
    claimType = "kinship-gathering";
    confidence = "high";
    indicators.push("Attendance/participant list detected");
  }

  // Special case: Bylaws are governance gathering
  if (lowerFilename.includes("bylaw") || lowerPath.includes("bylaw")) {
    claimType = "governance-gathering";
    confidence = "high";
    indicators.push("Bylaws document detected");
  }

  // Special case: Technical/mapping reports are information gathering
  if (
    lowerFilename.includes("technical") ||
    lowerFilename.includes("mapping") ||
    lowerFilename.includes("field data")
  ) {
    claimType = "information-gathering";
    confidence = "high";
    indicators.push("Technical/mapping report detected");
  }

  return {
    claimType,
    confidence,
    indicators: [...new Set(indicators)], // Remove duplicates
  };
}

/**
 * Get display name for claim type
 */
export function getClaimTypeDisplayName(claimType: ClaimType): string {
  const names: Record<ClaimType, string> = {
    "information-gathering": "Information Gathering",
    "kinship-gathering": "Kinship Gathering",
    "governance-gathering": "Governance Gathering",
    intervention: "Intervention",
  };
  return names[claimType];
}

