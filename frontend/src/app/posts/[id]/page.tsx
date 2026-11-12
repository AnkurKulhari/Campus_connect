"use client";

import React, { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Post, UserProfile } from "@/types";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { FormattedContent } from "@/components/FormattedContent";
import { CommentSection } from "@/components/CommentSection";
import { ConfirmModal } from "@/components/ConfirmModal";
import { ReportModal } from "@/components/ReportModal";
import { PostMediaCarousel } from "@/components/PostMediaCarousel";
import { TrendingTopicsCard } from "@/components/TrendingTopicsCard";
import { AuthGuard } from "@/components/AuthGuard";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  MoreVertical,
  Trash2,
  Loader2,
  Flag,
  Share2,
  Compass,
  GraduationCap,
  Bell,
  Search,
  School,
  ShieldCheck,
  Flame,
  UserPlus,
  UserCheck,
  User as UserIcon,
  MessageSquare,
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
  const [authorProfile, setAuthorProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const data = await api.posts.getPost(parseInt(id, 10));
        setPost(data);
        setLiked(data.is_liked_by_me);
        setLikeCount(data.like_count);
        setCommentCount(data.comment_count);

        // Fetch author's profile for the right sidebar
        try {
          const profileData = await api.users.getProfile(data.author.username);
          setAuthorProfile(profileData);
        } catch {
          // Author profile load failure is non-blocking
        }
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

  const handleToggleFollow = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!authorProfile || isFollowLoading) return;

    setIsFollowLoading(true);
    const prevFollowing = authorProfile.is_following;
    const prevCount = authorProfile.followers_count;

    setAuthorProfile({
      ...authorProfile,
      is_following: !prevFollowing,
      followers_count: prevFollowing ? prevCount - 1 : prevCount + 1,
    });

    try {
      const res = await api.users.toggleFollow(authorProfile.username);
      setAuthorProfile((prev) =>
        prev
          ? {
              ...prev,
              is_following: res.is_following,
              followers_count: res.followers_count,
            }
          : prev
      );
    } catch {
      setAuthorProfile((prev) =>
        prev
          ? {
              ...prev,
              is_following: prevFollowing,
              followers_count: prevCount,
            }
          : prev
      );
    } finally {
      setIsFollowLoading(false);
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

  const handleShare = async () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 2) {
      router.back();
    } else {
      router.push("/");
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
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-base font-semibold text-slate-900 dark:text-white">
          {error || "Post not found or has been deleted."}
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-sm"
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
    <AuthGuard>
      <div className="mx-auto max-w-7xl px-3 sm:px-6 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar: Campus Navigation */}
        <aside className="hidden lg:block lg:col-span-3 space-y-4">
          <div className="sticky top-20 space-y-4">
            {/* Navigation Pills */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-[#131B2E]">
              <nav className="space-y-1">
                <Link
                  href="/"
                  className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/80 transition"
                >
                  <Compass className="h-4 w-4 text-blue-500" />
                  <span>Timeline</span>
                </Link>

                <Link
                  href="/alumni"
                  className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/80 transition"
                >
                  <GraduationCap className="h-4 w-4 text-indigo-500" />
                  <span>Alumni Circle</span>
                </Link>

                <Link
                  href="/messages"
                  className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/80 transition"
                >
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                  <span>Messages</span>
                </Link>

                <Link
                  href="/notifications"
                  className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/80 transition"
                >
                  <Bell className="h-4 w-4 text-amber-500" />
                  <span>Notifications</span>
                </Link>

                <Link
                  href="/search"
                  className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/80 transition"
                >
                  <Search className="h-4 w-4 text-emerald-500" />
                  <span>Find Students</span>
                </Link>

                {user && (
                  <Link
                    href={`/profile/${user.username}`}
                    className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/80 transition"
                  >
                    <UserIcon className="h-4 w-4" />
                    <span>My Profile</span>
                  </Link>
                )}
              </nav>
            </div>

            {/* Campus Verification Badge */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 p-5 text-white shadow-md border border-blue-500/30">
              <div className="relative z-10">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-bold text-white border border-white/20">
                  <School className="h-3 w-3 text-blue-200" />
                  <span>IPEC Campus Exclusive</span>
                </div>
                <p className="mt-2 text-xs text-blue-100 leading-relaxed font-normal">
                  Authentic discussion exclusively among verified IPEC students and graduates.
                </p>
                <div className="mt-3 inline-flex items-center gap-1 text-[11px] text-emerald-300 font-bold">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>ID Card Verified Network</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Center Main Column: Post & Instagram-Style Media Carousel */}
        <main className="col-span-12 lg:col-span-9 xl:col-span-6 space-y-4">
          {/* Header bar with Back button */}
          <div className="flex items-center justify-between px-1">
            <button
              onClick={handleBack}
              className="group flex items-center gap-2 rounded-xl py-1.5 px-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              <span>Back</span>
            </button>
            <span className="text-xs font-semibold text-slate-400">Post Details</span>
          </div>

          <article className="rounded-3xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-[#131B2E] overflow-hidden">
            {/* Author Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 pb-3 relative z-30">
              <div className="flex items-center gap-3 min-w-0">
                <Link
                  href={`/profile/${post.author.username}`}
                  onContextMenu={(e) => e.preventDefault()}
                  className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white overflow-hidden shadow-2xs select-none"
                >
                  {post.author.profile_picture ? (
                    <>
                      <Image
                        src={post.author.profile_picture}
                        alt={post.author.username}
                        fill
                        draggable={false}
                        sizes="48px"
                        className="object-cover pointer-events-none select-none"
                      />
                      <div className="absolute inset-0 z-10" onContextMenu={(e) => e.preventDefault()} />
                    </>
                  ) : (
                    post.author.full_name.charAt(0).toUpperCase()
                  )}
                </Link>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Link
                      href={`/profile/${post.author.username}`}
                      className="font-extrabold text-sm text-slate-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400 truncate leading-tight transition"
                    >
                      {post.author.full_name}
                    </Link>
                    {post.author.is_id_verified && (
                      <span title="Verified Student ID">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate mt-0.5">
                    <span>@{post.author.username}</span>
                    {post.author.year && (
                      <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.2 text-[10px] font-semibold text-slate-600 dark:text-slate-300 shrink-0">
                        {post.author.year}
                      </span>
                    )}
                    {post.author.branch && (
                      <span className="truncate">
                        • {post.author.branch.replace(/\(.*?\)/g, "").trim()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Dropdown Menu */}
              {user && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setMenuOpen(!menuOpen);
                    }}
                    className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
                    aria-label="Post actions"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  {menuOpen && (
                    <>
                      {/* Backdrop overlay to safely dismiss menu */}
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
                            <span>Delete Post</span>
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

            {/* Post Caption / Text */}
            {post.content && (
              <div className="px-4 sm:px-5 pb-3.5 text-sm sm:text-base text-slate-900 dark:text-slate-100 leading-relaxed">
                <FormattedContent text={post.content} />
              </div>
            )}

            {/* Instagram-Style Multi-Photo Carousel */}
            {post.media && post.media.length > 0 && (
              <div className="px-4 sm:px-5 pb-4">
                <PostMediaCarousel media={post.media} />
              </div>
            )}

            {/* Date / Timestamp */}
            <div className="px-4 sm:px-5 py-2.5 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400">
              {formattedDate}
            </div>

            {/* Action Bar: Like, Comments, Share */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
              <div className="flex items-center gap-6">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-1.5 font-bold transition ${
                    liked
                      ? "text-rose-600 dark:text-rose-500"
                      : "text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400"
                  }`}
                >
                  <Heart className={`h-4.5 w-4.5 ${liked ? "fill-current" : ""}`} />
                  <span>{likeCount} {likeCount === 1 ? "Like" : "Likes"}</span>
                </button>

                <div className="flex items-center gap-1.5 font-bold text-slate-600 dark:text-slate-400">
                  <MessageCircle className="h-4.5 w-4.5" />
                  <span>{commentCount} {commentCount === 1 ? "Comment" : "Comments"}</span>
                </div>
              </div>

              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 font-semibold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition"
              >
                <Share2 className="h-4 w-4" />
                <span>{copied ? "Link Copied!" : "Share"}</span>
              </button>
            </div>

            {/* Comments Section */}
            <div className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 p-1">
              <CommentSection
                postId={post.id}
                onCommentCountChange={(count) => setCommentCount(count)}
              />
            </div>
          </article>
        </main>

        {/* Right Sidebar: Author Profile Card & Trending Topics */}
        <aside className="hidden xl:block xl:col-span-3 space-y-4">
          <div className="sticky top-20 space-y-4">
            {/* About the Author Card */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-[#131B2E]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                  Author Info
                </h3>
                <Link
                  href={`/profile/${post.author.username}`}
                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View Profile →
                </Link>
              </div>

              <div className="flex items-start gap-3.5">
                <Link
                  href={`/profile/${post.author.username}`}
                  onContextMenu={(e) => e.preventDefault()}
                  className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-lg text-white overflow-hidden shadow-2xs select-none"
                >
                  {post.author.profile_picture ? (
                    <>
                      <Image
                        src={post.author.profile_picture}
                        alt={post.author.username}
                        fill
                        draggable={false}
                        sizes="56px"
                        className="object-cover pointer-events-none select-none"
                      />
                      <div className="absolute inset-0 z-10" onContextMenu={(e) => e.preventDefault()} />
                    </>
                  ) : (
                    post.author.full_name.charAt(0).toUpperCase()
                  )}
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/profile/${post.author.username}`}
                      className="font-extrabold text-sm text-slate-900 dark:text-white truncate hover:underline"
                    >
                      {post.author.full_name}
                    </Link>
                    {post.author.is_id_verified && (
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate">@{post.author.username}</p>

                  <div className="mt-1.5 inline-block rounded-full bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-300">
                    {post.author.year || "Student"} {post.author.branch ? `• ${post.author.branch.replace(/\(.*?\)/g, "").trim()}` : ""}
                  </div>
                </div>
              </div>

              {authorProfile?.bio && (
                <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                  {authorProfile.bio}
                </p>
              )}

              {/* Author Stats Row */}
              {authorProfile && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-around text-center text-xs">
                  <div>
                    <span className="font-extrabold text-slate-900 dark:text-white block">
                      {authorProfile.posts_count}
                    </span>
                    <span className="text-[10px] text-slate-400">Posts</span>
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-900 dark:text-white block">
                      {authorProfile.followers_count}
                    </span>
                    <span className="text-[10px] text-slate-400">Followers</span>
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-900 dark:text-white block">
                      {authorProfile.following_count}
                    </span>
                    <span className="text-[10px] text-slate-400">Following</span>
                  </div>
                </div>
              )}

              {/* Follow / Message Button */}
              {user && user.username !== post.author.username && authorProfile && (
                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={handleToggleFollow}
                    disabled={isFollowLoading}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition shadow-2xs ${
                      authorProfile.is_following
                        ? "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {authorProfile.is_following ? (
                      <>
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-3.5 w-3.5" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>

                  <Link
                    href={`/messages?user=${post.author.username}`}
                    title="Send Message"
                    className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>

            {/* Trending on Campus - Dynamic Topics from DB */}
            <TrendingTopicsCard />
          </div>
        </aside>
      </div>

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
    </AuthGuard>
  );
}
