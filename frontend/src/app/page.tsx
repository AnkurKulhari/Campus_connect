"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Post, PaginatedPosts, UserProfile } from "@/types";
import { api } from "@/lib/api";
import { PostCard } from "@/components/PostCard";
import { CreatePostBox } from "@/components/CreatePostBox";
import {
  Globe,
  Users,
  Loader2,
  Sparkles,
  School,
  ShieldCheck,
  TrendingUp,
  Tag,
  X,
  GraduationCap,
  MessageSquare,
  Bell,
  Search,
  UserPlus,
  UserCheck,
  Flame,
  ArrowRight,
  Compass,
  User as UserIcon,
} from "lucide-react";

const CAMPUS_PILLS = [
  { id: "all", label: "All Campus" },
  { id: "cse", label: "CSE & IT", tag: "cse" },
  { id: "ece", label: "ECE", tag: "ece" },
  { id: "me_ce", label: "ME & Civil", tag: "mechanical" },
  { id: "placements", label: "Placements", tag: "placements" },
  { id: "hackathon", label: "Hackathons", tag: "hackathon" },
];

function HomeFeedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tagParam = searchParams.get("tag");

  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"campus" | "following">("campus");
  const [selectedPill, setSelectedPill] = useState("all");
  const [posts, setPosts] = useState<Post[]>([]);
  const [suggestions, setSuggestions] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [unreadMsgs, setUnreadMsgs] = useState(0);

  // Fetch feed
  const fetchPosts = useCallback(
    async (tab: "campus" | "following", pageNum = 1, append = false) => {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        const data: PaginatedPosts =
          tab === "following" && user
            ? await api.posts.getFollowingFeed(pageNum, 15)
            : await api.posts.getFeed(pageNum, 15);

        if (append) {
          setPosts((prev) => [...prev, ...data.posts]);
        } else {
          setPosts(data.posts);
        }
        setHasNext(data.has_next);
        setPage(pageNum);
      } catch {
        // Silently catch
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [user]
  );

  useEffect(() => {
    fetchPosts(activeTab, 1, false);
  }, [activeTab, fetchPosts]);

  // Fetch Suggested Students & Alumni for Right Sidebar
  useEffect(() => {
    if (!user) return;
    const loadSuggestions = async () => {
      try {
        const res = await api.users.getSuggestions(5);
        setSuggestions(res);
      } catch {
        // Silently catch
      }
    };
    loadSuggestions();
  }, [user]);

  // Fetch unread notification and message counts for Sidebar Badges
  useEffect(() => {
    if (!user) return;
    const fetchBadges = async () => {
      try {
        const [notifRes, msgRes] = await Promise.all([
          api.notifications.getUnreadCount(),
          api.messages.getUnreadCount(),
        ]);
        setUnreadNotifs(notifRes.unread_count);
        setUnreadMsgs(msgRes.unread_count);
      } catch {
        // Silently catch
      }
    };
    fetchBadges();
    const interval = setInterval(fetchBadges, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const handlePostCreated = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handlePostDeleted = (postId: number) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleSuggestionFollow = async (targetUsername: string) => {
    try {
      const res = await api.users.toggleFollow(targetUsername);
      setSuggestions((prev) =>
        prev.map((s) =>
          s.username === targetUsername
            ? { ...s, is_following: res.is_following }
            : s
        )
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to toggle follow");
    }
  };

  // Filter posts based on tagParam or selected pill
  const activeTag = tagParam || (selectedPill !== "all" && selectedPill !== "following" ? CAMPUS_PILLS.find((p) => p.id === selectedPill)?.tag : null);

  const displayedPosts = activeTag
    ? posts.filter((p) =>
        p.content?.toLowerCase().includes(`#${activeTag.toLowerCase()}`) ||
        p.author.branch?.toLowerCase().includes(activeTag.toLowerCase())
      )
    : posts;

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar: Student Profile & Navigation */}
        <aside className="hidden lg:block lg:col-span-3 space-y-4">
          <div className="sticky top-20 space-y-4">
            {/* Student Profile Card (Top of Left Sidebar) */}
            {user && (
              <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-[#131B2E] text-center">
                <Link
                  href={`/profile/${user.username}`}
                  className="inline-block group"
                >
                  <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-600 font-bold text-2xl text-white overflow-hidden shadow-sm ring-4 ring-white dark:ring-slate-800">
                    {user.profile_picture ? (
                      <Image
                        src={user.profile_picture}
                        alt={user.username}
                        fill
                        sizes="80px"
                        className="object-cover group-hover:scale-105 transition"
                      />
                    ) : (
                      user.full_name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <h2 className="mt-3 font-extrabold text-sm text-slate-900 dark:text-white truncate group-hover:text-blue-600 transition">
                    {user.full_name}
                  </h2>
                  <p className="text-xs text-slate-400 truncate">
                    @{user.username}
                  </p>
                </Link>
                <div className="mt-2.5">
                  <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/40 dark:border-blue-900/40">
                    {user.is_alumni ? "Alumni" : user.year || "Student"} {user.branch ? `• ${user.branch.replace(/\(.*?\)/g, "").trim()}` : ""}
                  </span>
                </div>
              </div>
            )}

            {/* Navigation Pills */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-[#131B2E]">
              <nav className="space-y-1">
                <Link
                  href="/"
                  className={`flex items-center justify-between rounded-2xl px-4 py-2.5 text-xs font-semibold transition ${
                    activeTab === "campus" && !tagParam
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/80"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Compass className="h-4 w-4" />
                    <span>Timeline</span>
                  </div>
                </Link>

                <Link
                  href="/alumni"
                  className="flex items-center justify-between rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/80 transition"
                >
                  <div className="flex items-center gap-3">
                    <GraduationCap className="h-4 w-4 text-indigo-500" />
                    <span>Alumni Circle</span>
                  </div>
                </Link>

                <Link
                  href="/messages"
                  className="flex items-center justify-between rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/80 transition"
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-4 w-4 text-blue-500" />
                    <span>Messages</span>
                  </div>
                  {unreadMsgs > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white shadow-2xs">
                      {unreadMsgs > 99 ? "99+" : unreadMsgs}
                    </span>
                  )}
                </Link>

                <Link
                  href="/notifications"
                  className="flex items-center justify-between rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/80 transition"
                >
                  <div className="flex items-center gap-3">
                    <Bell className="h-4 w-4 text-amber-500" />
                    <span>Notifications</span>
                  </div>
                  {unreadNotifs > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white shadow-2xs">
                      {unreadNotifs > 99 ? "99+" : unreadNotifs}
                    </span>
                  )}
                </Link>

                <Link
                  href="/search"
                  className="flex items-center justify-between rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/80 transition"
                >
                  <div className="flex items-center gap-3">
                    <Search className="h-4 w-4 text-emerald-500" />
                    <span>Find Students</span>
                  </div>
                </Link>

                {user && (
                  <Link
                    href={`/profile/${user.username}`}
                    className="flex items-center justify-between rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/80 transition"
                  >
                    <div className="flex items-center gap-3">
                      <UserIcon className="h-4 w-4" />
                      <span>My Profile</span>
                    </div>
                  </Link>
                )}
              </nav>
            </div>
          </div>
        </aside>

        {/* Center Feed Column */}
        <main className="col-span-12 lg:col-span-9 xl:col-span-6 space-y-4">
          {/* Header Row: Timeline Title & Filter Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <h1 className="font-extrabold text-xl text-slate-900 dark:text-white tracking-tight">
              Timeline
            </h1>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedPill("all");
                  setActiveTab("campus");
                  router.push("/");
                }}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  activeTab === "campus" && selectedPill === "all"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                Recent
              </button>

              {user && (
                <button
                  onClick={() => {
                    setSelectedPill("following");
                    setActiveTab("following");
                  }}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                    activeTab === "following"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`}
                >
                  Following
                </button>
              )}
            </div>
          </div>

          {/* Campus Branch Sub-Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CAMPUS_PILLS.map((pill) => {
              const isSelected = selectedPill === pill.id;
              return (
                <button
                  key={pill.id}
                  onClick={() => {
                    setSelectedPill(pill.id);
                    setActiveTab("campus");
                    if (pill.tag) {
                      router.push(`/?tag=${pill.tag}`);
                    } else {
                      router.push("/");
                    }
                  }}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    isSelected && activeTab === "campus"
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50 dark:border-slate-800 dark:bg-[#131B2E] dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>

          {/* Active Tag Filter Banner */}
          {tagParam && (
            <div className="flex items-center justify-between rounded-2xl bg-blue-50 border border-blue-200 px-4 py-2.5 dark:bg-blue-950/40 dark:border-blue-900">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Tag className="h-4 w-4" />
                <span className="text-xs sm:text-sm font-bold">
                  Posts tagged with #{tagParam}
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedPill("all");
                  router.push("/");
                }}
                className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 transition"
              >
                <X className="h-3 w-3" />
                <span>Clear</span>
              </button>
            </div>
          )}

          {/* Create Post Widget */}
          {user && !tagParam && <CreatePostBox onPostCreated={handlePostCreated} />}

          {/* Posts Feed */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="mt-3 text-xs">Loading campus posts...</p>
            </div>
          ) : displayedPosts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center bg-white dark:bg-[#131B2E]">
              <Sparkles className="mx-auto h-8 w-8 text-blue-500" />
              <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
                {tagParam
                  ? `No posts tagged with #${tagParam}`
                  : activeTab === "following"
                  ? "No posts from followed students yet"
                  : "No campus posts yet"}
              </h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                {tagParam
                  ? "Be the first to share an update with this tag!"
                  : activeTab === "following"
                  ? "Follow batchmates and seniors to see their updates here."
                  : "Start the conversation by publishing the first campus update!"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onPostDeleted={handlePostDeleted}
                />
              ))}

              {hasNext && !tagParam && (
                <div className="text-center pt-2">
                  <button
                    onClick={() => fetchPosts(activeTab, page + 1, true)}
                    disabled={loadingMore}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-[#131B2E] dark:text-slate-200 dark:hover:bg-slate-800 transition shadow-xs disabled:opacity-50"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Loading more...</span>
                      </>
                    ) : (
                      <span>Load More Posts</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Right Sidebar: Suggestions & Trending Topics (Desktop) */}
        <aside className="hidden xl:block xl:col-span-3 space-y-4">
          <div className="sticky top-20 space-y-4">
            {/* Who to Connect With (Suggestions) */}
            {suggestions.length > 0 && (
              <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-[#131B2E]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                    Suggestions
                  </h3>
                  <Link
                    href="/search"
                    className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    See all
                  </Link>
                </div>

                <div className="space-y-3.5">
                  {suggestions.map((peer) => (
                    <div
                      key={peer.id}
                      className="flex items-center justify-between gap-2.5"
                    >
                      <Link
                        href={`/profile/${peer.username}`}
                        className="flex items-center gap-2.5 min-w-0 flex-1 group"
                      >
                        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-xs text-white overflow-hidden shadow-2xs">
                          {peer.profile_picture ? (
                            <Image
                              src={peer.profile_picture}
                              alt={peer.username}
                              fill
                              sizes="36px"
                              className="object-cover"
                            />
                          ) : (
                            peer.full_name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs text-slate-900 dark:text-white truncate group-hover:text-blue-600 transition">
                            {peer.full_name}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {peer.year || "Student"} {peer.branch ? `• ${peer.branch.replace(/\(.*?\)/g, "").trim()}` : ""}
                          </p>
                        </div>
                      </Link>

                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/messages?user=${peer.username}`}
                          title="Message"
                          className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800 dark:hover:text-blue-400 transition"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          onClick={() => handleSuggestionFollow(peer.username)}
                          className={`rounded-full px-3.5 py-1 text-[11px] font-semibold transition ${
                            peer.is_following
                              ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                              : "bg-blue-600 text-white hover:bg-blue-700 shadow-2xs"
                          }`}
                        >
                          {peer.is_following ? "Following" : "Follow"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trending on Campus - Clean Hashtags WITHOUT fake post counts */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-[#131B2E]">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white mb-3">
                <Flame className="h-4 w-4 text-orange-500" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider">
                  Trending on Campus
                </h3>
              </div>

              <div className="space-y-1.5 text-xs">
                {[
                  { tag: "Placements2026", category: "Career" },
                  { tag: "SmartIndiaHackathon", category: "Coding" },
                  { tag: "SemesterExams", category: "Academics" },
                  { tag: "IPEC_CSI", category: "Society" },
                  { tag: "TechFest2026", category: "Event" },
                ].map((item) => (
                  <button
                    key={item.tag}
                    onClick={() => router.push(`/?tag=${item.tag}`)}
                    className="w-full flex items-center justify-between text-left group p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
                  >
                    <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                      #{item.tag}
                    </span>
                    <span className="text-[10px] rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-slate-500 dark:text-slate-400 font-medium">
                      {item.category}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Campus Verification Notice */}
            <div className="rounded-3xl border border-blue-200/70 bg-gradient-to-br from-blue-50/70 to-indigo-50/70 p-5 dark:border-blue-900/40 dark:bg-[#131B2E] shadow-xs">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-extrabold text-xs">
                <School className="h-4 w-4" />
                <span>IPEC Campus Exclusive</span>
              </div>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Connect exclusively with verified Inderprastha Engineering College students, faculty, and alumni.
              </p>
              <div className="mt-3.5 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                <ShieldCheck className="h-4 w-4" />
                <span>Roll Number & ID Verified</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <HomeFeedContent />
    </Suspense>
  );
}
