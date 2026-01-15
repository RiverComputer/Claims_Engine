"use client";

import React, { useState, useEffect } from "react";
import { ValidationData } from "@/lib/types/graph";

interface ValidationFormProps {
  data: Partial<ValidationData>;
  onChange: (data: ValidationData) => void;
}

export function ValidationForm({ data, onChange }: ValidationFormProps) {
  const [validatorInput, setValidatorInput] = useState("");
  
  // Ensure data is always an object
  // Use data directly - React will re-render when data prop changes
  const formData = data || {};
  
  // Reset validator input when node changes (data prop changes)
  useEffect(() => {
    setValidatorInput("");
  }, [data]);

  const updateField = (field: keyof ValidationData, value: any) => {
    const updated = {
      ...formData,
      [field]: value,
      createdAt: formData.createdAt || new Date().toISOString(),
      validatorNames: formData.validatorNames || [],
      evidenceCID: formData.evidenceCID || [],
    } as ValidationData;
    console.log("ValidationForm: updateField", { field, value, updated });
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
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700">Short Summary *</label>
        <textarea
          value={formData.shortSummary || ""}
          onChange={(e) => updateField("shortSummary", e.target.value)}
          className="apple-input resize-none"
          rows={3}
          placeholder="Validation summary"
          disabled={false}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700">Validation Type *</label>
        <input
          type="text"
          value={formData.validationType || ""}
          onChange={(e) => updateField("validationType", e.target.value)}
          className="apple-input"
          placeholder="e.g., technical, peer-review"
          disabled={false}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700">Validator Names *</label>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={validatorInput}
            onChange={(e) => setValidatorInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && addValidator()}
            className="flex-1 apple-input"
            placeholder="Add validator name"
          />
          <button
            onClick={addValidator}
            className="apple-button apple-button-primary px-4"
          >
            Add
          </button>
        </div>
        <div className="space-y-1.5">
          {(formData.validatorNames || []).map((name, idx) => (
            <div key={idx} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
              <span className="text-sm text-gray-900">{name}</span>
              <button
                onClick={() => removeValidator(idx)}
                className="text-red-500 hover:text-red-700 text-lg leading-none w-5 h-5 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors"
              >
                ×
              </button>
            </div>
          ))}
        </div>
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
    </div>
  );
}

