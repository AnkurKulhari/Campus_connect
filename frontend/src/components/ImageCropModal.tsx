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

export interface ImageCropModalProps {
  imageSrc: string | null;
  isOpen: boolean;
  aspectRatio: "1:1" | "16:7";
  title?: string;
  onClose: () => void;
  onCropDone: (croppedFile: File, croppedPreviewUrl: string) => void;
}

export function ImageCropModal({
  imageSrc,
  isOpen,
  aspectRatio = "1:1",
  title,
  onClose,
  onCropDone,
}: ImageCropModalProps) {
  const isSquare = aspectRatio === "1:1";
  const containerWidth = isSquare ? 280 : 360;
  const containerHeight = isSquare ? 280 : Math.round((360 * 7) / 16); // 158px

  const outputWidth = isSquare ? 512 : 1200;
  const outputHeight = isSquare ? 512 : 525;

  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
  }, [isOpen, imageSrc, aspectRatio]);

  const getBaseDimensions = useCallback(() => {
    if (!naturalSize) return { baseWidth: containerWidth, baseHeight: containerHeight };
    const { width, height } = naturalSize;
    const imgAspect = width / height;
    const targetAspect = containerWidth / containerHeight;

    if (imgAspect >= targetAspect) {
      return {
        baseHeight: containerHeight,
        baseWidth: Math.round(containerHeight * imgAspect),
      };
    } else {
      return {
        baseWidth: containerWidth,
        baseHeight: Math.round(containerWidth / imgAspect),
      };
    }
  }, [naturalSize, containerWidth, containerHeight]);

  const { baseWidth, baseHeight } = getBaseDimensions();

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

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => {
      const next = parseFloat((prev + delta).toFixed(2));
      return Math.min(3.5, Math.max(0.6, next));
    });
  };

  const handleRotate = () => {
    setRotation((r) => (r + 90) % 360);
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleCrop = useCallback(() => {
    if (!imageSrc || !naturalSize) return;

    setIsProcessing(true);

    try {
      const canvas = document.createElement("canvas");
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        setIsProcessing(false);
        return;
      }

      ctx.fillStyle = "#0B0F19";
      ctx.fillRect(0, 0, outputWidth, outputHeight);

      const scaleRatio = outputWidth / containerWidth;

      ctx.save();
      ctx.translate(outputWidth / 2, outputHeight / 2);
      ctx.translate(position.x * scaleRatio, position.y * scaleRatio);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom, zoom);

      const drawW = baseWidth * scaleRatio;
      const drawH = baseHeight * scaleRatio;

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageSrc;
      img.onload = () => {
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              setIsProcessing(false);
              return;
            }

            const prefix = isSquare ? "club_logo" : "club_banner";
            const croppedFile = new File([blob], `${prefix}_${Date.now()}.jpg`, {
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
      };
      img.onerror = () => {
        setIsProcessing(false);
      };
    } catch (err) {
      console.error("Failed to crop image:", err);
      setIsProcessing(false);
    }
  }, [
    imageSrc,
    naturalSize,
    zoom,
    rotation,
    position,
    baseWidth,
    baseHeight,
    containerWidth,
    outputWidth,
    outputHeight,
    isSquare,
    onCropDone,
    onClose,
  ]);

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {title || (isSquare ? "Crop Society Logo" : "Crop Cover Banner")}
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

        {/* Viewport */}
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
            style={{ width: `${containerWidth}px`, height: `${containerHeight}px` }}
            className={`relative overflow-hidden bg-slate-950 border-4 border-violet-600 shadow-2xl cursor-grab active:cursor-grabbing select-none ${
              isSquare ? "rounded-2xl" : "rounded-2xl"
            }`}
          >
            {naturalSize && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Crop preview"
                draggable={false}
                style={{
                  position: "absolute",
                  left: `${(containerWidth - baseWidth) / 2}px`,
                  top: `${(containerHeight - baseHeight) / 2}px`,
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

            {/* Grid overlay */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-20">
              <div className="h-full w-px bg-white/60" />
              <div className="absolute w-full h-px bg-white/60" />
            </div>

            {/* Drag hint */}
            <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-3 py-0.5 text-[10px] font-medium text-white flex items-center gap-1 backdrop-blur-xs">
              <Move className="h-2.5 w-2.5" />
              <span>Drag to align</span>
            </div>
          </div>

          <div className="mt-2 text-[11px] font-medium text-slate-400">
            Zoom: {Math.round(zoom * 100)}%
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4 pt-1">
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
              className="flex-1 accent-violet-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
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

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleRotate}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
                title="Rotate 90 degrees"
              >
                <RotateCw className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
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
                className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-violet-700 transition disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Done</span>
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
