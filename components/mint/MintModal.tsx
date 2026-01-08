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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4">Mint Claim</h2>
        <p className="text-sm text-gray-600 mb-4">
          This is a placeholder for the mint functionality. In a future version, this will
          bundle committed claims and prepare them for onchain anchoring.
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Close
          </button>
          <button
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            disabled
          >
            Mint (Stub)
          </button>
        </div>
      </div>
    </div>
  );
}

