"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, ZoomIn, ZoomOut, RotateCw, Check, Move } from "lucide-react";

interface AvatarCropModalProps {
  imageSrc: string | null;
  isOpen: boolean;
  onClose: () => void;
  onCropDone: (croppedFile: File, croppedPreviewUrl: string) => void;
}

export function AvatarCropModal({
  imageSrc,
  isOpen,
  onClose,
  onCropDone,
}: AvatarCropModalProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);

  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset state when a new image is loaded
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
      setIsDragging(false);
    }
  }, [isOpen, imageSrc]);

  // Handle Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Generate cropped image on canvas
  const handleCrop = useCallback(async () => {
    if (!imageSrc || !imageRef.current) return;
    setIsProcessing(true);

    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageSrc;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const CROP_SIZE = 500; // Output dimension (500x500 high-res)
      const canvas = document.createElement("canvas");
      canvas.width = CROP_SIZE;
      canvas.height = CROP_SIZE;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Unable to create canvas context");
      }

      // Fill background white
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, CROP_SIZE, CROP_SIZE);

      // Save context
      ctx.save();

      // Move to center of canvas
      ctx.translate(CROP_SIZE / 2, CROP_SIZE / 2);

      // Rotate
      ctx.rotate((rotation * Math.PI) / 180);

      // Scaling relative to viewport container (260px is the preview container size)
      const previewSize = 260;
      const ratio = CROP_SIZE / previewSize;

      // Scale
      ctx.scale(zoom * ratio, zoom * ratio);

      // Position offset
      const posX = (position.x / zoom);
      const posY = (position.y / zoom);

      // Draw the image centered
      const drawWidth = img.naturalWidth;
      const drawHeight = img.naturalHeight;

      // Fit the image naturally in the preview box initially
      const baseScale = Math.max(previewSize / drawWidth, previewSize / drawHeight);
      const scaledWidth = drawWidth * baseScale;
      const scaledHeight = drawHeight * baseScale;

      ctx.drawImage(
        img,
        -scaledWidth / 2 + posX,
        -scaledHeight / 2 + posY,
        scaledWidth,
        scaledHeight
      );

      ctx.restore();

      // Convert canvas to Blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setIsProcessing(false);
            return;
          }

          const croppedFile = new File([blob], `avatar_cropped_${Date.now()}.jpg`, {
            type: "image/jpeg",
          });
          const croppedPreviewUrl = URL.createObjectURL(blob);
          onCropDone(croppedFile, croppedPreviewUrl);
          setIsProcessing(false);
          onClose();
        },
        "image/jpeg",
        0.92
      );
    } catch (err) {
      console.error("Failed to crop image:", err);
      setIsProcessing(false);
    }
  }, [imageSrc, zoom, rotation, position, onCropDone, onClose]);

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Crop Profile Picture
            </h3>
            <p className="text-xs text-slate-500">
              Drag to reposition • Use slider to zoom
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Viewport & Circular Mask */}
        <div className="my-5 flex justify-center">
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="relative h-[260px] w-[260px] rounded-full overflow-hidden bg-slate-950 border-4 border-blue-600 shadow-inner cursor-grab active:cursor-grabbing select-none"
          >
            {/* Image Preview with Transformation */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Crop preview"
              draggable={false}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: "center center",
                transition: isDragging ? "none" : "transform 0.1s ease-out",
              }}
              className="absolute inset-0 m-auto max-h-none max-w-none pointer-events-none object-cover"
            />

            {/* Subtle Crosshair Guide Overlay */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-30">
              <div className="h-full w-px bg-white/40" />
              <div className="absolute w-full h-px bg-white/40" />
            </div>

            {/* Drag hint badge */}
            <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-medium text-white flex items-center gap-1 backdrop-blur-xs">
              <Move className="h-2.5 w-2.5" />
              <span>Drag to move</span>
            </div>
          </div>
        </div>

        {/* Controls: Zoom & Rotate */}
        <div className="space-y-4 pt-1">
          {/* Zoom Slider */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(1, z - 0.2))}
              className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-blue-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
              className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </button>

            {/* Rotate Button */}
            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 transition shrink-0 ml-1"
              title="Rotate 90 degrees"
            >
              <RotateCw className="h-3.5 w-3.5" />
              <span>Rotate</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="rounded-full px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCrop}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 hover:bg-blue-700 px-5 py-2 text-xs font-semibold text-white shadow-sm transition disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Cropping...</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Apply Crop</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
