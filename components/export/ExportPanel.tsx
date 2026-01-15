"use client";

import React from "react";

interface ExportPanelProps {
  projectId: string;
}

export function ExportPanel({ projectId }: ExportPanelProps) {
  return (
    <div className="apple-card">
      <div className="text-sm font-semibold mb-3 text-gray-900">Export</div>
      <div className="text-xs text-gray-600 mb-4 leading-relaxed">
        Export committed nodes and CIDs (placeholder)
      </div>
      <button
        className="w-full apple-button text-sm disabled:opacity-50"
        disabled
      >
        Export (Coming Soon)
      </button>
    </div>
  );
}

