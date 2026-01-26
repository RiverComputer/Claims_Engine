"use client";

import React, { useRef, useState, useEffect } from "react";
import { EvidenceData } from "@/lib/types/graph";

interface EvidenceFormProps {
  data: Partial<EvidenceData>;
  onChange: (data: EvidenceData) => void;
}

export function EvidenceForm({ data, onChange }: EvidenceFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropContainerRef = useRef<HTMLDivElement>(null);
  const cropImageRef = useRef<HTMLImageElement>(null);
  
  // Ensure data is always an object
  // Use data directly - React will re-render when data prop changes
  const formData = data || {};
  
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; url: string } | null>(null);
  const rotation = Number.isFinite(formData.imageRotation) ? (formData.imageRotation as number) : 0;
  const [isCropping, setIsCropping] = useState(false);
  const [cropRect, setCropRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [cropSource, setCropSource] = useState<string | null>(null);

  const normalizeRotation = (value: number) => {
    const normalized = ((value % 360) + 360) % 360;
    return normalized;
  };

  const clamp = (value: number, min: number, max: number) => {
    return Math.max(min, Math.min(max, value));
  };

  const getCropImageSrc = () => {
    return cropSource || formData.fileRef || formData.thumbnailRef || "";
  };

  const createRotatedPreview = async (src: string, degrees: number) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = src;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Failed to load image for rotation"));
    });

    const radians = (degrees * Math.PI) / 180;
    const isRightAngle = Math.abs(degrees % 180) === 90;
    const outputWidth = isRightAngle ? image.naturalHeight : image.naturalWidth;
    const outputHeight = isRightAngle ? image.naturalWidth : image.naturalHeight;

    const canvas = document.createElement("canvas");
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas unavailable");
    }
    ctx.translate(outputWidth / 2, outputHeight / 2);
    ctx.rotate(radians);
    ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
    return canvas.toDataURL("image/jpeg", 0.9);
  };

  const startCrop = async () => {
    if (!formData.fileRef && !formData.thumbnailRef) return;
    setIsCropping(true);
    setCropRect(null);
    setDragStart(null);
    if (rotation % 360 !== 0) {
      try {
        const source = formData.fileRef || formData.thumbnailRef || "";
        const rotated = await createRotatedPreview(source, rotation);
        setCropSource(rotated);
      } catch {
        setCropSource(null);
      }
    } else {
      setCropSource(null);
    }
  };

  const cancelCrop = () => {
    setIsCropping(false);
    setCropRect(null);
    setDragStart(null);
    setCropSource(null);
  };

  const handleCropPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!cropContainerRef.current) return;
    const bounds = cropContainerRef.current.getBoundingClientRect();
    const x = clamp(event.clientX - bounds.left, 0, bounds.width);
    const y = clamp(event.clientY - bounds.top, 0, bounds.height);
    setDragStart({ x, y });
    setCropRect({ x, y, width: 0, height: 0 });
  };

  const handleCropPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStart || !cropContainerRef.current) return;
    const bounds = cropContainerRef.current.getBoundingClientRect();
    const currentX = clamp(event.clientX - bounds.left, 0, bounds.width);
    const currentY = clamp(event.clientY - bounds.top, 0, bounds.height);
    const x = Math.min(dragStart.x, currentX);
    const y = Math.min(dragStart.y, currentY);
    const width = Math.abs(currentX - dragStart.x);
    const height = Math.abs(currentY - dragStart.y);
    setCropRect({ x, y, width, height });
  };

  const handleCropPointerUp = () => {
    setDragStart(null);
  };

  const applyCrop = async () => {
    if (!cropContainerRef.current || !cropImageRef.current || !cropRect) return;
    const container = cropContainerRef.current;
    const image = cropImageRef.current;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const sourceWidth = image.naturalWidth;
    const sourceHeight = image.naturalHeight;

    if (!sourceWidth || !sourceHeight) return;

    const scale = Math.min(containerWidth / sourceWidth, containerHeight / sourceHeight);
    const displayWidth = sourceWidth * scale;
    const displayHeight = sourceHeight * scale;
    const offsetX = (containerWidth - displayWidth) / 2;
    const offsetY = (containerHeight - displayHeight) / 2;

    const rectX = clamp(cropRect.x, offsetX, offsetX + displayWidth);
    const rectY = clamp(cropRect.y, offsetY, offsetY + displayHeight);
    const rectW = clamp(cropRect.width, 1, displayWidth - (rectX - offsetX));
    const rectH = clamp(cropRect.height, 1, displayHeight - (rectY - offsetY));

    const cropX = (rectX - offsetX) / scale;
    const cropY = (rectY - offsetY) / scale;
    const cropW = rectW / scale;
    const cropH = rectH / scale;

    const outputCanvas = document.createElement("canvas");
    outputCanvas.width = Math.max(1, Math.round(cropW));
    outputCanvas.height = Math.max(1, Math.round(cropH));
    const ctx = outputCanvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(image, cropX, cropY, cropW, cropH, 0, 0, outputCanvas.width, outputCanvas.height);

    const dataUrl = outputCanvas.toDataURL("image/jpeg", 0.9);
    updateField("thumbnailRef", dataUrl);
    updateField("imageAspectRatio", outputCanvas.width / outputCanvas.height);
    updateField("imageCrop", {
      x: cropX / sourceWidth,
      y: cropY / sourceHeight,
      width: cropW / sourceWidth,
      height: cropH / sourceHeight,
    });
    updateField("imageRotation", 0);
    cancelCrop();
  };

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
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => updateField("imageRotation", normalizeRotation(rotation - 90))}
                className="apple-button text-xs"
              >
                Rotate ⟲
              </button>
              <button
                type="button"
                onClick={() => updateField("imageRotation", normalizeRotation(rotation + 90))}
                className="apple-button text-xs"
              >
                Rotate ⟳
              </button>
              <span className="text-[11px] text-gray-500">Rotation: {rotation}°</span>
              <button
                type="button"
                onClick={startCrop}
                className="apple-button text-xs"
              >
                Crop
              </button>
            </div>
            <a
              href={formData.fileRef || formData.thumbnailRef}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
            >
              <div className="w-full h-48 overflow-hidden bg-white relative">
                <img
                  src={formData.thumbnailRef || formData.fileRef}
                  alt={formData.title || "Evidence preview"}
                  className="w-full h-full object-cover"
                  style={rotation ? { transform: `rotate(${rotation}deg)` } : undefined}
                  loading="lazy"
                />
              </div>
            </a>
            {isCropping && (
              <div className="mt-3">
                <div
                  ref={cropContainerRef}
                  className="relative w-full h-48 overflow-hidden rounded-xl border border-gray-200 bg-black/90"
                  onPointerDown={handleCropPointerDown}
                  onPointerMove={handleCropPointerMove}
                  onPointerUp={handleCropPointerUp}
                  onPointerLeave={handleCropPointerUp}
                >
                  <img
                    ref={cropImageRef}
                    src={getCropImageSrc()}
                    alt="Crop preview"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {cropRect && (
                    <div
                      className="absolute border-2 border-blue-400 bg-blue-200/20"
                      style={{
                        left: cropRect.x,
                        top: cropRect.y,
                        width: cropRect.width,
                        height: cropRect.height,
                      }}
                    />
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    className="apple-button text-xs"
                    onClick={applyCrop}
                    disabled={!cropRect || cropRect.width < 5 || cropRect.height < 5}
                  >
                    Apply Crop
                  </button>
                  <button
                    type="button"
                    className="apple-button text-xs"
                    onClick={cancelCrop}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
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

