"use client";

import React from "react";

interface PhysicsControlsProps {
  isRunning: boolean;
  onPlay: () => void;
  onPause: () => void;
  onReheat: () => void;
  onStabilize: () => void;
}

export function PhysicsControls({
  isRunning,
  onPlay,
  onPause,
  onReheat,
  onStabilize,
}: PhysicsControlsProps) {
  return (
    <div className="bg-white/90 backdrop-blur-xl border border-gray-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <h3 className="text-sm font-semibold text-gray-900">Physics</h3>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {isRunning ? (
          <button
            onClick={onPause}
            className="apple-button apple-button-secondary text-xs px-3 py-1.5"
            title="Pause simulation"
          >
            ⏸ Pause
          </button>
        ) : (
          <button
            onClick={onPlay}
            className="apple-button apple-button-secondary text-xs px-3 py-1.5"
            title="Resume simulation"
          >
            ▶ Play
          </button>
        )}
        
        <button
          onClick={onReheat}
          className="apple-button apple-button-secondary text-xs px-3 py-1.5"
          title="Restart simulation with full energy"
        >
          🔥 Reheat
        </button>
        
        <button
          onClick={onStabilize}
          className="apple-button apple-button-secondary text-xs px-3 py-1.5"
          title="Stabilize layout (increase decay)"
        >
          ⚡ Stabilize
        </button>
      </div>
    </div>
  );
}

