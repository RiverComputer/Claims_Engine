"use client";

import React from "react";

interface ExportPanelProps {
  projectId: string;
}

export function ExportPanel({ projectId }: ExportPanelProps) {
  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-4">
      <div className="text-sm font-semibold mb-3">Export</div>
      <div className="text-xs text-gray-500 mb-4">
        Export committed nodes and CIDs (placeholder)
      </div>
      <button
        className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
        disabled
      >
        Export (Coming Soon)
      </button>
    </div>
  );
}

