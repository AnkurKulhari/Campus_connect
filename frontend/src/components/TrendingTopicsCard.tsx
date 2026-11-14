"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { TrendingTopic } from "@/types";
import { Flame, Hash, Loader2 } from "lucide-react";

interface TrendingTopicsCardProps {
  activeTag?: string | null;
  limit?: number;
}

export function TrendingTopicsCard({ activeTag, limit = 6 }: TrendingTopicsCardProps) {
  const router = useRouter();
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadTrending() {
      try {
        const data = await api.posts.getTrendingTopics(limit);
        if (isMounted) {
          setTopics(data);
        }
      } catch {
        // Silently catch and fallback to empty state
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadTrending();
    return () => {
      isMounted = false;
    };
  }, [limit]);

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-[#131B2E]">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white">
          <Flame className="h-4 w-4 text-orange-500" />
          <h3 className="font-extrabold text-xs uppercase tracking-wider">
            Trending on Campus
          </h3>
        </div>
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
      </div>

      <div className="space-y-1.5 text-xs">
        {loading ? (
          // Sleek Skeleton loading state
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="w-full flex items-center justify-between p-2 rounded-xl animate-pulse bg-slate-50 dark:bg-slate-800/40"
            >
              <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded-md w-24" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full w-12" />
            </div>
          ))
        ) : topics.length === 0 ? (
          <div className="p-3 text-center text-xs text-slate-400">
            No campus topics yet. Be the first to tag a post!
          </div>
        ) : (
          topics.map((item) => {
            const isSelected =
              activeTag &&
              (activeTag.toLowerCase() === item.tag.toLowerCase() ||
                activeTag.toLowerCase() === `#${item.tag.toLowerCase()}`);

            return (
              <button
                key={item.tag}
                onClick={() => router.push(`/home?tag=${encodeURIComponent(item.tag)}`)}
                className={`w-full flex items-center justify-between text-left group p-2 rounded-xl transition ${
                  isSelected
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-bold"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                }`}
              >
                <div className="flex flex-col min-w-0 pr-2">
                  <span
                    className={`font-semibold text-xs truncate transition ${
                      isSelected
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                    }`}
                  >
                    #{item.tag}
                  </span>
                  {item.post_count > 0 && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                      {item.post_count} {item.post_count === 1 ? "post" : "posts"}
                    </span>
                  )}
                </div>

                <span
                  className={`text-[10px] shrink-0 rounded-full px-2.5 py-0.5 font-medium transition ${
                    isSelected
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-800/60 dark:text-blue-200"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  {item.category}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
