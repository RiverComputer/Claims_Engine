"use client";

import React, { useRef } from "react";
import { ClaimData } from "@/lib/types/graph";

interface ClaimFormProps {
  data: Partial<ClaimData>;
  onChange: (data: ClaimData) => void;
}

export function ClaimForm({ data, onChange }: ClaimFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Ensure data is always an object
  const formData = data || {};

  const updateField = (field: keyof ClaimData, value: any) => {
    const updated = {
      ...formData,
      [field]: value,
      createdAt: formData.createdAt || new Date().toISOString(),
      evidenceCID: formData.evidenceCID || [],
      validationCID: formData.validationCID || [],
    } as ClaimData;
    onChange(updated);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      updateField("image", dataUrl);
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
            updateField("image", dataUrl);
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
          placeholder="Claim title"
          disabled={false}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Short Description *</label>
        <textarea
          value={formData.shortDescription || ""}
          onChange={(e) => updateField("shortDescription", e.target.value)}
          onPaste={handlePaste}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          rows={3}
          placeholder="Claim description (text or paste image)"
          disabled={false}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Evidence CIDs</label>
        <div className="text-xs text-gray-500 mb-1">
          Connect Evidence nodes to populate this field
        </div>
        <div className="space-y-1">
          {(formData.evidenceCID || []).map((cid, idx) => (
            <div key={idx} className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
              {cid}
            </div>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Validation CIDs</label>
        <div className="text-xs text-gray-500 mb-1">
          Connect Validation nodes to populate this field
        </div>
        <div className="space-y-1">
          {(formData.validationCID || []).map((cid, idx) => (
            <div key={idx} className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
              {cid}
            </div>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Image</label>
        <input
          type="text"
          value={formData.image || ""}
          onChange={(e) => updateField("image", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded mb-2"
          placeholder="Image URL or data URL"
        />
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
        {formData.image && formData.image.startsWith("data:image") && (
          <div className="mt-2">
            <img src={formData.image} alt="Preview" className="max-w-full h-auto rounded border" />
          </div>
        )}
      </div>
    </div>
  );
}

