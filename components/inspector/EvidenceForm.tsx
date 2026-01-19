"use client";

import React, { useRef, useState, useEffect } from "react";
import { EvidenceData } from "@/lib/types/graph";

interface EvidenceFormProps {
  data: Partial<EvidenceData>;
  onChange: (data: EvidenceData) => void;
}

export function EvidenceForm({ data, onChange }: EvidenceFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Ensure data is always an object
  // Use data directly - React will re-render when data prop changes
  const formData = data || {};
  
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; url: string } | null>(null);

  // Initialize uploaded file from formData.fileRef
  useEffect(() => {
    if (formData.fileRef) {
      setUploadedFile({ name: "Uploaded file", url: formData.fileRef });
    } else {
      setUploadedFile(null);
    }
  }, [formData.fileRef]);

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

    setUploading(true);

    try {
      // Check if it's an image - use data URL for thumbnails
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          updateField("content", dataUrl);
        };
        reader.readAsDataURL(file);
      }

      // Upload file to API
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      const result = await response.json();
      updateField("fileRef", result.url);
      if (result.thumbUrl) {
        updateField("thumbnailRef", result.thumbUrl);
      }
      setUploadedFile({ name: file.name, url: result.url });
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file. Please try again.");
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
            updateField("content", dataUrl);
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
          placeholder="Evidence title"
          disabled={false}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700">Content *</label>
        <textarea
          value={formData.content || ""}
          onChange={(e) => updateField("content", e.target.value)}
          onPaste={handlePaste}
          className="apple-input resize-none"
          rows={4}
          placeholder="Evidence content (text or paste image)"
          disabled={false}
        />
        <div className="mt-3 space-y-2">
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
          {uploadedFile && (
            <div className="text-xs text-gray-600 flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
              <span>📎 {uploadedFile.name}</span>
              <a
                href={uploadedFile.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#007aff] hover:underline"
              >
                View
              </a>
            </div>
          )}
        </div>
        {(formData.thumbnailRef || formData.fileRef) && (
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-600 mb-2">Preview</label>
            <a
              href={formData.fileRef || formData.thumbnailRef}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
            >
              <img
                src={formData.thumbnailRef || formData.fileRef}
                alt={formData.title || "Evidence preview"}
                className="w-full h-48 object-contain bg-white"
                loading="lazy"
              />
            </a>
          </div>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700">Short Description</label>
        <input
          type="text"
          value={formData.shortDescription || ""}
          onChange={(e) => updateField("shortDescription", e.target.value)}
          className="apple-input"
          placeholder="Brief description"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700">Activity</label>
        <input
          type="text"
          value={formData.activity || ""}
          onChange={(e) => updateField("activity", e.target.value)}
          className="apple-input"
          placeholder="Activity reference"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700">Units</label>
        <input
          type="text"
          value={formData.units || ""}
          onChange={(e) => updateField("units", e.target.value)}
          className="apple-input"
          placeholder="e.g., kg, m²"
        />
      </div>
    </div>
  );
}

