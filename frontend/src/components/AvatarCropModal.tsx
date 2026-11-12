"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Check,
  Move,
  RotateCcw,
  Loader2,
} from "lucide-react";

interface AvatarCropModalProps {
  imageSrc: string | null;
  isOpen: boolean;
  onClose: () => void;
  onCropDone: (croppedFile: File, croppedPreviewUrl: string) => void;
}

const CONTAINER_SIZE = 280; // Circular viewport diameter on screen (px)
const OUTPUT_SIZE = 512;    // High-resolution output canvas size (px)

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
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load natural dimensions whenever imageSrc changes
  useEffect(() => {
    if (!isOpen || !imageSrc) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    img.onload = () => {
      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
      setIsDragging(false);
    };
    img.onerror = () => {
      setNaturalSize(null);
    };
  }, [isOpen, imageSrc]);

  // Calculate base display dimensions so the image naturally fits & covers the circular viewport
  const getBaseDimensions = useCallback(() => {
    if (!naturalSize) return { baseWidth: CONTAINER_SIZE, baseHeight: CONTAINER_SIZE };
    const { width, height } = naturalSize;
    const aspect = width / height;

    if (aspect >= 1) {
      // Landscape: height matches container, width scales proportionally
      return {
        baseHeight: CONTAINER_SIZE,
        baseWidth: Math.round(CONTAINER_SIZE * aspect),
      };
    } else {
      // Portrait: width matches container, height scales proportionally
      return {
        baseWidth: CONTAINER_SIZE,
        baseHeight: Math.round(CONTAINER_SIZE / aspect),
      };
    }
  }, [naturalSize]);

  const { baseWidth, baseHeight } = getBaseDimensions();

  // Mouse Dragging
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

  // Touch Dragging
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

  // Mouse Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => Math.min(3, Math.max(0.6, parseFloat((prev + delta).toFixed(2)))));
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Generate cropped image on canvas with exact 1:1 screen-to-canvas mapping
  const handleCrop = useCallback(async () => {
    if (!imageSrc || !naturalSize) return;
    setIsProcessing(true);

    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageSrc;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Unable to create canvas context");
      }

      // Fill white background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

      ctx.save();

      // Ratio between canvas resolution and preview container
      const scaleFactor = OUTPUT_SIZE / CONTAINER_SIZE;

      // 1. Move to canvas center + translate by user drag offset (scaled to canvas)
      const canvasCenterX = OUTPUT_SIZE / 2 + position.x * scaleFactor;
      const canvasCenterY = OUTPUT_SIZE / 2 + position.y * scaleFactor;
      ctx.translate(canvasCenterX, canvasCenterY);

      // 2. Rotate around image center
      ctx.rotate((rotation * Math.PI) / 180);

      // 3. Scale by user zoom * ratio
      ctx.scale(zoom * scaleFactor, zoom * scaleFactor);

      // 4. Draw image with base dimensions centered around (0, 0)
      ctx.drawImage(
        img,
        -baseWidth / 2,
        -baseHeight / 2,
        baseWidth,
        baseHeight
      );

      ctx.restore();

      // Convert canvas to Blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setIsProcessing(false);
            return;
          }

          const croppedFile = new File([blob], `avatar_${Date.now()}.jpg`, {
            type: "image/jpeg",
          });
          const croppedPreviewUrl = URL.createObjectURL(blob);
          onCropDone(croppedFile, croppedPreviewUrl);
          setIsProcessing(false);
          onClose();
        },
        "image/jpeg",
        0.95
      );
    } catch (err) {
      console.error("Failed to crop image:", err);
      setIsProcessing(false);
    }
  }, [imageSrc, naturalSize, zoom, rotation, position, baseWidth, baseHeight, onCropDone, onClose]);

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Crop Profile Picture
            </h3>
            <p className="text-xs text-slate-500">
              Drag to reposition • Scroll or slider to zoom
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Circular Viewport */}
        <div className="my-5 flex flex-col items-center">
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
            style={{ width: `${CONTAINER_SIZE}px`, height: `${CONTAINER_SIZE}px` }}
            className="relative rounded-full overflow-hidden bg-slate-950 border-4 border-blue-600 shadow-2xl cursor-grab active:cursor-grabbing select-none"
          >
            {/* The Image with natural scaling & interactive transforms */}
            {naturalSize && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Crop preview"
                draggable={false}
                style={{
                  position: "absolute",
                  left: `${(CONTAINER_SIZE - baseWidth) / 2}px`,
                  top: `${(CONTAINER_SIZE - baseHeight) / 2}px`,
                  width: `${baseWidth}px`,
                  height: `${baseHeight}px`,
                  maxWidth: "none",
                  maxHeight: "none",
                  transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${zoom})`,
                  transformOrigin: "center center",
                  transition: isDragging ? "none" : "transform 0.08s ease-out",
                  userSelect: "none",
                  pointerEvents: "none",
                }}
              />
            )}

            {/* Crosshair guide overlay */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-25">
              <div className="h-full w-px bg-white/50" />
              <div className="absolute w-full h-px bg-white/50" />
            </div>

            {/* Drag hint badge */}
            <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-3 py-0.5 text-[10px] font-medium text-white flex items-center gap-1 backdrop-blur-xs">
              <Move className="h-2.5 w-2.5" />
              <span>Drag to center</span>
            </div>
          </div>

          <div className="mt-2 text-[11px] font-medium text-slate-400">
            Zoom: {Math.round(zoom * 100)}%
          </div>
        </div>

        {/* Controls: Zoom & Rotate */}
        <div className="space-y-4 pt-1">
          {/* Zoom Slider */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.6, parseFloat((z - 0.15).toFixed(2))))}
              className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <input
              type="range"
              min="0.6"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-blue-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3, parseFloat((z + 0.15).toFixed(2))))}
              className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>

          {/* Action Row: Reset, Rotate 90, Cancel, Save */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleRotate}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
                title="Rotate 90 degrees"
              >
                <RotateCw className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span>Rotate</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition"
                title="Reset to center"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCrop}
                disabled={isProcessing}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Processing...</span>
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
    </div>
  );
}
