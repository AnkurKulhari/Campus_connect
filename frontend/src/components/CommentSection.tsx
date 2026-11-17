"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Comment, PaginatedComments } from "@/types";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  Send,
  Trash2,
  Edit2,
  Check,
  X,
  MessageSquare,
  Loader2,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { ConfirmModal } from "./ConfirmModal";
import { formatTwitterTimestamp } from "@/lib/date";

interface OptimisticComment extends Comment {
  status?: "posting" | "posted" | "failed";
  tempId?: string;
  errorMessage?: string;
}

interface CommentSectionProps {
  postId: number;
  postAuthorUsername?: string;
  onCommentCountChange?: (count: number) => void;
}

export function CommentSection({
  postId,
  postAuthorUsername,
  onCommentCountChange,
}: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<OptimisticComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [deleteCommentId, setDeleteCommentId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let isMounted = true;
    api.comments
      .list(postId, 1, 50)
      .then((data: PaginatedComments) => {
        if (isMounted) {
          setComments(
            data.comments.map((c) => ({
              ...c,
              status: "posted" as const,
            }))
          );
          if (onCommentCountChange) onCommentCountChange(data.total);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [postId, onCommentCountChange]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const contentToPost = newComment.trim();
    if (!contentToPost || !user) return;

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const tempNumericId = -Date.now();

    // 1. Instantly clear input without waiting for server roundtrip
    setNewComment("");
    setIsFocused(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // 2. Build optimistic comment using currently authenticated user profile
    const optimisticComment: OptimisticComment = {
      id: tempNumericId,
      tempId,
      content: contentToPost,
      author: {
        username: user.username,
        full_name: user.full_name,
        profile_picture: user.profile_picture || null,
        course: user.course,
        branch: user.branch,
        year: user.year,
        is_alumni: user.is_alumni,
        is_id_verified: user.is_id_verified,
        linkedin_url: user.linkedin_url,
      },
      post_id: postId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: "posting",
    };

    // 3. Immediately insert comment into state & update parent count
    setComments((prev) => [...prev, optimisticComment]);
    if (onCommentCountChange) {
      onCommentCountChange(comments.length + 1);
    }

    // 4. Send background API call
    try {
      const realComment = await api.comments.create(postId, contentToPost);
      setComments((prev) =>
        prev.map((c) =>
          c.tempId === tempId
            ? { ...realComment, status: "posted" as const }
            : c
        )
      );
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to post comment";
      setComments((prev) =>
        prev.map((c) =>
          c.tempId === tempId
            ? { ...c, status: "failed" as const, errorMessage: errorMsg }
            : c
        )
      );
    }
  };

  const handleRetry = async (failedComment: OptimisticComment) => {
    if (!failedComment.tempId) return;
    const tempId = failedComment.tempId;

    // Reset status to posting
    setComments((prev) =>
      prev.map((c) =>
        c.tempId === tempId
          ? { ...c, status: "posting" as const, errorMessage: undefined }
          : c
      )
    );

    try {
      const realComment = await api.comments.create(postId, failedComment.content);
      setComments((prev) =>
        prev.map((c) =>
          c.tempId === tempId
            ? { ...realComment, status: "posted" as const }
            : c
        )
      );
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to post comment";
      setComments((prev) =>
        prev.map((c) =>
          c.tempId === tempId
            ? { ...c, status: "failed" as const, errorMessage: errorMsg }
            : c
        )
      );
    }
  };

  const handleDismissFailed = (tempId: string) => {
    setComments((prev) => prev.filter((c) => c.tempId !== tempId));
    if (onCommentCountChange) {
      onCommentCountChange(Math.max(0, comments.length - 1));
    }
  };

  const handleDelete = async () => {
    if (!deleteCommentId) return;
    setDeleting(true);
    try {
      await api.comments.delete(deleteCommentId);
      setComments((prev) => prev.filter((c) => c.id !== deleteCommentId));
      if (onCommentCountChange) {
        onCommentCountChange(Math.max(0, comments.length - 1));
      }
      setDeleteCommentId(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete comment");
    } finally {
      setDeleting(false);
    }
  };

  const handleEditSave = async (commentId: number) => {
    if (!editText.trim()) return;
    try {
      const updated = await api.comments.update(commentId, editText.trim());
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...updated, status: "posted" as const } : c
        )
      );
      setEditingId(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update comment");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewComment(e.target.value);
    // Auto-expand textarea
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
  };

  return (
    <div className="border-t border-slate-100/90 bg-slate-50/70 p-4 sm:p-5 dark:border-slate-800/80 dark:bg-slate-950/40 rounded-b-2xl">
      {/* Modern Floating Composer Box */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-5">
          <div className="flex items-start gap-3">
            {/* User Avatar */}
            <div
              onContextMenu={(e) => e.preventDefault()}
              className="relative flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 select-none items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-2xs ring-2 ring-slate-100 dark:ring-slate-800 overflow-hidden"
            >
              {user.profile_picture ? (
                <Image
                  src={user.profile_picture}
                  alt={user.full_name || user.username}
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              ) : (
                (user.full_name || user.username).charAt(0).toUpperCase()
              )}
            </div>

            {/* Input card with expanding textarea */}
            <div className="flex-1 rounded-2xl border border-slate-200/90 bg-white shadow-2xs transition-all focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/15 dark:border-slate-800 dark:bg-slate-900/90">
              <textarea
                ref={textareaRef}
                value={newComment}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                placeholder="Write a thoughtful comment... (Cmd+Enter to post)"
                maxLength={500}
                rows={isFocused || newComment.length > 0 ? 2 : 1}
                className="w-full resize-none bg-transparent px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden dark:text-white dark:placeholder:text-slate-500 leading-relaxed"
              />

              {/* Composer Toolbar (visible on focus or when typing) */}
              {(isFocused || newComment.length > 0) && (
                <div className="flex items-center justify-between border-t border-slate-100 px-3.5 py-2 dark:border-slate-800/80">
                  <span
                    className={`text-[11px] font-mono ${
                      newComment.length > 450
                        ? "text-rose-500 font-semibold"
                        : "text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    {newComment.length}/500
                  </span>

                  <div className="flex items-center gap-2">
                    {newComment.trim().length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewComment("");
                          setIsFocused(false);
                          if (textareaRef.current) {
                            textareaRef.current.style.height = "auto";
                          }
                        }}
                        className="rounded-lg px-2 py-1 text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={!newComment.trim()}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-blue-700 active:scale-95 disabled:opacity-40 disabled:hover:bg-blue-600 disabled:active:scale-100 transition cursor-pointer"
                    >
                      <Send className="h-3 w-3" />
                      <span>Comment</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-5 rounded-xl border border-slate-200/80 bg-white/70 p-3 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
          <Link
            href="/login"
            className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
          >
            Sign in
          </Link>{" "}
          to join the discussion and leave a comment.
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="space-y-3 py-2">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-start gap-3 p-2 animate-pulse">
              <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-28 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-3 w-3/4 rounded bg-slate-200/70 dark:bg-slate-800/70" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800/80 dark:text-slate-400 mb-2">
            <MessageSquare className="h-5 w-5" />
          </div>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
            No comments yet
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
            Start the conversation — share your thoughts with your classmates.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {comments.map((comment) => {
            const isAuthor =
              postAuthorUsername &&
              comment.author.username === postAuthorUsername;
            const isOwner = user && user.username === comment.author.username;
            const isPosting = comment.status === "posting";
            const isFailed = comment.status === "failed";

            return (
              <div
                key={comment.tempId || comment.id}
                className="group relative flex items-start gap-3 rounded-2xl p-2.5 transition-colors hover:bg-slate-100/70 dark:hover:bg-slate-800/40"
              >
                {/* Author Avatar */}
                <Link
                  href={`/profile/${comment.author.username}`}
                  onContextMenu={(e) => e.preventDefault()}
                  className="relative flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-2xs ring-1 ring-slate-200/80 dark:ring-slate-700/80 overflow-hidden mt-0.5"
                >
                  {comment.author.profile_picture ? (
                    <Image
                      src={comment.author.profile_picture}
                      alt={comment.author.full_name}
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                  ) : (
                    comment.author.full_name.charAt(0).toUpperCase()
                  )}
                </Link>

                {/* Content Bubble / Card */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    {/* Author Meta Details */}
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <Link
                        href={`/profile/${comment.author.username}`}
                        className="font-semibold text-xs sm:text-[13px] text-slate-900 hover:text-blue-600 dark:text-slate-100 dark:hover:text-blue-400 transition truncate"
                      >
                        {comment.author.full_name}
                      </Link>

                      {comment.author.is_id_verified && (
                        <span
                          title="Verified Student ID"
                          className="inline-flex items-center text-emerald-600 dark:text-emerald-400"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                        </span>
                      )}

                      {/* OP Badge if comment author is the post author */}
                      {isAuthor && (
                        <span className="rounded-md bg-blue-50 px-1.5 py-0.2 text-[10px] font-bold text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                          Author
                        </span>
                      )}

                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        @{comment.author.username}
                      </span>

                      {/* Academic Year Badge */}
                      {comment.author.is_alumni ? (
                        <span className="rounded-md bg-blue-50/70 dark:bg-blue-950/50 px-1.5 py-0.2 text-[9px] font-semibold text-blue-600 dark:text-blue-400">
                          Alumni
                        </span>
                      ) : comment.author.year ? (
                        <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 text-[9px] font-medium text-slate-600 dark:text-slate-300">
                          {comment.author.year}
                        </span>
                      ) : null}

                      <span className="text-slate-300 dark:text-slate-700 text-xs">
                        •
                      </span>

                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                        {isPosting
                          ? "just now"
                          : formatTwitterTimestamp(comment.created_at)}
                      </span>
                    </div>

                    {/* Action buttons (Edit & Delete) for Owner */}
                    {isOwner && !isPosting && editingId !== comment.id && (
                      <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(comment.id);
                            setEditText(comment.content);
                          }}
                          className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
                          title="Edit comment"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteCommentId(comment.id)}
                          className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 transition cursor-pointer"
                          title="Delete comment"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Comment Body / In-line Editor */}
                  {editingId === comment.id ? (
                    <div className="mt-2 space-y-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        maxLength={500}
                        rows={2}
                        className="w-full resize-none rounded-xl border border-blue-400 bg-white p-2.5 text-xs sm:text-sm text-slate-900 focus:outline-hidden dark:border-blue-500 dark:bg-slate-800 dark:text-white"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:bg-slate-800 transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditSave(comment.id)}
                          disabled={!editText.trim()}
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition cursor-pointer"
                        >
                          <Check className="h-3 w-3" />
                          <span>Save</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="mt-1 text-xs sm:text-[13px] text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap break-words">
                        {comment.content}
                      </p>

                      {/* Posting status indicator directly under it */}
                      {isPosting && (
                        <div className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-blue-600 dark:text-blue-400 animate-pulse">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Posting...</span>
                        </div>
                      )}

                      {/* Failed posting indicator directly under it with retry & dismiss */}
                      {isFailed && (
                        <div className="mt-2 flex items-center gap-2 rounded-xl bg-rose-50/80 px-2.5 py-1.5 text-xs text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/50">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate text-[11px] font-medium">
                            {comment.errorMessage || "Failed to post comment"}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRetry(comment)}
                            className="ml-auto text-[11px] font-semibold underline hover:text-rose-700 cursor-pointer shrink-0"
                          >
                            Retry
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              comment.tempId && handleDismissFailed(comment.tempId)
                            }
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer shrink-0"
                            title="Dismiss"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteCommentId !== null}
        title="Delete Comment?"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete"
        isLoading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteCommentId(null)}
      />
    </div>
  );
}
