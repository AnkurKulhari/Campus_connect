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

  // Fetch Suggested Students & Alumni for the Right Sidebar
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
  const activeTag = tagParam || (selectedPill !== "all" ? CAMPUS_PILLS.find((p) => p.id === selectedPill)?.tag : null);

  const displayedPosts = activeTag
    ? posts.filter((p) =>
        p.content?.toLowerCase().includes(`#${activeTag.toLowerCase()}`) ||
        p.author.branch?.toLowerCase().includes(activeTag.toLowerCase())
      )
    : posts;

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 py-5">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar: Quick Navigation & Student Card (Desktop Only) */}
        <aside className="hidden lg:block lg:col-span-3 space-y-4">
          <div className="sticky top-20 space-y-4">
            {/* Quick Navigation Panel */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
              <nav className="space-y-1">
                <Link
                  href="/"
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                    activeTab === "campus" && !tagParam
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  }`}
                >
                  <Globe className="h-4 w-4" />
                  <span>Campus Feed</span>
                </Link>

                <Link
                  href="/alumni"
                  className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition"
                >
                  <GraduationCap className="h-4 w-4 text-violet-500" />
                  <span>Alumni Circle</span>
                </Link>

                <Link
                  href="/messages"
                  className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition"
                >
                  <MessageSquare className="h-4 w-4 text-indigo-500" />
                  <span>Direct Messages</span>
                </Link>

                <Link
                  href="/notifications"
                  className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition"
                >
                  <Bell className="h-4 w-4 text-amber-500" />
                  <span>Notifications</span>
                </Link>

                <Link
                  href="/search"
                  className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition"
                >
                  <Search className="h-4 w-4 text-emerald-500" />
                  <span>Find Students</span>
                </Link>
              </nav>
            </div>

            {/* Current Student Profile Mini Card */}
            {user && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                <Link
                  href={`/profile/${user.username}`}
                  className="flex items-center gap-3 group"
                >
                  <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 font-bold text-sm text-white overflow-hidden shadow-xs">
                    {user.profile_picture ? (
                      <Image
                        src={user.profile_picture}
                        alt={user.username}
                        fill
                        sizes="44px"
                        className="object-cover"
                      />
                    ) : (
                      user.full_name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-zinc-900 dark:text-white truncate group-hover:underline">
                      {user.full_name}
                    </p>
                    <p className="text-[11px] text-zinc-400 truncate">@{user.username}</p>
                    <span className="mt-1 inline-block rounded-md bg-indigo-50 px-1.5 py-0.2 text-[10px] font-medium text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                      {user.is_alumni ? "Alumni" : user.year || "Student"}
                    </span>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </aside>

        {/* Center Feed Column */}
        <main className="col-span-12 lg:col-span-9 xl:col-span-6 space-y-4">
          {/* Top Feed Filter Pills (Lumina Inspired) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CAMPUS_PILLS.map((pill) => {
              const isSelected = selectedPill === pill.id;
              return (
                <button
                  key={pill.id}
                  onClick={() => {
                    setSelectedPill(pill.id);
                    if (pill.tag) {
                      router.push(`/?tag=${pill.tag}`);
                    } else {
                      router.push("/");
                    }
                  }}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    isSelected
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs"
                      : "bg-white text-zinc-600 border border-zinc-200/80 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  }`}
                >
                  {pill.label}
                </button>
              );
            })}

            {user && (
              <button
                onClick={() => {
                  setSelectedPill("following");
                  setActiveTab(activeTab === "following" ? "campus" : "following");
                }}
                className={`shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  activeTab === "following"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-white text-zinc-600 border border-zinc-200/80 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                <span>Following</span>
              </button>
            )}
          </div>

          {/* Active Tag Filter Banner */}
          {tagParam && (
            <div className="flex items-center justify-between rounded-xl bg-indigo-50 border border-indigo-200 px-4 py-2.5 dark:bg-indigo-950/40 dark:border-indigo-900/60">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                <Tag className="h-4 w-4" />
                <span className="text-xs sm:text-sm font-semibold">
                  Posts tagged with #{tagParam}
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedPill("all");
                  router.push("/");
                }}
                className="flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-semibold text-zinc-700 shadow-xs hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300 transition"
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
            <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <p className="mt-3 text-xs">Loading campus posts...</p>
            </div>
          ) : displayedPosts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center bg-white dark:bg-zinc-900">
              <Sparkles className="mx-auto h-8 w-8 text-indigo-500" />
              <h3 className="mt-3 text-sm font-semibold text-zinc-900 dark:text-white">
                {tagParam
                  ? `No posts tagged with #${tagParam}`
                  : activeTab === "following"
                  ? "No posts from followed students yet"
                  : "No campus posts yet"}
              </h3>
              <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
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
                    className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition shadow-xs disabled:opacity-50"
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
            {/* Who to Connect With (Socially & Lumina Inspired) */}
            {suggestions.length > 0 && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                    Who to Connect With
                  </h3>
                  <Link
                    href="/search"
                    className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    View All
                  </Link>
                </div>

                <div className="space-y-3">
                  {suggestions.map((peer) => (
                    <div
                      key={peer.id}
                      className="flex items-center justify-between gap-2.5"
                    >
                      <Link
                        href={`/profile/${peer.username}`}
                        className="flex items-center gap-2.5 min-w-0 flex-1 group"
                      >
                        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 font-bold text-xs text-white overflow-hidden shadow-xs">
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
                          <p className="font-bold text-xs text-zinc-900 dark:text-white truncate group-hover:underline">
                            {peer.full_name}
                          </p>
                          <p className="text-[11px] text-zinc-400 truncate">
                            {peer.year || "Student"} {peer.branch ? `• ${peer.branch.replace(/\(.*?\)/g, "").trim()}` : ""}
                          </p>
                        </div>
                      </Link>

                      <div className="flex items-center gap-1">
                        <Link
                          href={`/messages?user=${peer.username}`}
                          title="Message"
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-indigo-600 dark:hover:bg-zinc-800 transition"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          onClick={() => handleSuggestionFollow(peer.username)}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                            peer.is_following
                              ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                              : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-2xs"
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

            {/* Trending on Campus (Lumina Inspired) */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center gap-2 text-zinc-900 dark:text-white mb-3">
                <Flame className="h-4 w-4 text-amber-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Trending on Campus
                </h3>
              </div>

              <div className="space-y-2.5 text-xs">
                {[
                  { tag: "Placements2026", count: "48 posts", category: "Career" },
                  { tag: "SmartIndiaHackathon", count: "32 posts", category: "Coding" },
                  { tag: "SemesterExams", count: "25 posts", category: "Academics" },
                  { tag: "IPEC_CSI", count: "19 posts", category: "Society" },
                  { tag: "TechFest2026", count: "14 posts", category: "Event" },
                ].map((item) => (
                  <button
                    key={item.tag}
                    onClick={() => router.push(`/?tag=${item.tag}`)}
                    className="w-full flex items-center justify-between text-left group p-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition"
                  >
                    <div>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition block">
                        #{item.tag}
                      </span>
                      <span className="text-[10px] text-zinc-400">{item.count}</span>
                    </div>
                    <span className="text-[10px] rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-zinc-500 dark:text-zinc-400">
                      {item.category}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Campus Verification Notice */}
            <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-indigo-50/50 to-violet-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold text-xs">
                <School className="h-4 w-4" />
                <span>IPEC Campus Exclusive</span>
              </div>
              <p className="mt-1.5 text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Connect exclusively with verified Inderprastha Engineering College students, faculty, and alumni.
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                <ShieldCheck className="h-3.5 w-3.5" />
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
        <div className="flex justify-center py-20 text-zinc-400">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <HomeFeedContent />
    </Suspense>
  );
}
