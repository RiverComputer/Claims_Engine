"use client";

import React, { useRef } from "react";
import { EvidenceData } from "@/lib/types/graph";

interface EvidenceFormProps {
  data: Partial<EvidenceData>;
  onChange: (data: EvidenceData) => void;
}

export function EvidenceForm({ data, onChange }: EvidenceFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Ensure data is always an object
  const formData = data || {};

  const updateField = (field: keyof EvidenceData, value: any) => {
    const updated = {
      ...formData,
      [field]: value,
      createdAt: formData.createdAt || new Date().toISOString(),
    } as EvidenceData;
    onChange(updated);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // For MVP, convert to data URL (base64)
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      // Store as image URL in content or separate field
      updateField("content", dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf("image") !== -1) {
        const blob = item.getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            updateField("content", dataUrl);
          };
          reader.readAsDataURL(blob);
          e.preventDefault();
        }
      }
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Title *</label>
        <input
          type="text"
          value={formData.title || ""}
          onChange={(e) => updateField("title", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          placeholder="Evidence title"
          disabled={false}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Content *</label>
        <textarea
          value={formData.content || ""}
          onChange={(e) => updateField("content", e.target.value)}
          onPaste={handlePaste}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          rows={4}
          placeholder="Evidence content (text or paste image)"
          disabled={false}
        />
        <div className="mt-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-sm px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded"
          >
            Upload Image
          </button>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Short Description</label>
        <input
          type="text"
          value={formData.shortDescription || ""}
          onChange={(e) => updateField("shortDescription", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          placeholder="Brief description"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Activity</label>
        <input
          type="text"
          value={formData.activity || ""}
          onChange={(e) => updateField("activity", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          placeholder="Activity reference"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Units</label>
        <input
          type="text"
          value={formData.units || ""}
          onChange={(e) => updateField("units", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          placeholder="e.g., kg, m²"
        />
      </div>
    </div>
  );
}

