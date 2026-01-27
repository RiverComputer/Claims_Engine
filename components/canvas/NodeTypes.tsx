"use client";

import React, { useEffect, useState } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { NodeType, NodeStatus } from "@/lib/types/graph";

interface CustomNodeData {
  type: NodeType;
  status: NodeStatus;
  label: string;
  cid?: string;
  content?: string; // For Evidence nodes - may contain image data URL
  image?: string; // For Claim nodes - may contain image data URL
  color?: string; // Optional custom node color (hex)
  fileRef?: string;
  thumbnailRef?: string;
  imageRotation?: number;
  imageCrop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  imageAspectRatio?: number;
  _lite?: boolean;
  shape?: "rectangle" | "ellipse";
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  borderRadius?: number;
  text?: string;
  fontSize?: number;
  align?: "left" | "center" | "right";
}

const nodeStyles = {
  evidence: {
    bg: "bg-white",
    border: "border-blue-200",
    text: "text-gray-900",
    accent: "text-blue-600",
  },
  validation: {
    bg: "bg-white",
    border: "border-green-200",
    text: "text-gray-900",
    accent: "text-green-600",
  },
  claim: {
    bg: "bg-white",
    border: "border-purple-200",
    text: "text-gray-900",
    accent: "text-purple-600",
  },
  claim_root: {
    bg: "bg-gradient-to-br from-purple-50 to-purple-100",
    border: "border-purple-400",
    text: "text-gray-900",
    accent: "text-purple-700",
  },
};

const baseNodeStyle = "rounded-2xl border p-5 min-w-[180px] shadow-sm hover:shadow-md transition-all duration-200 bg-white backdrop-blur-sm";

function withThumb(fileRef: string, width = 400) {
  if (fileRef.includes("?")) {
    return `${fileRef}&thumb=1&w=${width}`;
  }
  return `${fileRef}?thumb=1&w=${width}`;
}

