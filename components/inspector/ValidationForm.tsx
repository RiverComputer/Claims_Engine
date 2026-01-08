"use client";

import React, { useState } from "react";
import { ValidationData } from "@/lib/types/graph";

interface ValidationFormProps {
  data: Partial<ValidationData>;
  onChange: (data: ValidationData) => void;
}

export function ValidationForm({ data, onChange }: ValidationFormProps) {
  const [validatorInput, setValidatorInput] = useState("");
  
  // Ensure data is always an object
  const formData = data || {};

  const updateField = (field: keyof ValidationData, value: any) => {
    const updated = {
      ...formData,
      [field]: value,
      createdAt: formData.createdAt || new Date().toISOString(),
      validatorNames: formData.validatorNames || [],
      evidenceCID: formData.evidenceCID || [],
    } as ValidationData;
    onChange(updated);
  };

  const addValidator = () => {
    if (validatorInput.trim()) {
      updateField("validatorNames", [...(formData.validatorNames || []), validatorInput.trim()]);
      setValidatorInput("");
    }
  };

  const removeValidator = (index: number) => {
    const updated = [...(formData.validatorNames || [])];
    updated.splice(index, 1);
    updateField("validatorNames", updated);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Short Summary *</label>
        <textarea
          value={formData.shortSummary || ""}
          onChange={(e) => updateField("shortSummary", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          rows={3}
          placeholder="Validation summary"
          disabled={false}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Validation Type *</label>
        <input
          type="text"
          value={formData.validationType || ""}
          onChange={(e) => updateField("validationType", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          placeholder="e.g., technical, peer-review"
          disabled={false}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Validator Names *</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={validatorInput}
            onChange={(e) => setValidatorInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && addValidator()}
            className="flex-1 px-3 py-2 border border-gray-300 rounded"
            placeholder="Add validator name"
          />
          <button
            onClick={addValidator}
            className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add
          </button>
        </div>
        <div className="space-y-1">
          {(formData.validatorNames || []).map((name, idx) => (
            <div key={idx} className="flex items-center justify-between bg-gray-100 px-2 py-1 rounded">
              <span className="text-sm">{name}</span>
              <button
                onClick={() => removeValidator(idx)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                ×
              </button>
            </div>
          ))}
        </div>
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
    </div>
  );
}

