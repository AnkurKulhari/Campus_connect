"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PostMedia } from "@/types";
import { X, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";

interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  media: PostMedia[];
  initialIndex?: number;
}

export function ImageLightboxModal({
  isOpen,
  onClose,
  media,
  initialIndex = 0,
}: ImageLightboxModalProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  // Sync activeIndex whenever initialIndex changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveIndex(Math.max(0, Math.min(media.length - 1, initialIndex)));
    }
  }, [isOpen, initialIndex, media.length]);

  // Lock body scroll when lightbox is active
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const goToPrev = useCallback(() => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : media.length - 1));
  }, [media.length]);

  const goToNext = useCallback(() => {
    setActiveIndex((prev) => (prev < media.length - 1 ? prev + 1 : 0));
  }, [media.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        goToPrev();
      } else if (e.key === "ArrowRight") {
        goToNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, goToPrev, goToNext]);

  if (!isOpen || !media || media.length === 0) return null;

  const currentItem = media[activeIndex];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Full Ratio Image Viewer"
      onContextMenu={(e) => e.preventDefault()}
      className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 backdrop-blur-md select-none animate-in fade-in duration-200"
    >
      {/* Top Bar: Counter & Close button */}
      <div className="relative z-20 flex items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2 text-white/90">
          <Maximize2 className="h-4 w-4 text-blue-400" />
          <span className="text-xs sm:text-sm font-semibold tracking-wide">
            Full Ratio View {media.length > 1 && `(${activeIndex + 1} of ${media.length})`}
          </span>
        </div>

        <button
          onClick={onClose}
          aria-label="Close full view"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white/90 hover:bg-white/20 hover:text-white transition duration-200 focus:outline-none focus:ring-2 focus:ring-white/40"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main Viewport: Full Natural Aspect Ratio */}
      <div
        onClick={onClose}
        className="relative flex-1 flex items-center justify-center min-h-0 w-full px-2 sm:px-8 py-2 overflow-hidden cursor-zoom-out"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative max-h-full max-w-full flex items-center justify-center cursor-default"
        >
          {currentItem.media_type === "video" ? (
            <video
              src={currentItem.cloudinary_url}
              controls
              autoPlay
              className="max-h-[82vh] max-w-[94vw] w-auto h-auto rounded-xl object-contain shadow-2xl select-none"
            />
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentItem.cloudinary_url}
                alt={`Photo ${activeIndex + 1}`}
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                className="max-h-[82vh] max-w-[94vw] w-auto h-auto rounded-xl object-contain shadow-2xl transition-all duration-200 pointer-events-none select-none"
              />
              {/* Protective Shield Overlay */}
              <div
                className="absolute inset-0 z-10 pointer-events-auto"
                onContextMenu={(e) => e.preventDefault()}
              />
            </>
          )}
        </div>

        {/* Previous Navigation Arrow (Multi-image) */}
        {media.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPrev();
            }}
            aria-label="Previous photo"
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white border border-white/20 hover:bg-black/90 hover:scale-105 active:scale-95 transition backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-white/40 shadow-lg"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Next Navigation Arrow (Multi-image) */}
        {media.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            aria-label="Next photo"
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white border border-white/20 hover:bg-black/90 hover:scale-105 active:scale-95 transition backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-white/40 shadow-lg"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Bottom Thumbnails / Indicator Strip */}
      {media.length > 1 && (
        <div className="relative z-20 flex items-center justify-center gap-2 px-4 py-3 sm:py-4 overflow-x-auto max-w-full">
          {media.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => setActiveIndex(idx)}
              aria-label={`Jump to photo ${idx + 1}`}
              className={`relative h-12 w-12 shrink-0 rounded-lg overflow-hidden border-2 transition duration-200 ${
                idx === activeIndex
                  ? "border-blue-500 ring-2 ring-blue-400/50 scale-105"
                  : "border-white/20 opacity-60 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.cloudinary_url}
                alt={`Thumbnail ${idx + 1}`}
                draggable={false}
                className="h-full w-full object-cover pointer-events-none select-none"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
