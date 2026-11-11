"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Post, PaginatedPosts } from "@/types";
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
} from "lucide-react";

function HomeFeedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tagParam = searchParams.get("tag");

  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"campus" | "following">("campus");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

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
        // Silently catch or handle
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

  const handlePostCreated = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handlePostDeleted = (postId: number) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  // Filter posts if tagParam is selected
  const displayedPosts = tagParam
    ? posts.filter((p) =>
        p.content?.toLowerCase().includes(`#${tagParam.toLowerCase()}`)
      )
    : posts;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Feed Column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Create Post Widget */}
          {user && !tagParam && <CreatePostBox onPostCreated={handlePostCreated} />}

          {/* Active Tag Filter Banner */}
          {tagParam && (
            <div className="flex items-center justify-between rounded-xl bg-indigo-50 border border-indigo-200 px-4 py-3 dark:bg-indigo-950/40 dark:border-indigo-900/60">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                <Tag className="h-4 w-4" />
                <span className="text-sm font-semibold">
                  Posts tagged with #{tagParam}
                </span>
              </div>
              <button
                onClick={() => router.push("/")}
                className="flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700 shadow-xs hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition"
              >
                <X className="h-3 w-3" />
                <span>Clear filter</span>
              </button>
            </div>
          )}

          {/* Feed Tabs */}
          {!tagParam && (
            <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <button
                onClick={() => setActiveTab("campus")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                  activeTab === "campus"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                <Globe className="h-4 w-4" />
                <span>Campus Feed</span>
              </button>

              {user && (
                <button
                  onClick={() => setActiveTab("following")}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                    activeTab === "following"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span>Following</span>
                </button>
              )}
            </div>
          )}

          {/* Posts Feed */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <p className="mt-3 text-xs">Loading campus posts...</p>
            </div>
          ) : displayedPosts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center">
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
                  ? "Try creating a post with this tag, or explore the full campus feed."
                  : activeTab === "following"
                  ? "Follow others to see their updates here, or check out the Campus Feed."
                  : "Be the first student to start the conversation on CampusConnect!"}
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
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition disabled:opacity-50"
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
        </div>

        {/* Sidebar Column */}
        <div className="hidden lg:block space-y-5">
          {/* Campus Card */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
            <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400">
              <School className="h-5 w-5" />
              <h2 className="font-bold text-sm">IPEC Ghaziabad</h2>
            </div>
            <p className="mt-2 text-xs text-zinc-500 leading-relaxed">
              Inderprastha Engineering College exclusive network. Only verified
              students with an official <code className="text-[11px] bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">@ipec.org.in</code> email can join and post.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-green-600 dark:text-green-400 font-medium">
              <ShieldCheck className="h-4 w-4" />
              <span>100% Student Verified</span>
            </div>
          </div>

          {/* Quick Info & Trending Topics */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
            <div className="flex items-center gap-2 text-zinc-900 dark:text-white mb-3">
              <TrendingUp className="h-4 w-4 text-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Campus Topics
              </h3>
            </div>
            <ul className="space-y-2 text-xs">
              {[
                { tag: "TechFest2026", category: "Trending" },
                { tag: "PlacementDrive", category: "Career" },
                { tag: "ExamPrep", category: "Academics" },
                { tag: "HostelLife", category: "Community" },
              ].map((item) => (
                <li
                  key={item.tag}
                  onClick={() => router.push(`/?tag=${item.tag}`)}
                  className="flex items-center justify-between text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition"
                >
                  <span className="font-medium">#{item.tag}</span>
                  <span className="text-[10px] text-zinc-400">{item.category}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
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
