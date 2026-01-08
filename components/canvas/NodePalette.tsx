"use client";

import React from "react";
import { NodeType } from "@/lib/types/graph";

interface NodePaletteProps {
  onAddNode: (type: NodeType) => void;
}

export function NodePalette({ onAddNode }: NodePaletteProps) {
  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-4">
      <div className="text-sm font-semibold mb-3">Add Node</div>
      <div className="space-y-2">
        <button
          onClick={() => onAddNode("evidence")}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          + Evidence
        </button>
        <button
          onClick={() => onAddNode("validation")}
          className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
        >
          + Validation
        </button>
        <button
          onClick={() => onAddNode("claim")}
          className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
        >
          + Claim
        </button>
      </div>
    </div>
  );
}

