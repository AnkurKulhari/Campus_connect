"use client";

import React, { useState } from "react";
import { Flag, X, Loader2, ShieldAlert } from "lucide-react";
import { api } from "@/lib/api";

const REPORT_REASONS = [
  "18+ Adult or Explicit Content",
  "Harassment, Bullying or Defamation",
  "Hate Speech or Discrimination",
  "Spam, Scam or Impersonation",
  "Violence or Illegal Activity",
  "Other Community Guidelines Violation",
];

export function ReportModal({
  postId,
  isOpen,
  onClose,
  onReported,
}: {
  postId: number;
  isOpen: boolean;
  onClose: () => void;
  onReported?: () => void;
}) {
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await api.posts.reportPost(postId, selectedReason, details.trim() || undefined);
      setSuccess(true);
      setTimeout(() => {
        if (onReported) onReported();
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit report.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 transition-all">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5 text-zinc-900 dark:text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
              <Flag className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Report Post</h3>
              <p className="text-[11px] text-zinc-500">
                Help keep the campus network safe
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-950/60 dark:text-green-400">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
              Report Submitted
            </h4>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto">
              Thank you. This post has been flagged and will be automatically
              quarantined if reported by multiple campus peers.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {error && (
              <p className="rounded-lg bg-red-50 p-2 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-400">
                {error}
              </p>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Reason for Reporting
              </label>
              <div className="space-y-1.5">
                {REPORT_REASONS.map((reason) => (
                  <label
                    key={reason}
                    className={`flex items-center gap-2.5 rounded-lg border p-2.5 text-xs cursor-pointer transition ${
                      selectedReason === reason
                        ? "border-indigo-600 bg-indigo-50/60 font-semibold text-indigo-900 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-200"
                        : "border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
                    }`}
                  >
                    <input
                      type="radio"
                      name="report_reason"
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={() => setSelectedReason(reason)}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Additional Details (Optional)
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={2}
                maxLength={300}
                placeholder="Provide context if necessary..."
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-amber-500 transition disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Report</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
