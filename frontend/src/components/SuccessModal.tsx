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
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in zoom-in-95 duration-200">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/25">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <h3 className="mt-4 text-lg font-bold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h3>

        <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          {message}
        </p>

        <button
          type="button"
          onClick={onAction}
          className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-500 transition active:scale-98"
        >
          <span>{actionText}</span>
          <ArrowRight className="h-4 w-4" />
        </button>

        {autoRedirectSeconds > 0 && (
          <p className="mt-3 text-[11px] text-slate-400">
            Redirecting automatically in {countdown}s...
          </p>
        )}
      </div>
    </div>
  );
}
