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
import { ImageLightboxModal } from "./ImageLightboxModal";
import {
  Heart,
  MessageCircle,
  MoreVertical,
  Trash2,
  Flag,
  GraduationCap,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from "lucide-react";
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
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxInitialIndex, setLightboxInitialIndex] = useState(0);

  const openLightbox = (index: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setLightboxInitialIndex(index);
    setLightboxOpen(true);
  };

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
      <div className="flex items-center justify-between p-4 pb-3 relative z-30">
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
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setMenuOpen(!menuOpen);
              }}
              className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
              aria-label="Post options"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {menuOpen && (
              <>
                {/* Backdrop overlay to safely dismiss menu without triggering card or photo clicks */}
                <div
                  className="fixed inset-0 z-30"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setMenuOpen(false);
                  }}
                  onContextMenu={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setMenuOpen(false);
                  }}
                />

                {/* Dropdown Menu */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                  className="absolute right-0 mt-1 w-36 rounded-2xl border border-slate-200 bg-white py-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900 z-40 animate-in fade-in zoom-in-95 duration-100"
                >
                  {user.username === post.author.username ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setMenuOpen(false);
                        setShowDeleteModal(true);
                      }}
                      className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setMenuOpen(false);
                        setShowReportModal(true);
                      }}
                      className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-semibold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition cursor-pointer"
                    >
                      <Flag className="h-3.5 w-3.5" />
                      <span>Report Post</span>
                    </button>
                  )}
                </div>
              </>
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

      {/* Media Attachments - Strictly 3:4 Aspect Ratio on Timeline, Full Ratio on Click */}
      {post.media && post.media.length > 0 && (
        <div className="px-4 pb-3">
          {post.media.length === 1 ? (
            <div
              onClick={(e) => openLightbox(0, e)}
              onContextMenu={(e) => e.preventDefault()}
              className="relative w-full max-w-[480px] mx-auto aspect-[3/4] rounded-2xl overflow-hidden bg-slate-950/5 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center cursor-pointer group select-none shadow-xs"
            >
              {post.media[0].media_type === "video" ? (
                <video
                  src={post.media[0].cloudinary_url}
                  controls
                  className="w-full h-full object-cover rounded-2xl select-none"
                />
              ) : (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.media[0].cloudinary_url}
                    alt="Post attachment"
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                    className="w-full h-full object-cover rounded-2xl group-hover:scale-[1.02] transition duration-300 pointer-events-none select-none"
                  />
                  {/* Invisible Protective Shield Overlay */}
                  <div
                    className="absolute inset-0 z-10"
                    onContextMenu={(e) => e.preventDefault()}
                  />
                  {/* Full View Hover Pill */}
                  <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 rounded-full bg-slate-950/70 px-2.5 py-1 text-white text-[11px] font-semibold tracking-wide backdrop-blur-md opacity-0 group-hover:opacity-100 transition duration-200 pointer-events-none border border-white/10 shadow-sm">
                    <Maximize2 className="h-3 w-3 text-blue-400" />
                    <span>Full View</span>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div
              onClick={(e) => openLightbox(activeMediaIndex, e)}
              onContextMenu={(e) => e.preventDefault()}
              className="relative w-full max-w-[480px] mx-auto aspect-[3/4] rounded-2xl overflow-hidden bg-slate-950/5 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center cursor-pointer group select-none shadow-xs"
            >
              {post.media[activeMediaIndex].media_type === "video" ? (
                <video
                  src={post.media[activeMediaIndex].cloudinary_url}
                  controls
                  className="w-full h-full object-cover rounded-2xl select-none"
                />
              ) : (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.media[activeMediaIndex].cloudinary_url}
                    alt={`Photo ${activeMediaIndex + 1}`}
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                    className="w-full h-full object-cover rounded-2xl group-hover:scale-[1.02] transition duration-300 pointer-events-none select-none"
                  />
                  {/* Invisible Protective Shield Overlay */}
                  <div
                    className="absolute inset-0 z-10"
                    onContextMenu={(e) => e.preventDefault()}
                  />
                </>
              )}

              {/* Photo Counter Badge */}
              <div className="absolute top-3 right-3 z-20 flex items-center gap-1 rounded-full bg-slate-950/70 px-2.5 py-1 text-white text-[11px] font-bold tracking-wide backdrop-blur-md pointer-events-none border border-white/10 shadow-sm">
                <span>{activeMediaIndex + 1}</span>
                <span className="text-white/60">/</span>
                <span>{post.media.length}</span>
              </div>

              {/* Previous Slide Arrow */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveMediaIndex((prev) => (prev > 0 ? prev - 1 : post.media.length - 1));
                }}
                aria-label="Previous image"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-slate-950/60 text-white backdrop-blur-md border border-white/10 opacity-80 hover:opacity-100 hover:scale-105 active:scale-95 transition shadow-md"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {/* Next Slide Arrow */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveMediaIndex((prev) => (prev < post.media.length - 1 ? prev + 1 : 0));
                }}
                aria-label="Next image"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-slate-950/60 text-white backdrop-blur-md border border-white/10 opacity-80 hover:opacity-100 hover:scale-105 active:scale-95 transition shadow-md"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              {/* Indicator Dots */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 pointer-events-none">
                {post.media.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-200 ${
                      idx === activeMediaIndex
                        ? "w-5 bg-white shadow-sm"
                        : "w-1.5 bg-white/50"
                    }`}
                  />
                ))}
              </div>

              {/* Full View Hover Pill */}
              <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 rounded-full bg-slate-950/70 px-2.5 py-1 text-white text-[11px] font-semibold tracking-wide backdrop-blur-md opacity-0 group-hover:opacity-100 transition duration-200 pointer-events-none border border-white/10 shadow-sm">
                <Maximize2 className="h-3 w-3 text-blue-400" />
                <span>Full View</span>
              </div>
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

      {/* Full Ratio Image Lightbox Modal */}
      <ImageLightboxModal
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        media={post.media}
        initialIndex={lightboxInitialIndex}
      />
    </article>
  );
}