export function EvidenceNode({ id, data }: NodeProps<CustomNodeData>) {
  const style = nodeStyles.evidence;
  const isCommitted = data.status === "committed";
  const nodeColor = data.color || "rgb(37, 99, 235)";
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const rotation = Number.isFinite(data.imageRotation) ? (data.imageRotation as number) : 0;
  const aspectRatio =
    Number.isFinite(data.imageAspectRatio) && (data.imageAspectRatio as number) > 0
      ? (data.imageAspectRatio as number)
      : null;
  
  // Check if content is an image (data URL)
  const hasDataUrlImage = data.content && data.content.startsWith("data:image");
  const dataUrlImage =
    hasDataUrlImage && data.content && data.content.length < 200000 ? data.content : null;
  
  const fileRefImage = data.thumbnailRef || (data.fileRef ? withThumb(data.fileRef) : null);
  
  // Prefer fileRef thumbnails to avoid large data URLs
  const imageUrl = fileRefImage || dataUrlImage || thumbnailUrl;

  useEffect(() => {
    let cancelled = false;

    if (imageUrl || !data._lite) {
      return () => {
        cancelled = true;
      };
    }

    fetch(`/api/nodes/${id}?thumbnail=1`)
      .then(async (response) => {
        if (!response.ok) return null;
        const payload = await response.json();
        return typeof payload.thumbnail === "string" ? payload.thumbnail : null;
      })
      .then((thumbnail) => {
        if (!cancelled && thumbnail) {
          setThumbnailUrl(thumbnail);
        }
      })
      .catch(() => {
        // Ignore thumbnail errors
      });

    return () => {
      cancelled = true;
    };
  }, [data._lite, id, imageUrl]);

  return (
    <div
      className={`${baseNodeStyle} ${style.border} ${style.text} cursor-pointer border-l-4`}
      style={{ borderLeftColor: nodeColor, borderColor: nodeColor }}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#007aff', width: '8px', height: '8px', border: '2px solid white' }} />
      <div className={`font-semibold text-xs mb-2 ${style.accent} uppercase tracking-wide`}>Evidence</div>
      {imageUrl && (
        <div className="mb-3 -mx-1">
          <div
            className="w-full overflow-hidden rounded-xl bg-gray-100"
            style={aspectRatio ? { aspectRatio } : { height: "6rem" }}
          >
            <img 
              src={imageUrl} 
              alt="Evidence thumbnail" 
              className="w-full h-full object-cover"
              style={rotation ? { transform: `rotate(${rotation}deg)` } : undefined}
              loading="lazy"
              decoding="async"
              onError={(e) => {
                // Hide image if it fails to load
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        </div>
      )}
      <div className="text-sm font-medium text-gray-900 truncate mb-1">{data.label || "Untitled Evidence"}</div>
      {isCommitted && (
        <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
          <span className="text-green-600">✓</span> Committed
        </div>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: '#007aff', width: '8px', height: '8px', border: '2px solid white' }} />
    </div>
  );
}

export function ValidationNode({ data }: NodeProps<CustomNodeData>) {
  const style = nodeStyles.validation;
  const isCommitted = data.status === "committed";
  const nodeColor = data.color || "rgb(34, 197, 94)";
  const rawValidators = (data as any).validatorNames ?? (data as any).validators ?? [];
  const validatorList = Array.isArray(rawValidators)
    ? rawValidators
    : typeof rawValidators === "string"
      ? rawValidators.split(",").map((v) => v.trim()).filter(Boolean)
      : [];
  const validatorNames = validatorList.length > 0 ? validatorList.join(", ") : "";

  return (
    <div
      className={`${baseNodeStyle} ${style.border} ${style.text} cursor-pointer border-l-4`}
      style={{ borderLeftColor: nodeColor, borderColor: nodeColor }}
    >
      <Handle
        type="target"
        id="input"
        position={Position.Top}
        style={{ background: "#007aff", width: "8px", height: "8px", border: "2px solid white", left: "35%" }}
      />
      <Handle
        type="target"
        id="benchmark"
        position={Position.Top}
        style={{ background: "#16a34a", width: "8px", height: "8px", border: "2px solid white", left: "65%" }}
      />
      <div className={`font-semibold text-xs mb-2 ${style.accent} uppercase tracking-wide`}>Validation</div>
      <div className="text-[10px] text-gray-500 mb-2">Inputs: Evidence | Benchmark</div>
      <div className="text-sm font-medium text-gray-900 truncate mb-1">{data.label || "Untitled Validation"}</div>
      {validatorNames && (
        <div className="text-xs text-gray-600 line-clamp-2 break-words">Validator: {validatorNames}</div>
      )}
      {isCommitted && (
        <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
          <span className="text-green-600">✓</span> Committed
        </div>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: '#007aff', width: '8px', height: '8px', border: '2px solid white' }} />
    </div>
  );
}

export function ClaimNode({ data }: NodeProps<CustomNodeData>) {
  const style = nodeStyles.claim;
  const isCommitted = data.status === "committed";
  const nodeColor = data.color || "rgb(168, 85, 247)";
  
  // Check if image is provided
  const hasImage = data.image && data.image.startsWith("data:image");
  const imageUrl = hasImage ? data.image : null;

  return (
    <div
      className={`${baseNodeStyle} ${style.border} ${style.text} cursor-pointer border-l-4`}
      style={{ borderLeftColor: nodeColor, borderColor: nodeColor }}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#007aff', width: '8px', height: '8px', border: '2px solid white' }} />
      <div className={`font-semibold text-xs mb-2 ${style.accent} uppercase tracking-wide`}>Claim</div>
      {imageUrl && (
        <div className="mb-3 -mx-1">
          <img 
            src={imageUrl} 
            alt="Claim thumbnail" 
            className="w-full h-24 object-cover rounded-xl"
          />
        </div>
      )}
      <div className="text-sm font-medium text-gray-900 truncate mb-1">{data.label || "Untitled Claim"}</div>
      {isCommitted && (
        <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
          <span className="text-green-600">✓</span> Committed
        </div>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: '#007aff', width: '8px', height: '8px', border: '2px solid white' }} />
    </div>
  );
}

export function ShapeNode({ data, selected }: NodeProps<CustomNodeData>) {
  const width = data.width ?? 220;
  const height = data.height ?? 140;
  const fill = data.fill || "rgba(148, 163, 184, 0.2)";
  const stroke = data.stroke || "rgba(71, 85, 105, 0.6)";
  const strokeWidth = data.strokeWidth ?? 2;
  const borderRadius = data.shape === "ellipse" ? 9999 : data.borderRadius ?? 16;

  return (
    <div
      style={{
        width,
        height,
        background: fill,
        border: `${strokeWidth}px solid ${stroke}`,
        borderRadius,
      }}
      className={`transition-shadow ${selected ? "shadow-md" : "shadow-sm"}`}
    />
  );
}

export function TextNode({ data, selected }: NodeProps<CustomNodeData>) {
  const width = data.width ?? 220;
  const height = data.height ?? 120;
  const fontSize = data.fontSize ?? 16;
  const color = data.color || "#111827";
  const align = data.align || "left";
  const text = data.text || "Text";

  return (
    <div
      style={{
        width,
        height,
        color,
        fontSize,
        textAlign: align,
        background: "transparent",
        border: "none",
      }}
      className={`p-2 whitespace-pre-wrap break-words ${
        selected ? "outline outline-2 outline-indigo-200 rounded-md" : ""
      }`}
    >
      {text}
    </div>
  );
}

// Root Claim Node - special styling for the root claim-of-claims
export function RootClaimNode({ data, selected }: NodeProps<CustomNodeData>) {
  const nodeColor = data.color || "rgb(168, 85, 247)";
  return (
    <div
      className={`bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-400 rounded-2xl shadow-lg p-4 min-w-[200px] transition-all ${
        selected ? "ring-2 ring-purple-500 ring-offset-2" : ""
      }`}
      style={{ borderColor: nodeColor }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="text-purple-700 font-bold text-lg">🌳</div>
        <div className="text-gray-900 font-semibold text-sm">
          {data.label || "Root Claim"}
        </div>
      </div>
      {data.cid && (
        <div className="text-xs text-gray-500 font-mono truncate mt-1">
          {data.cid.slice(0, 16)}...
        </div>
      )}
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}

