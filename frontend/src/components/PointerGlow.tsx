"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "@/context/ThemeContext";

export function PointerGlow() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState({ x: -1000, y: -1000 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);

    if (typeof window === "undefined") return;
    if (window.matchMedia && !window.matchMedia("(hover: hover)").matches) {
      return;
    }

    let rafId: number;

    const handlePointerMove = (e: PointerEvent) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setPos({ x: e.clientX, y: e.clientY });
        setVisible(true);
      });
    };

    const handleMouseLeave = () => {
      setVisible(false);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  if (!mounted) return null;

  const glowStyle =
    theme === "dark"
      ? `radial-gradient(650px circle at ${pos.x}px ${pos.y}px, rgba(37, 99, 235, 0.13), rgba(99, 102, 241, 0.05) 40%, transparent 80%)`
      : `radial-gradient(650px circle at ${pos.x}px ${pos.y}px, rgba(37, 99, 235, 0.07), rgba(99, 102, 241, 0.03) 40%, transparent 80%)`;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-20 transition-opacity duration-300 hidden sm:block select-none"
      style={{
        opacity: visible ? 1 : 0,
        background: glowStyle,
      }}
    />
  );
}
