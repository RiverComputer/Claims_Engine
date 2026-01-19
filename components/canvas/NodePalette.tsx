"use client";

import React from "react";
import { NodeType } from "@/lib/types/graph";

interface NodePaletteProps {
  onAddNode: (type: NodeType) => void;
}

export function NodePalette({ onAddNode }: NodePaletteProps) {
  return (
    <div className="apple-card">
      <div className="text-sm font-semibold mb-4 text-gray-900">Add Node</div>
      <div className="space-y-2.5">
        <button
          onClick={() => onAddNode("evidence")}
          className="w-full apple-button text-left flex items-center gap-3 px-4 py-3 hover:bg-blue-50 hover:border-blue-200"
        >
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <span className="text-sm font-medium">Evidence</span>
        </button>
        <button
          onClick={() => onAddNode("validation")}
          className="w-full apple-button text-left flex items-center gap-3 px-4 py-3 hover:bg-green-50 hover:border-green-200"
        >
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-sm font-medium">Validation</span>
        </button>
        <button
          onClick={() => onAddNode("claim")}
          className="w-full apple-button text-left flex items-center gap-3 px-4 py-3 hover:bg-purple-50 hover:border-purple-200"
        >
          <div className="w-2 h-2 rounded-full bg-purple-500"></div>
          <span className="text-sm font-medium">Claim</span>
        </button>
        <button
          onClick={() => onAddNode("shape")}
          className="w-full apple-button text-left flex items-center gap-3 px-4 py-3 hover:bg-slate-50 hover:border-slate-200"
        >
          <div className="w-2 h-2 rounded-sm bg-slate-400"></div>
          <span className="text-sm font-medium">Shape</span>
        </button>
        <button
          onClick={() => onAddNode("text")}
          className="w-full apple-button text-left flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 hover:border-indigo-200"
        >
          <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
          <span className="text-sm font-medium">Text</span>
        </button>
      </div>
    </div>
  );
}

