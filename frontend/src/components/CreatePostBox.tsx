"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Post } from "@/types";
import { Image as ImageIcon, X, Loader2, Sparkles, GraduationCap } from "lucide-react";

export function CreatePostBox({
  onPostCreated,
}: {
  onPostCreated?: (post: Post) => void;
}) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  if (user.is_alumni || user.year === "Alumni") {
    return (
      <div className="rounded-3xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/40 dark:bg-[#131B2E] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Alumni Circle Mode</span>
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                Read-Only
              </span>
            </h3>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
              Welcome back, graduate! As an alumnus, your account has browse and networking access. Publishing new posts is reserved for currently enrolled students.
            </p>
          </div>
          <a
            href="/alumni"
            className="hidden sm:inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-xs"
          >
            Alumni Circle →
          </a>
        </div>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const selectedFiles = Array.from(e.target.files);
    if (files.length + selectedFiles.length > 5) {
      alert("You can attach up to 5 files per post.");
      return;
    }

    const newFiles = [...files, ...selectedFiles];
    setFiles(newFiles);

    // Generate previews
    const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && files.length === 0) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const newPost = await api.posts.create(
        content.trim() || null,
        files
      );
      setContent("");
      setFiles([]);
      previews.forEach((p) => URL.revokeObjectURL(p));
      setPreviews([]);
      if (onPostCreated) onPostCreated(newPost);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to publish post.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs dark:border-slate-800 dark:bg-[#131B2E] transition">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-3.5">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white overflow-hidden shadow-xs">
            {user.profile_picture ? (
              <Image
                src={user.profile_picture}
                alt={user.full_name}
                fill
                sizes="44px"
                className="object-cover"
              />
            ) : (
              user.full_name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/60 p-3 shadow-2xs">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's happening on campus? Share projects, ask seniors, or announce events..."
                rows={3}
                maxLength={1000}
                className="w-full resize-none border-0 bg-transparent p-0 text-sm text-slate-900 placeholder-slate-400 focus:ring-0 focus:outline-none dark:text-white dark:placeholder-slate-500"
              />

              {/* Quick Topic Tags Helper */}
              <div className="mt-2 flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-200/60 dark:border-slate-800">
                {["#Hackathon", "#Placements", "#Notes", "#Society"].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      if (!content.includes(tag)) {
                        setContent((prev) => (prev ? `${prev} ${tag}` : tag));
                      }
                    }}
                    className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40 dark:hover:text-blue-400 transition"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Image Preview Grid */}
            {previews.length > 0 && (
              <div className="mt-3 grid grid-cols-3 sm:grid-cols-5 gap-2">
                {previews.map((src, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800"
                  >
                    <Image
                      src={src}
                      alt="Upload preview"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="absolute top-1 right-1 rounded-full bg-black/70 p-1 text-white hover:bg-black transition"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                {error}
              </p>
            )}

            {/* Action Bar */}
            <div className="mt-3 flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={files.length >= 5 || isSubmitting}
                  className="flex items-center gap-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition disabled:opacity-40"
                >
                  <ImageIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span>Media ({files.length}/5)</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-400">
                  {content.length}/1000
                </span>
                <button
                  type="submit"
                  disabled={(!content.trim() && files.length === 0) || isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 hover:bg-blue-700 px-6 py-2 text-xs font-bold text-white shadow-xs disabled:opacity-40 transition"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Posting...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Post</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
