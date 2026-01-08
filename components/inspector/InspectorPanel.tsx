"use client";

import React, { useState, useEffect } from "react";
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

  // Reset local data when selected node changes
  useEffect(() => {
    if (selectedNode) {
      const nodeData = (selectedNode.data as any) || {};
      console.log("InspectorPanel: selectedNode changed", selectedNode.id, "data:", nodeData);
      
      // Create a clean copy - copy ALL properties first, then remove only React Flow metadata
      const cleanData: any = { ...nodeData };
      
      // Remove only React Flow internal properties, keep all actual data
      delete cleanData.type; // React Flow node type
      delete cleanData.status; // Node status (draft/committed) - not part of form data
      delete cleanData.label; // Computed label - not stored
      delete cleanData.cid; // CID - not editable in form
      delete cleanData.attestationUID; // UID - not editable in form
      
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
      if (selectedNode.type === "claim") {
        if (!Array.isArray(cleanData.evidenceCID)) cleanData.evidenceCID = cleanData.evidenceCID || [];
        if (!Array.isArray(cleanData.validationCID)) cleanData.validationCID = cleanData.validationCID || [];
      }
      
      console.log("InspectorPanel: cleanData after cleanup", cleanData);
      setLocalData(cleanData as NodeData);
      setHasUnsavedChanges(false);
    } else {
      setLocalData(null);
      setHasUnsavedChanges(false);
    }
  }, [selectedNode?.id, selectedNode?.type]); // Reset when node ID or type changes

  if (!selectedNode || !localData) {
    return (
      <div className="w-80 bg-white border-l border-gray-300 p-4">
        <div className="text-gray-500 text-sm">Select a node to edit</div>
      </div>
    );
  }

  const nodeType = selectedNode.type as NodeType;

  const handleFormChange = (data: NodeData) => {
    setLocalData(data);
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!localData || !hasUnsavedChanges) return;

    setIsSaving(true);
    try {
      await onUpdateNode(selectedNode.id, localData);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Error saving node:", error);
      alert("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-80 bg-white border-l border-gray-300 p-4 overflow-y-auto">
      <div className="mb-4">
        <h3 className="font-semibold text-lg mb-2">
          {nodeType ? nodeType.charAt(0).toUpperCase() + nodeType.slice(1) : "Node"} Node
        </h3>
        <div className="text-xs text-gray-500 mb-4">ID: {selectedNode.id}</div>
        {hasUnsavedChanges && (
          <div className="text-xs text-orange-600 mb-2">● Unsaved changes</div>
        )}
      </div>

      {nodeType === "evidence" && (
        <EvidenceForm
          data={localData}
          onChange={handleFormChange}
        />
      )}
      {nodeType === "validation" && (
        <ValidationForm
          data={localData}
          onChange={handleFormChange}
        />
      )}
      {nodeType === "claim" && (
        <ClaimForm
          data={localData}
          onChange={handleFormChange}
        />
      )}

      <div className="mt-6 pt-4 border-t space-y-3">
        <button
          onClick={handleSave}
          disabled={!hasUnsavedChanges || isSaving}
          className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? "Saving..." : "Save Draft"}
        </button>
        <CommitButton
          nodeId={selectedNode.id}
          projectId={projectId}
          nodeType={nodeType}
          status={(localData as any)?.status || "draft"}
        />
      </div>
    </div>
  );
}

