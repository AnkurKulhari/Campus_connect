"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Post } from "@/types";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { CommentSection } from "./CommentSection";
import { ConfirmModal } from "./ConfirmModal";
import { ReportModal } from "./ReportModal";
import { FormattedContent } from "./FormattedContent";
import { Heart, MessageCircle, MoreVertical, Trash2, Flag, GraduationCap, CheckCircle } from "lucide-react";
import { LinkedinIcon } from "@/components/icons/LinkedinIcon";

export function PostCard({
  post,
  onPostDeleted,
}: {
  post: Post;
  onPostDeleted?: (postId: number) => void;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [liked, setLiked] = useState(post.is_liked_by_me);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [commentCount, setCommentCount] = useState(post.comment_count);
  const [showComments, setShowComments] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isReported, setIsReported] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      window.location.href = "/login";
      return;
    }
    if (isLiking) return;

    // Optimistic UI update
    const previousLiked = liked;
    const previousCount = likeCount;
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    setIsLiking(true);

    try {
      const res = await api.likes.toggle(post.id);
      setLiked(res.liked);
      setLikeCount(res.like_count);
    } catch {
      setLiked(previousLiked);
      setLikeCount(previousCount);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await api.posts.deletePost(post.id);
      if (onPostDeleted) onPostDeleted(post.id);
      setShowDeleteModal(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete post");
    } finally {
      setDeleting(false);
    }
  };

  // Formatted date
  const formattedDate = new Date(post.created_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isReported) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-center dark:border-zinc-800 dark:bg-zinc-900/60 animate-in fade-in">
        <p className="text-xs text-zinc-500 font-medium">
          🚩 You reported this post. It has been removed from your feed and flagged for review.
        </p>
      </div>
    );
  }

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/profile/${post.author.username}`}
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700 overflow-hidden dark:bg-indigo-950 dark:text-indigo-300"
          >
            {post.author.profile_picture ? (
              <Image
                src={post.author.profile_picture}
                alt={post.author.username}
                fill
                sizes="40px"
                className="object-cover"
              />
            ) : (
              post.author.full_name.charAt(0).toUpperCase()
            )}
          </Link>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link
                href={`/profile/${post.author.username}`}
                className="font-semibold text-sm text-zinc-900 hover:underline dark:text-zinc-100"
              >
                {post.author.full_name}
              </Link>
              <span className="text-xs text-zinc-400">
                @{post.author.username}
              </span>

              {/* Academic Badge */}
              {post.author.is_alumni || post.author.year === "Alumni" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
                  <GraduationCap className="h-3 w-3" />
                  <span>Alumni</span>
                  {post.author.branch && <span>• {post.author.branch.replace(/\(.*?\)/g, "").trim()}</span>}
                </span>
              ) : post.author.year ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                  <span>{post.author.year}</span>
                  {post.author.branch && <span>• {post.author.branch.replace(/\(.*?\)/g, "").trim()}</span>}
                </span>
              ) : null}

              {/* Verified Student Badge */}
              {post.author.is_id_verified && (
                <span
                  title="Verified Student ID"
                  className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                </span>
              )}

              {/* LinkedIn Networking Link */}
              {post.author.linkedin_url && (
                <a
                  href={post.author.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Connect on LinkedIn"
                  className="text-zinc-400 hover:text-blue-600 transition"
                >
                  <LinkedinIcon className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
            <Link
              href={`/posts/${post.id}`}
              className="text-[11px] text-zinc-400 hover:underline"
            >
              {formattedDate}
            </Link>
          </div>
        </div>

        {/* Post Options Menu */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-1 w-36 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800 z-10">
                {user.username === post.author.username ? (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setShowDeleteModal(true);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setShowReportModal(true);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                  >
                    <Flag className="h-3.5 w-3.5" />
                    <span>Report Post</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content - Click to view post detail */}
      {post.content && (
        <div
          onClick={() => router.push(`/posts/${post.id}`)}
          className="px-4 pb-3 text-zinc-800 dark:text-zinc-200 text-sm cursor-pointer"
        >
          <FormattedContent text={post.content} />
        </div>
      )}

      {/* Media Attachments - Natural aspect ratio (Twitter style) */}
      {post.media && post.media.length > 0 && (
        <div className="px-4 pb-3">
          {post.media.length === 1 ? (
            // Single image: preserves original photo aspect ratio up to max-h-[520px]
            <div
              onClick={() => router.push(`/posts/${post.id}`)}
              className="relative w-full max-h-[520px] rounded-xl overflow-hidden bg-zinc-950/5 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex justify-center cursor-pointer group"
            >
              {post.media[0].media_type === "video" ? (
                <video
                  src={post.media[0].cloudinary_url}
                  controls
                  className="max-h-[520px] w-auto max-w-full rounded-xl object-contain"
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={post.media[0].cloudinary_url}
                  alt="Post attachment"
                  className="max-h-[520px] w-auto max-w-full rounded-xl object-contain group-hover:opacity-95 transition duration-200"
                />
              )}
            </div>
          ) : (
            // Multiple images: clean grid
            <div
              className={`grid gap-1.5 ${
                post.media.length === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"
              }`}
            >
              {post.media.map((item) => (
                <div
                  key={item.id}
                  onClick={() => router.push(`/posts/${post.id}`)}
                  className="relative aspect-square w-full rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 cursor-pointer group"
                >
                  {item.media_type === "video" ? (
                    <video
                      src={item.cloudinary_url}
                      controls
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Image
                      src={item.cloudinary_url}
                      alt="Post attachment"
                      fill
                      sizes="(max-width: 768px) 100vw, 500px"
                      className="object-cover group-hover:scale-105 transition duration-300"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer / Action Counts */}
      <div className="flex items-center gap-6 px-4 py-3 border-t border-zinc-100 dark:border-zinc-800/80 text-xs text-zinc-500">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 font-medium transition ${
            liked
              ? "text-rose-600 dark:text-rose-500"
              : "text-zinc-600 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400"
          }`}
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
          <span>{likeCount}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 font-medium text-zinc-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition"
        >
          <MessageCircle className="h-4 w-4" />
          <span>{commentCount}</span>
        </button>
      </div>

      {/* Inline Comment Section Toggle */}
      {showComments && (
        <CommentSection
          postId={post.id}
          onCommentCountChange={(count) => setCommentCount(count)}
        />
      )}

      {/* Custom Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Post?"
        message="Are you sure you want to delete this post? This cannot be undone and any attached media will be permanently deleted."
        confirmText="Delete"
        isLoading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteModal(false)}
      />

      {/* Community Report Modal */}
      <ReportModal
        postId={post.id}
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onReported={() => {
          setIsReported(true);
        }}
      />
    </article>
  );
}
