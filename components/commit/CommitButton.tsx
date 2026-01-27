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
  const [commitMethod, setCommitMethod] = useState<string>("");

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
      body: JSON.stringify({ nodeId, projectId, commitMethod }),
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
      <div className="text-sm text-green-600 font-medium flex items-center gap-2">
        <span>✓</span> Committed
      </div>
    );
  }

  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-2">
        Commit method
      </label>
      <select
        value={commitMethod}
        onChange={(e) => setCommitMethod(e.target.value)}
        className="apple-input text-sm mb-3"
      >
        <option value="">Select a method…</option>
        <option value="eas_attestation">EAS Attestation</option>
        <option value="regen_ledger">Regen Ledger</option>
        <option value="other">Something else</option>
      </select>
      <button
        onClick={handleCommit}
        disabled={isCommitting || !commitMethod}
        className="w-full apple-button apple-button-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#007aff]"
      >
        {isCommitting ? "Committing..." : "Commit Node"}
      </button>
      {!commitMethod && (
        <div className="mt-2 text-xs text-gray-500">
          Select a commit method to enable committing.
        </div>
      )}
      {error && (
        <div className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl border border-red-200">
          {error}
        </div>
      )}
    </div>
  );
}

