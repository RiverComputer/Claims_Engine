"use client";

import React, { useState, useEffect, useRef } from "react";
import { Node } from "reactflow";
import { NodeType, NodeData } from "@/lib/types/graph";
import { EvidenceForm } from "./EvidenceForm";
import { ValidationForm } from "./ValidationForm";
import { ClaimForm } from "./ClaimForm";
import { CommitButton } from "../commit/CommitButton";

interface InspectorPanelProps {
  selectedNode: Node | null;
  onUpdateNode: (nodeId: string, data: NodeData) => void;
  projectId: string;
}

export function InspectorPanel({
  selectedNode,
  onUpdateNode,
  projectId,
}: InspectorPanelProps) {
  const [localData, setLocalData] = useState<NodeData | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const prevNodeIdRef = useRef<string | null>(null);
  const prevNodeDataRef = useRef<string | null>(null);

  // Reset local data when selected node changes
  useEffect(() => {
    if (selectedNode) {
      const nodeId = selectedNode.id;
      const nodeData = (selectedNode.data as any) || {};
      const nodeDataString = JSON.stringify(nodeData);
      
      // Only update if node ID or data actually changed
      if (nodeId === prevNodeIdRef.current && nodeDataString === prevNodeDataRef.current) {
        return; // No change, skip update
      }
      
      prevNodeIdRef.current = nodeId;
      prevNodeDataRef.current = nodeDataString;
      
      // Create a clean copy - copy ALL properties first, then remove only React Flow metadata
      const cleanData: any = { ...nodeData };
      
      // Store status separately before removing it (we need it for UI display)
      const nodeStatus = cleanData.status || "draft";
      
      // Remove only React Flow internal properties, keep all actual data
      delete cleanData.type; // React Flow node type
      delete cleanData.status; // Node status (draft/committed) - not part of form data, but we'll use it for UI
      delete cleanData.label; // Computed label - not stored
      // Keep cid and attestationUID for display, but don't make them editable
      
      // Ensure createdAt exists (required field)
      if (!cleanData.createdAt) {
        cleanData.createdAt = new Date().toISOString();
      }
      
      // Ensure arrays exist for fields that need them
      if (selectedNode.type === "validation" && !Array.isArray(cleanData.validatorNames)) {
        cleanData.validatorNames = cleanData.validatorNames || [];
      }
      if (selectedNode.type === "validation" && !Array.isArray(cleanData.evidenceCID)) {
        cleanData.evidenceCID = cleanData.evidenceCID || [];
      }
      if (selectedNode.type === "claim" || selectedNode.type === "claim_root") {
        if (!Array.isArray(cleanData.evidenceCID)) cleanData.evidenceCID = cleanData.evidenceCID || [];
        if (!Array.isArray(cleanData.validationCID)) cleanData.validationCID = cleanData.validationCID || [];
      }
      
      // Store status in cleanData for UI purposes (even though it's not part of NodeData schema)
      cleanData._status = nodeStatus;
      
      console.log("InspectorPanel: Updating localData from selectedNode", {
        nodeId: selectedNode.id,
        nodeType: selectedNode.type,
        cleanData,
      });
      
      setLocalData(cleanData as NodeData);
      setHasUnsavedChanges(false);
    } else {
      setLocalData(null);
      setHasUnsavedChanges(false);
      prevNodeIdRef.current = null;
      prevNodeDataRef.current = null;
    }
  }, [selectedNode]); // Update when selectedNode changes (stable dependency)

  if (!selectedNode) {
    return (
      <div className="w-64 bg-white/80 backdrop-blur-xl border-l border-gray-200/50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-sm mb-1">Select a node</div>
          <div className="text-gray-500 text-xs">to edit its properties</div>
        </div>
      </div>
    );
  }

  // If localData is not ready yet, show loading state
  if (!localData) {
    return (
      <div className="w-64 bg-white/80 backdrop-blur-xl border-l border-gray-200/50 p-4 flex items-center justify-center">
        <div className="text-gray-500 text-sm">Loading node data...</div>
      </div>
    );
  }

  const nodeType = selectedNode.type as NodeType;
  const nodeStatus = (localData as any)?._status || (selectedNode.data as any)?.status || "draft";
  const isCommitted = nodeStatus === "committed";
  const cid = (selectedNode.data as any)?.cid;
  const attestationUID = (selectedNode.data as any)?.attestationUID;
  const defaultColorByType: Record<NodeType, string> = {
    evidence: "rgb(37, 99, 235)",
    validation: "rgb(34, 197, 94)",
    claim: "rgb(168, 85, 247)",
    claim_root: "rgb(168, 85, 247)",
  };
  const currentColor = (localData as any).color || defaultColorByType[nodeType];

  const handleFormChange = (data: NodeData) => {
    // Preserve status when updating
    const updatedData = { ...data, _status: nodeStatus } as any;
    setLocalData(updatedData);
    setHasUnsavedChanges(true);
  };

  const handleColorChange = (color: string) => {
    const updatedData = { ...(localData as any), color, _status: nodeStatus };
    setLocalData(updatedData);
    setHasUnsavedChanges(true);
  };

  const handleClearColor = () => {
    const updatedData = { ...(localData as any), _status: nodeStatus };
    delete updatedData.color;
    setLocalData(updatedData);
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!localData || !hasUnsavedChanges) {
      console.log("InspectorPanel: Save skipped", { hasLocalData: !!localData, hasUnsavedChanges });
      return;
    }

    console.log("InspectorPanel: Saving node", {
      nodeId: selectedNode.id,
      nodeType: selectedNode.type,
      localData,
    });

    setIsSaving(true);
    try {
      // Remove _status before saving (it's not part of the schema)
      const dataToSave = { ...localData };
      delete (dataToSave as any)._status;
      
      console.log("InspectorPanel: Calling onUpdateNode with", dataToSave);
      await onUpdateNode(selectedNode.id, dataToSave);
      
      console.log("InspectorPanel: Save successful");
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("InspectorPanel: Error saving node:", error);
      alert(`Failed to save changes: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-64 bg-white/80 backdrop-blur-xl border-l border-gray-200/50 p-4 overflow-y-auto">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-xl text-gray-900">
            {nodeType === "claim_root" ? "Root Claim" : nodeType ? nodeType.charAt(0).toUpperCase() + nodeType.slice(1) : "Node"}
          </h3>
          {isCommitted && (
            <span className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-200 font-medium">
              ✓ Committed
            </span>
          )}
        </div>
        <div className="text-xs text-gray-500 mb-3 font-mono">{selectedNode.id}</div>
        {isCommitted && cid && (
          <div className="text-xs text-gray-600 mb-3 space-y-1.5 bg-gray-50 p-3 rounded-xl">
            <div className="font-mono break-all text-[10px]">
              <span className="text-gray-500">CID:</span> {cid}
            </div>
            {attestationUID && (
              <div className="font-mono break-all text-[10px]">
                <span className="text-gray-500">UID:</span> {attestationUID}
              </div>
            )}
          </div>
        )}
        {isCommitted && (
          <div className="text-xs text-amber-700 mb-3 bg-amber-50 px-3 py-2 rounded-xl border border-amber-200">
            ⚠ This node is committed. Changes will create a new version.
          </div>
        )}
        {hasUnsavedChanges && (
          <div className="text-xs text-orange-600 mb-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
            Unsaved changes
          </div>
        )}
        <div className="mb-5 p-3 rounded-xl bg-gray-50 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-700">Node Color</label>
            {(localData as any).color && (
              <button
                type="button"
                onClick={handleClearColor}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Reset
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={currentColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="h-8 w-12 rounded-md border border-gray-300 bg-white"
            />
            <input
              type="text"
              value={currentColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="apple-input text-xs font-mono"
              placeholder="#RRGGBB"
            />
          </div>
        </div>
      </div>

            {nodeType === "evidence" && (
              <EvidenceForm
                key={selectedNode.id}
                data={localData}
                onChange={handleFormChange}
              />
            )}
            {nodeType === "validation" && (
              <ValidationForm
                key={selectedNode.id}
                data={localData}
                onChange={handleFormChange}
              />
            )}
            {(nodeType === "claim" || nodeType === "claim_root") && (
              <ClaimForm
                key={selectedNode.id}
                data={localData}
                onChange={handleFormChange}
              />
            )}

            <div className="mt-8 pt-6 border-t border-gray-200 space-y-3">
              <button
                onClick={handleSave}
                disabled={!hasUnsavedChanges || isSaving}
                className="w-full apple-button apple-button-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#007aff]"
              >
                {isSaving ? "Saving..." : isCommitted ? "Save Changes" : "Save Draft"}
              </button>
              {!isCommitted && (
                <CommitButton
                  nodeId={selectedNode.id}
                  projectId={projectId}
                  nodeType={nodeType}
                  status={nodeStatus}
                />
              )}
            </div>
    </div>
  );
}

