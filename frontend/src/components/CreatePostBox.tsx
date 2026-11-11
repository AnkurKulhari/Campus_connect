"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Post } from "@/types";
import { Image as ImageIcon, X, Loader2, Sparkles } from "lucide-react";

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
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700 overflow-hidden dark:bg-indigo-950 dark:text-indigo-300">
            {user.profile_picture ? (
              <Image
                src={user.profile_picture}
                alt={user.full_name}
                fill
                sizes="40px"
                className="object-cover"
              />
            ) : (
              user.full_name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's happening on campus?"
              rows={3}
              maxLength={1000}
              className="w-full resize-none border-0 bg-transparent p-0 text-sm text-zinc-900 placeholder-zinc-400 focus:ring-0 focus:outline-none dark:text-white"
            />

            {/* Image Preview Grid */}
            {previews.length > 0 && (
              <div className="mt-3 grid grid-cols-3 sm:grid-cols-5 gap-2">
                {previews.map((src, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800"
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
            <div className="mt-3 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/80 pt-3">
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
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition disabled:opacity-40"
                >
                  <ImageIcon className="h-4 w-4 text-indigo-500" />
                  <span>Media ({files.length}/5)</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] text-zinc-400">
                  {content.length}/1000
                </span>
                <button
                  type="submit"
                  disabled={(!content.trim() && files.length === 0) || isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500 disabled:opacity-40 transition"
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
