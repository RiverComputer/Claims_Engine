"use client";

import React, { useState } from "react";

interface MintModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export function MintModal({ isOpen, onClose, projectId }: MintModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-200/50"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-semibold mb-3 text-gray-900">Mint Claim</h2>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          This is a placeholder for the mint functionality. In a future version, this will
          bundle committed claims and prepare them for onchain anchoring.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="apple-button"
          >
            Close
          </button>
          <button
            className="apple-button apple-button-primary"
            disabled
          >
            Mint (Stub)
          </button>
        </div>
      </div>
    </div>
  );
}

