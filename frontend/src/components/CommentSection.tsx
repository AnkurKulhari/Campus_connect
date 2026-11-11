"use client";

import React, { useState, useEffect } from "react";
import { Comment, PaginatedComments } from "@/types";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Send, Trash2, Edit2, Check, X, MessageSquare, Loader2 } from "lucide-react";
import { ConfirmModal } from "./ConfirmModal";

export function CommentSection({
  postId,
  onCommentCountChange,
}: {
  postId: number;
  onCommentCountChange?: (count: number) => void;
}) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [deleteCommentId, setDeleteCommentId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    api.comments
      .list(postId, 1, 50)
      .then((data: PaginatedComments) => {
        if (isMounted) {
          setComments(data.comments);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const added = await api.comments.create(postId, newComment.trim());
      setComments((prev) => [...prev, added]);
      setNewComment("");
      if (onCommentCountChange) onCommentCountChange(comments.length + 1);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteCommentId) return;
    setDeleting(true);
    try {
      await api.comments.delete(deleteCommentId);
      setComments((prev) => prev.filter((c) => c.id !== deleteCommentId));
      if (onCommentCountChange) onCommentCountChange(comments.length - 1);
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
        prev.map((c) => (c.id === commentId ? updated : c))
      );
      setEditingId(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update comment");
    }
  };

  return (
    <div className="border-t border-zinc-100 bg-zinc-50/70 p-4 dark:border-zinc-800/80 dark:bg-zinc-900/40 rounded-b-xl">
      {/* Input */}
      {user ? (
        <form onSubmit={handleSubmit} className="flex items-center gap-2 mb-4">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            maxLength={500}
            className="flex-1 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          />
          <button
            type="submit"
            disabled={!newComment.trim() || submitting}
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 p-2 text-white hover:bg-indigo-500 disabled:opacity-40 transition"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      ) : (
        <p className="text-xs text-zinc-500 mb-3">
          <a href="/login" className="text-indigo-600 font-medium hover:underline">
            Sign in
          </a>{" "}
          to leave a comment.
        </p>
      )}

      {/* List */}
      {loading ? (
        <p className="text-xs text-zinc-400 py-2">Loading comments...</p>
      ) : comments.length === 0 ? (
        <div className="flex items-center gap-2 py-3 text-xs text-zinc-400">
          <MessageSquare className="h-3.5 w-3.5" />
          <span>No comments yet. Be the first to chime in!</span>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="group flex items-start justify-between gap-3 text-sm"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <a
                    href={`/profile/${comment.author.username}`}
                    className="font-semibold text-zinc-900 hover:text-indigo-600 dark:text-zinc-100 dark:hover:text-indigo-400 text-xs"
                  >
                    {comment.author.full_name}
                  </a>
                  <span className="text-xs text-zinc-400">
                    @{comment.author.username}
                  </span>
                </div>

                {editingId === comment.id ? (
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="flex-1 rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    />
                    <button
                      onClick={() => handleEditSave(comment.id)}
                      className="text-green-600 hover:text-green-700"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-zinc-400 hover:text-zinc-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <p className="mt-0.5 text-zinc-700 dark:text-zinc-300 text-xs sm:text-sm">
                    {comment.content}
                  </p>
                )}
              </div>

              {user && user.username === comment.author.username && editingId !== comment.id && (
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition">
                  <button
                    onClick={() => {
                      setEditingId(comment.id);
                      setEditText(comment.content);
                    }}
                    className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => setDeleteCommentId(comment.id)}
                    className="p-1 text-zinc-400 hover:text-red-600"
                    title="Delete Comment"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Custom Confirmation Modal */}
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
