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
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-900/60 animate-in fade-in">
        <p className="text-xs text-slate-500 font-medium">
          🚩 You reported this post. It has been removed from your feed and flagged for review.
        </p>
      </div>
    );
  }

  return (
    <article className="rounded-3xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-[#131B2E] overflow-hidden transition-all hover:border-slate-300 dark:hover:border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/profile/${post.author.username}`}
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white overflow-hidden shadow-2xs"
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
                className="font-bold text-sm text-slate-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400 transition"
              >
                {post.author.full_name}
              </Link>
              <span className="text-xs text-slate-400">
                @{post.author.username}
              </span>

              {/* Academic Badge */}
              {post.author.is_alumni || post.author.year === "Alumni" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/40 dark:border-blue-900/40">
                  <GraduationCap className="h-3 w-3" />
                  <span>Alumni</span>
                  {post.author.branch && <span>• {post.author.branch.replace(/\(.*?\)/g, "").trim()}</span>}
                </span>
              ) : post.author.year ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/40 dark:border-blue-900/40">
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
                  className="text-slate-400 hover:text-[#0077b5] transition"
                >
                  <LinkedinIcon className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
            <Link
              href={`/posts/${post.id}`}
              className="text-[11px] text-slate-400 hover:underline"
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
              className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-1 w-36 rounded-2xl border border-slate-200 bg-white py-1.5 shadow-lg dark:border-slate-800 dark:bg-slate-900 z-10">
                {user.username === post.author.username ? (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setShowDeleteModal(true);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
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
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-semibold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
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
          className="px-4 pb-3 text-slate-800 dark:text-slate-200 text-sm cursor-pointer leading-relaxed"
        >
          <FormattedContent text={post.content} />
        </div>
      )}

      {/* Media Attachments - Natural aspect ratio */}
      {post.media && post.media.length > 0 && (
        <div className="px-4 pb-3">
          {post.media.length === 1 ? (
            <div
              onClick={() => router.push(`/posts/${post.id}`)}
              onContextMenu={(e) => e.preventDefault()}
              className="relative w-full max-h-[520px] rounded-2xl overflow-hidden bg-slate-950/5 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex justify-center cursor-pointer group select-none"
            >
              {post.media[0].media_type === "video" ? (
                <video
                  src={post.media[0].cloudinary_url}
                  controls
                  className="max-h-[520px] w-auto max-w-full rounded-2xl object-contain select-none"
                />
              ) : (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.media[0].cloudinary_url}
                    alt="Post attachment"
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                    className="max-h-[520px] w-auto max-w-full rounded-2xl object-contain group-hover:opacity-95 transition duration-200 pointer-events-none select-none"
                  />
                  {/* Invisible Protective Shield Overlay */}
                  <div
                    className="absolute inset-0 z-10"
                    onContextMenu={(e) => e.preventDefault()}
                  />
                </>
              )}
            </div>
          ) : (
            <div
              className={`grid gap-2 select-none ${
                post.media.length === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"
              }`}
            >
              {post.media.map((item) => (
                <div
                  key={item.id}
                  onClick={() => router.push(`/posts/${post.id}`)}
                  onContextMenu={(e) => e.preventDefault()}
                  className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 cursor-pointer group select-none"
                >
                  {item.media_type === "video" ? (
                    <video
                      src={item.cloudinary_url}
                      controls
                      className="h-full w-full object-cover select-none"
                    />
                  ) : (
                    <>
                      <Image
                        src={item.cloudinary_url}
                        alt="Post attachment"
                        fill
                        draggable={false}
                        onDragStart={(e) => e.preventDefault()}
                        sizes="(max-width: 768px) 100vw, 500px"
                        className="object-cover group-hover:scale-105 transition duration-300 pointer-events-none select-none"
                      />
                      {/* Invisible Protective Shield Overlay */}
                      <div
                        className="absolute inset-0 z-10"
                        onContextMenu={(e) => e.preventDefault()}
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer / Action Counts */}
      <div className="flex items-center gap-6 px-4 py-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 font-semibold transition ${
            liked
              ? "text-rose-600 dark:text-rose-500"
              : "hover:text-rose-600"
          }`}
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
          <span>{likeCount}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition"
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
