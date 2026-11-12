"use client";

import React, { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Post } from "@/types";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { FormattedContent } from "@/components/FormattedContent";
import { CommentSection } from "@/components/CommentSection";
import { ConfirmModal } from "@/components/ConfirmModal";
import { ReportModal } from "@/components/ReportModal";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  MoreVertical,
  Trash2,
  Loader2,
  ExternalLink,
  Flag,
} from "lucide-react";

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const data = await api.posts.getPost(parseInt(id, 10));
        setPost(data);
        setLiked(data.is_liked_by_me);
        setLikeCount(data.like_count);
        setCommentCount(data.comment_count);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load post.");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  const handleLike = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (isLiking || !post) return;

    const prevLiked = liked;
    const prevCount = likeCount;
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    setIsLiking(true);

    try {
      const res = await api.likes.toggle(post.id);
      setLiked(res.liked);
      setLikeCount(res.like_count);
    } catch {
      setLiked(prevLiked);
      setLikeCount(prevCount);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!post) return;
    setDeleting(true);
    try {
      await api.posts.deletePost(post.id);
      router.push("/");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete post");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          {error || "Post not found."}
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Feed</span>
        </Link>
      </div>
    );
  }

  const formattedDate = new Date(post.created_at).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-6">
      {/* Header bar */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => router.back()}
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">Post</h1>
      </div>

      <article className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Author Header */}
        <div className="flex items-center justify-between p-5 pb-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/profile/${post.author.username}`}
              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white overflow-hidden shadow-2xs"
            >
              {post.author.profile_picture ? (
                <Image
                  src={post.author.profile_picture}
                  alt={post.author.username}
                  fill
                  sizes="44px"
                  className="object-cover"
                />
              ) : (
                post.author.full_name.charAt(0).toUpperCase()
              )}
            </Link>
            <div>
              <Link
                href={`/profile/${post.author.username}`}
                className="font-bold text-base text-slate-900 hover:underline dark:text-white block leading-tight"
              >
                {post.author.full_name}
              </Link>
              <span className="text-xs text-slate-400">
                @{post.author.username}
              </span>
            </div>
          </div>

          {user && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-1 w-36 rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800 z-10">
                  {user.username === post.author.username ? (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setShowDeleteModal(true);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
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

        {/* Content */}
        {post.content && (
          <div className="px-5 pb-4 text-base text-slate-900 dark:text-slate-100 leading-relaxed">
            <FormattedContent text={post.content} />
          </div>
        )}

        {/* Media Attachments - Full uncropped view */}
        {post.media && post.media.length > 0 && (
          <div className="space-y-3 px-5 pb-4">
            {post.media.map((item) => (
              <div
                key={item.id}
                className="relative rounded-2xl overflow-hidden bg-slate-950/5 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex justify-center"
              >
                {item.media_type === "video" ? (
                  <video
                    src={item.cloudinary_url}
                    controls
                    className="w-full max-h-[640px] rounded-2xl object-contain"
                  />
                ) : (
                  <a
                    href={item.cloudinary_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group relative w-full flex justify-center"
                    title="View full resolution"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.cloudinary_url}
                      alt="Post media"
                      className="max-h-[640px] w-auto max-w-full rounded-2xl object-contain transition duration-200"
                    />
                    <div className="absolute top-3 right-3 rounded-full bg-black/50 p-1.5 text-white opacity-0 group-hover:opacity-100 transition">
                      <ExternalLink className="h-4 w-4" />
                    </div>
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Date / Timestamp */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
          {formattedDate}
        </div>

        {/* Stats & Actions */}
        <div className="flex items-center gap-8 px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 text-sm">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 font-medium transition ${
              liked
                ? "text-rose-600 dark:text-rose-500"
                : "text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400"
            }`}
          >
            <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
            <span>{likeCount}</span>
          </button>

          <div className="flex items-center gap-2 font-medium text-slate-600 dark:text-slate-400">
            <MessageCircle className="h-5 w-5" />
            <span>{commentCount}</span>
          </div>
        </div>

        {/* Comments Section directly below */}
        <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
          <CommentSection
            postId={post.id}
            onCommentCountChange={(count) => setCommentCount(count)}
          />
        </div>
      </article>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Post?"
        message="Are you sure you want to delete this post? This action cannot be undone and your post media will be permanently removed."
        confirmText="Delete"
        isLoading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      {/* Community Report Modal */}
      <ReportModal
        postId={post.id}
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onReported={() => {
          router.push("/");
        }}
      />
    </div>
  );
}
