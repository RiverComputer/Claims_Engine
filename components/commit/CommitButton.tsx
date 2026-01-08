"use client";

import React, { useState } from "react";
import { NodeType } from "@/lib/types/graph";

interface CommitButtonProps {
  nodeId: string;
  projectId: string;
  nodeType: NodeType;
  status: string;
}

export function CommitButton({ nodeId, projectId, nodeType, status }: CommitButtonProps) {
  const [isCommitting, setIsCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCommit = async () => {
    if (status === "committed") {
      alert("Node is already committed");
      return;
    }

    setIsCommitting(true);
    setError(null);

    try {
      const response = await fetch("/api/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodeId, projectId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to commit");
      }

      const result = await response.json();
      alert(`Node committed!\nCID: ${result.cid}\nUID: ${result.attestationUID}`);
      window.location.reload(); // Refresh to show updated status
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsCommitting(false);
    }
  };

  if (status === "committed") {
    return (
      <div className="text-sm text-green-600 font-medium">
        ✓ Committed
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleCommit}
        disabled={isCommitting}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isCommitting ? "Committing..." : "Commit Node"}
      </button>
      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}

