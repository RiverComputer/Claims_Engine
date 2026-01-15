"use client";

import React, { useRef, useState } from "react";
import { ClaimData } from "@/lib/types/graph";

interface ClaimFormProps {
  data: Partial<ClaimData>;
  onChange: (data: ClaimData) => void;
}

export function ClaimForm({ data, onChange }: ClaimFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  
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

    setUploading(true);

    try {
      // For images, use data URL for thumbnails
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          updateField("image", dataUrl);
        };
        reader.readAsDataURL(file);
      }

      // Upload file to API for non-images or as backup
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        // Store file reference if needed (could add fileRef to ClaimData later)
        console.log("File uploaded:", result);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setUploading(false);
    }
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
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700">Title *</label>
        <input
          type="text"
          value={formData.title || ""}
          onChange={(e) => updateField("title", e.target.value)}
          className="apple-input"
          placeholder="Claim title"
          disabled={false}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700">Short Description *</label>
        <textarea
          value={formData.shortDescription || ""}
          onChange={(e) => updateField("shortDescription", e.target.value)}
          onPaste={handlePaste}
          className="apple-input resize-none"
          rows={3}
          placeholder="Claim description (text or paste image)"
          disabled={false}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700">Evidence CIDs</label>
        <div className="text-xs text-gray-500 mb-2">
          Connect Evidence nodes to populate this field
        </div>
        <div className="space-y-1.5">
          {(formData.evidenceCID || []).map((cid, idx) => (
            <div key={idx} className="bg-gray-50 px-3 py-2 rounded-xl text-xs font-mono border border-gray-200 text-gray-700">
              {cid}
            </div>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700">Validation CIDs</label>
        <div className="text-xs text-gray-500 mb-2">
          Connect Validation nodes to populate this field
        </div>
        <div className="space-y-1.5">
          {(formData.validationCID || []).map((cid, idx) => (
            <div key={idx} className="bg-gray-50 px-3 py-2 rounded-xl text-xs font-mono border border-gray-200 text-gray-700">
              {cid}
            </div>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700">Image</label>
        <input
          type="text"
          value={formData.image || ""}
          onChange={(e) => updateField("image", e.target.value)}
          className="apple-input mb-3"
          placeholder="Image URL or data URL"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="*/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="apple-button text-sm disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload File"}
        </button>
        {formData.image && formData.image.startsWith("data:image") && (
          <div className="mt-3">
            <img src={formData.image} alt="Preview" className="max-w-full h-auto rounded-2xl shadow-sm" />
          </div>
        )}
      </div>
    </div>
  );
}

