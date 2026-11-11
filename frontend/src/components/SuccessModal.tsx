"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, ArrowRight } from "lucide-react";

interface SuccessModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  actionText?: string;
  onAction: () => void;
  autoRedirectSeconds?: number;
}

export function SuccessModal({
  isOpen,
  title,
  message,
  actionText = "Continue to Sign In",
  onAction,
  autoRedirectSeconds = 4,
}: SuccessModalProps) {
  const [countdown, setCountdown] = useState(autoRedirectSeconds);

  useEffect(() => {
    if (!isOpen) return;
    setCountdown(autoRedirectSeconds);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onAction();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, autoRedirectSeconds, onAction]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-in zoom-in-95 duration-200">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/25">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <h3 className="mt-4 text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
          {title}
        </h3>

        <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
          {message}
        </p>

        <button
          type="button"
          onClick={onAction}
          className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 transition active:scale-98"
        >
          <span>{actionText}</span>
          <ArrowRight className="h-4 w-4" />
        </button>

        {autoRedirectSeconds > 0 && (
          <p className="mt-3 text-[11px] text-zinc-400">
            Redirecting automatically in {countdown}s...
          </p>
        )}
      </div>
    </div>
  );
}
