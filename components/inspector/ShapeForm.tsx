"use client";

import React from "react";
import { ShapeData } from "@/lib/types/graph";

interface ShapeFormProps {
  data: Partial<ShapeData>;
  onChange: (data: ShapeData) => void;
}

export function ShapeForm({ data, onChange }: ShapeFormProps) {
  const formData = data || {};

  const updateField = (field: keyof ShapeData, value: any) => {
    const updated = {
      ...formData,
      [field]: value,
      createdAt: formData.createdAt || new Date().toISOString(),
    } as ShapeData;
    onChange(updated);
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700">Shape</label>
        <select
          value={formData.shape || "rectangle"}
          onChange={(e) => updateField("shape", e.target.value as ShapeData["shape"])}
          className="apple-input"
        >
          <option value="rectangle">Rectangle</option>
          <option value="ellipse">Ellipse</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">Width</label>
          <input
            type="number"
            value={formData.width ?? 220}
            onChange={(e) => updateField("width", Number(e.target.value))}
            className="apple-input"
            min={60}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">Height</label>
          <input
            type="number"
            value={formData.height ?? 140}
            onChange={(e) => updateField("height", Number(e.target.value))}
            className="apple-input"
            min={60}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">Fill</label>
          <input
            type="color"
            value={formData.fill || "#e2e8f0"}
            onChange={(e) => updateField("fill", e.target.value)}
            className="h-10 w-full rounded-lg border border-gray-200"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">Stroke</label>
          <input
            type="color"
            value={formData.stroke || "#64748b"}
            onChange={(e) => updateField("stroke", e.target.value)}
            className="h-10 w-full rounded-lg border border-gray-200"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">Stroke Width</label>
          <input
            type="number"
            value={formData.strokeWidth ?? 2}
            onChange={(e) => updateField("strokeWidth", Number(e.target.value))}
            className="apple-input"
            min={0}
            max={20}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">Corner Radius</label>
          <input
            type="number"
            value={formData.borderRadius ?? 16}
            onChange={(e) => updateField("borderRadius", Number(e.target.value))}
            className="apple-input"
            min={0}
          />
        </div>
      </div>
    </div>
  );
}

