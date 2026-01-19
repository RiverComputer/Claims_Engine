"use client";

import React from "react";
import { TextData } from "@/lib/types/graph";

interface TextFormProps {
  data: Partial<TextData>;
  onChange: (data: TextData) => void;
}

export function TextForm({ data, onChange }: TextFormProps) {
  const formData = data || {};

  const updateField = (field: keyof TextData, value: any) => {
    const updated = {
      ...formData,
      [field]: value,
      createdAt: formData.createdAt || new Date().toISOString(),
    } as TextData;
    onChange(updated);
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700">Text</label>
        <textarea
          value={formData.text || ""}
          onChange={(e) => updateField("text", e.target.value)}
          className="apple-input resize-none"
          rows={4}
          placeholder="Enter text"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">Font Size</label>
          <input
            type="number"
            value={formData.fontSize ?? 16}
            onChange={(e) => updateField("fontSize", Number(e.target.value))}
            className="apple-input"
            min={8}
            max={128}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">Text Color</label>
          <input
            type="color"
            value={formData.color || "#111827"}
            onChange={(e) => updateField("color", e.target.value)}
            className="h-10 w-full rounded-lg border border-gray-200"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">Width</label>
          <input
            type="number"
            value={formData.width ?? 220}
            onChange={(e) => updateField("width", Number(e.target.value))}
            className="apple-input"
            min={80}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">Height</label>
          <input
            type="number"
            value={formData.height ?? 120}
            onChange={(e) => updateField("height", Number(e.target.value))}
            className="apple-input"
            min={40}
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700">Alignment</label>
        <select
          value={formData.align || "left"}
          onChange={(e) => updateField("align", e.target.value as TextData["align"])}
          className="apple-input"
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>
    </div>
  );
}

