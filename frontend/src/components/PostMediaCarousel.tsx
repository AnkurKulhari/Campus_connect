"use client";

import React, { useState, useRef } from "react";
import { PostMedia } from "@/types";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PostMediaCarouselProps {
  media: PostMedia[];
}

export function PostMediaCarousel({ media }: PostMediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  if (!media || media.length === 0) return null;

  const total = media.length;

  const goToPrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : total - 1));
  };

  const goToNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev < total - 1 ? prev + 1 : 0));
  };

  // Touch Swipe for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 45;

    if (distance > minSwipeDistance) {
      // Swiped Left -> Next
      goToNext();
    } else if (distance < -minSwipeDistance) {
      // Swiped Right -> Prev
      goToPrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Single media item: clean, protected display
  if (total === 1) {
    const item = media[0];
    return (
      <div
        onContextMenu={(e) => e.preventDefault()}
        className="relative w-full max-h-[560px] rounded-2xl overflow-hidden bg-slate-950/5 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex justify-center select-none"
      >
        {item.media_type === "video" ? (
          <video
            src={item.cloudinary_url}
            controls
            className="w-full max-h-[560px] rounded-2xl object-contain select-none"
          />
        ) : (
          <div className="relative w-full flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.cloudinary_url}
              alt="Post attachment"
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              className="max-h-[560px] w-auto max-w-full rounded-2xl object-contain pointer-events-none select-none"
            />
            {/* Download protection shield */}
            <div
              className="absolute inset-0 z-10"
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>
        )}
      </div>
    );
  }

  // Multi-media: Instagram-style carousel
  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-[400px] sm:h-[480px] md:h-[540px] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-md select-none group"
    >
      {/* Slides Track */}
      <div
        className="flex h-full w-full transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {media.map((item, idx) => (
          <div
            key={item.id}
            className="relative min-w-full h-full flex items-center justify-center shrink-0 bg-slate-950"
          >
            {item.media_type === "video" ? (
              <video
                src={item.cloudinary_url}
                controls={idx === currentIndex}
                className="max-h-full max-w-full object-contain select-none"
              />
            ) : (
              <div className="relative h-full w-full flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.cloudinary_url}
                  alt={`Slide ${idx + 1}`}
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  className="max-h-full max-w-full object-contain pointer-events-none select-none"
                />
                {/* Download protection shield */}
                <div
                  className="absolute inset-0 z-10"
                  onContextMenu={(e) => e.preventDefault()}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Top-Right Counter Badge: e.g. "1/4" */}
      <div className="absolute top-3.5 right-3.5 z-20 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md border border-white/10 shadow-sm pointer-events-none">
        {currentIndex + 1} / {total}
      </div>

      {/* Navigation Arrow: Previous */}
      <button
        type="button"
        onClick={goToPrev}
        aria-label="Previous photo"
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md border border-white/15 opacity-80 hover:opacity-100 hover:scale-105 active:scale-95 transition shadow-md"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {/* Navigation Arrow: Next */}
      <button
        type="button"
        onClick={goToNext}
        aria-label="Next photo"
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md border border-white/15 opacity-80 hover:opacity-100 hover:scale-105 active:scale-95 transition shadow-md"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Bottom Center Pagination Dots */}
      <div className="absolute bottom-3.5 left-0 right-0 z-20 flex items-center justify-center gap-1.5">
        {media.map((_, dotIdx) => {
          const isActive = dotIdx === currentIndex;
          return (
            <button
              key={dotIdx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(dotIdx);
              }}
              aria-label={`Go to slide ${dotIdx + 1}`}
              className={`transition-all duration-300 rounded-full ${
                isActive
                  ? "w-5 h-1.5 bg-blue-500 shadow-xs"
                  : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
