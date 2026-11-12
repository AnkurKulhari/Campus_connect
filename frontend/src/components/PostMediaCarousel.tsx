"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { PostMedia } from "@/types";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { ImageLightboxModal } from "./ImageLightboxModal";

interface PostMediaCarouselProps {
  media: PostMedia[];
}

export function PostMediaCarousel({ media }: PostMediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (!media || media.length === 0) return null;
  const total = media.length;

  // Track active slide accurately during scrolling / snapping
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const width = el.clientWidth;
    if (width > 0) {
      const idx = Math.round(el.scrollLeft / width);
      if (idx >= 0 && idx < total && idx !== currentIndex) {
        setCurrentIndex(idx);
      }
    }
  }, [total, currentIndex]);

  const scrollToSlide = (index: number) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(total - 1, index));
    const width = el.clientWidth;
    el.scrollTo({
      left: clamped * width,
      behavior: "smooth",
    });
    setCurrentIndex(clamped);
  };

  const goToPrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentIndex > 0) {
      scrollToSlide(currentIndex - 1);
    }
  };

  const goToNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentIndex < total - 1) {
      scrollToSlide(currentIndex + 1);
    }
  };

  // Keyboard navigation when user is interacting with carousel
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (currentIndex > 0) scrollToSlide(currentIndex - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (currentIndex < total - 1) scrollToSlide(currentIndex + 1);
    }
  };

  // Recalculate scroll on window resize to ensure no partial slides
  useEffect(() => {
    const handleResize = () => {
      const el = scrollContainerRef.current;
      if (!el) return;
      const width = el.clientWidth;
      el.scrollTo({
        left: currentIndex * width,
        behavior: "auto",
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [currentIndex]);

  // Single media item display
  if (total === 1) {
    const item = media[0];
    return (
      <>
        <div
          onClick={() => {
            setLightboxIndex(0);
            setLightboxOpen(true);
          }}
          onContextMenu={(e) => e.preventDefault()}
          className="relative w-full rounded-2xl overflow-hidden bg-slate-950/5 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center cursor-pointer select-none group shadow-xs"
        >
          {item.media_type === "video" ? (
            <video
              src={item.cloudinary_url}
              controls
              className="w-full max-h-[85vh] rounded-2xl object-contain select-none"
            />
          ) : (
            <div className="relative w-full flex items-center justify-center p-1 sm:p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.cloudinary_url}
                alt="Post attachment"
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                className="w-auto h-auto max-w-full max-h-[85vh] rounded-xl object-contain pointer-events-none select-none group-hover:opacity-95 transition"
              />
              {/* Download protection shield */}
              <div
                className="absolute inset-0 z-10 pointer-events-auto"
                onContextMenu={(e) => e.preventDefault()}
              />
              {/* Full View Hover Pill */}
              <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 rounded-full bg-slate-950/70 px-2.5 py-1 text-white text-[11px] font-semibold tracking-wide backdrop-blur-md opacity-0 group-hover:opacity-100 transition duration-200 pointer-events-none border border-white/10 shadow-sm">
                <Maximize2 className="h-3 w-3 text-blue-400" />
                <span>Fullscreen</span>
              </div>
            </div>
          )}
        </div>

        <ImageLightboxModal
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          media={media}
          initialIndex={lightboxIndex}
        />
      </>
    );
  }

  // Instagram-style Multi-Photo Carousel with CSS Scroll Snap
  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onContextMenu={(e) => e.preventDefault()}
      className="relative w-full h-[70vh] min-h-[380px] max-h-[800px] rounded-2xl overflow-hidden bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 shadow-md select-none group focus:outline-none flex items-center justify-center"
    >
      {/* Scroll-Snap Track: 100% flush slides, 0 glitching, native momentum physics */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {media.map((item, idx) => (
          <div
            key={item.id}
            className="w-full h-full min-w-full shrink-0 snap-center snap-always flex items-center justify-center p-2 bg-slate-950/40 relative"
          >
            {item.media_type === "video" ? (
              <video
                src={item.cloudinary_url}
                controls={idx === currentIndex}
                className="max-h-full max-w-full object-contain select-none"
              />
            ) : (
              <div
                onClick={() => {
                  setLightboxIndex(idx);
                  setLightboxOpen(true);
                }}
                className="relative h-full w-full flex items-center justify-center cursor-pointer group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.cloudinary_url}
                  alt={`Slide ${idx + 1}`}
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  className="max-h-full max-w-full w-auto h-auto rounded-xl object-contain pointer-events-none select-none group-hover:opacity-95 transition"
                />
                {/* Download protection shield */}
                <div
                  className="absolute inset-0 z-10 pointer-events-auto"
                  onContextMenu={(e) => e.preventDefault()}
                />
                {/* Full View Hover Pill */}
                <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 rounded-full bg-slate-950/70 px-2.5 py-1 text-white text-[11px] font-semibold tracking-wide backdrop-blur-md opacity-0 group-hover:opacity-100 transition duration-200 pointer-events-none border border-white/10 shadow-sm">
                  <Maximize2 className="h-3 w-3 text-blue-400" />
                  <span>Fullscreen</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Top-Right Counter Badge: e.g. "1 / 4" */}
      <div className="absolute top-3.5 right-3.5 z-20 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md border border-white/10 shadow-sm pointer-events-none">
        {currentIndex + 1} / {total}
      </div>

      {/* Navigation Arrow: Previous (Hidden on first slide like Instagram) */}
      {currentIndex > 0 && (
        <button
          type="button"
          onClick={goToPrev}
          aria-label="Previous photo"
          className="absolute left-3.5 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md border border-white/20 shadow-md hover:bg-black/80 hover:scale-105 active:scale-95 transition"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      {/* Navigation Arrow: Next (Hidden on last slide like Instagram) */}
      {currentIndex < total - 1 && (
        <button
          type="button"
          onClick={goToNext}
          aria-label="Next photo"
          className="absolute right-3.5 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md border border-white/20 shadow-md hover:bg-black/80 hover:scale-105 active:scale-95 transition"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      {/* Bottom Center Pagination Dots */}
      <div className="absolute bottom-3.5 left-0 right-0 z-20 flex items-center justify-center gap-1.5 pointer-events-auto">
        {media.map((_, dotIdx) => {
          const isActive = dotIdx === currentIndex;
          return (
            <button
              key={dotIdx}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                scrollToSlide(dotIdx);
              }}
              aria-label={`Jump to slide ${dotIdx + 1}`}
              className={`transition-all duration-300 rounded-full cursor-pointer ${
                isActive
                  ? "w-5 h-1.5 bg-blue-500 shadow-sm"
                  : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"
              }`}
            />
          );
        })}
      </div>

      <ImageLightboxModal
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        media={media}
        initialIndex={lightboxIndex}
      />
    </div>
  );
}
