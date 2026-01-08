"use client";

import React from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { NodeType, NodeStatus } from "@/lib/types/graph";

interface CustomNodeData {
  type: NodeType;
  status: NodeStatus;
  label: string;
  cid?: string;
  content?: string; // For Evidence nodes - may contain image data URL
  image?: string; // For Claim nodes - may contain image data URL
}

const nodeStyles = {
  evidence: {
    bg: "bg-blue-100",
    border: "border-blue-500",
    text: "text-blue-900",
  },
  validation: {
    bg: "bg-green-100",
    border: "border-green-500",
    text: "text-green-900",
  },
  claim: {
    bg: "bg-purple-100",
    border: "border-purple-500",
    text: "text-purple-900",
  },
};

const baseNodeStyle = "rounded-lg border-2 p-4 min-w-[150px] shadow-md";

export function EvidenceNode({ data }: NodeProps<CustomNodeData>) {
  const style = nodeStyles.evidence;
  const isCommitted = data.status === "committed";
  
  // Check if content is an image (data URL)
  const hasImage = data.content && data.content.startsWith("data:image");
  const imageUrl = hasImage ? data.content : null;

  return (
    <div 
      className={`${baseNodeStyle} ${style.bg} ${style.border} ${style.text} cursor-pointer`}
      onClick={(e) => {
        // Ensure click events propagate to React Flow
        e.stopPropagation();
      }}
    >
      <Handle type="target" position={Position.Top} />
      <div className="font-bold text-sm mb-1">Evidence</div>
      {imageUrl && (
        <div className="mb-2">
          <img 
            src={imageUrl} 
            alt="Evidence thumbnail" 
            className="w-full h-20 object-cover rounded border border-gray-300"
          />
        </div>
      )}
      <div className="text-xs truncate font-medium">{data.label || "Untitled Evidence"}</div>
      {isCommitted && (
        <div className="text-xs mt-1 opacity-70">✓ Committed</div>
      )}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export function ValidationNode({ data }: NodeProps<CustomNodeData>) {
  const style = nodeStyles.validation;
  const isCommitted = data.status === "committed";

  return (
    <div 
      className={`${baseNodeStyle} ${style.bg} ${style.border} ${style.text} cursor-pointer`}
      onClick={(e) => {
        // Ensure click events propagate to React Flow
        e.stopPropagation();
      }}
    >
      <Handle type="target" position={Position.Top} />
      <div className="font-bold text-sm mb-1">Validation</div>
      <div className="text-xs truncate font-medium">{data.label || "Untitled Validation"}</div>
      {isCommitted && (
        <div className="text-xs mt-1 opacity-70">✓ Committed</div>
      )}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export function ClaimNode({ data }: NodeProps<CustomNodeData>) {
  const style = nodeStyles.claim;
  const isCommitted = data.status === "committed";
  
  // Check if image is provided
  const hasImage = data.image && data.image.startsWith("data:image");
  const imageUrl = hasImage ? data.image : null;

  return (
    <div 
      className={`${baseNodeStyle} ${style.bg} ${style.border} ${style.text} cursor-pointer`}
      onClick={(e) => {
        // Ensure click events propagate to React Flow
        e.stopPropagation();
      }}
    >
      <Handle type="target" position={Position.Top} />
      <div className="font-bold text-sm mb-1">Claim</div>
      {imageUrl && (
        <div className="mb-2">
          <img 
            src={imageUrl} 
            alt="Claim thumbnail" 
            className="w-full h-20 object-cover rounded border border-gray-300"
          />
        </div>
      )}
      <div className="text-xs truncate font-medium">{data.label || "Untitled Claim"}</div>
      {isCommitted && (
        <div className="text-xs mt-1 opacity-70">✓ Committed</div>
      )}
      {/* Claims don't have source handles (can't connect from them) */}
    </div>
  );
}

