"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { UserProfile } from "@/types";
import {
  Search,
  GraduationCap,
  ShieldCheck,
  MessageSquare,
  UserPlus,
  UserCheck,
  Loader2,
  Users,
} from "lucide-react";
import { LinkedinIcon } from "@/components/icons/LinkedinIcon";

const BRANCH_OPTIONS = [
  "All",
  "Computer Science & Engineering",
  "Information Technology",
  "Electronics & Communication",
  "Mechanical Engineering",
  "Civil Engineering",
  "MCA",
  "MBA",
];

function SearchContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [role, setRole] = useState<"all" | "students" | "alumni">("all");
  const [branch, setBranch] = useState("All");

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchUsers = useCallback(
    async (qStr: string, roleFilter: string, branchFilter: string, pageNum = 1, append = false) => {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        const res = await api.users.search(qStr, roleFilter, branchFilter, pageNum, 15);
        if (append) {
          setUsers((prev) => [...prev, ...res.users]);
        } else {
          setUsers(res.users);
        }
        setTotal(res.total);
        setHasNext(res.has_next);
        setPage(pageNum);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(query, role, branch, 1, false);
      if (query.trim()) {
        router.replace(`/search?q=${encodeURIComponent(query.trim())}`, { scroll: false });
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, role, branch, fetchUsers, router]);

  const handleFollowToggle = async (targetUsername: string) => {
    try {
      const res = await api.users.toggleFollow(targetUsername);
      setUsers((prev) =>
        prev.map((u) =>
          u.username === targetUsername
            ? {
                ...u,
                is_following: res.is_following,
                followers_count: res.followers_count,
              }
            : u
        )
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to toggle follow");
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2.5">
          <Users className="h-7 w-7 text-indigo-600" />
          <span>Find Students & Alumni</span>
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-zinc-500">
          Search peers, batchmates, and graduated seniors across Inderprastha Engineering College.
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="relative mb-5">
        <Search className="absolute left-4 top-3.5 h-5 w-5 text-zinc-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, username, branch (CSE/IT), or interests..."
          className="w-full rounded-2xl border border-zinc-200 bg-white pl-12 pr-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 shadow-xs focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
        />
      </div>

      {/* Filters Row */}
      <div className="space-y-3 mb-6">
        {/* Role Tabs */}
        <div className="flex items-center gap-2">
          {(["all", "students", "alumni"] as const).map((r) => {
            const label =
              r === "all" ? "All Campus" : r === "students" ? "Current Students" : "Alumni";
            const isSelected = role === r;
            return (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Branch Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {BRANCH_OPTIONS.map((b) => {
            const isSelected = branch === b;
            return (
              <button
                key={b}
                onClick={() => setBranch(b)}
                className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition ${
                  isSelected
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
                }`}
              >
                {b}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-xs font-medium text-zinc-400">
        Found {total} {total === 1 ? "result" : "results"}
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-xs text-zinc-400">Searching campus directory...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 p-12 text-center dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <Users className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-700 mb-2" />
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">
            No Students Found
          </h3>
          <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
            {query
              ? `No members matching "${query}". Try searching by department (CSE, IT), roll number, or name.`
              : "Type a name, roll number, or department above to search the IPEC network."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs transition hover:border-indigo-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
            >
              <div>
                {/* Header: Avatar + Verification */}
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/profile/${item.username}`}
                    className="relative flex h-13 w-13 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 font-bold text-white overflow-hidden shadow-xs"
                  >
                    {item.profile_picture ? (
                      <Image
                        src={item.profile_picture}
                        alt={item.username}
                        fill
                        sizes="52px"
                        className="object-cover"
                      />
                    ) : (
                      item.full_name.charAt(0).toUpperCase()
                    )}
                  </Link>

                  {item.is_id_verified && (
                    <span
                      title="Verified Student ID"
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                    >
                      <ShieldCheck className="h-3 w-3" />
                      <span>Verified</span>
                    </span>
                  )}
                </div>

                {/* Name & Academic tags */}
                <div className="mt-3">
                  <Link
                    href={`/profile/${item.username}`}
                    className="font-bold text-sm text-zinc-900 hover:underline dark:text-white block truncate"
                  >
                    {item.full_name}
                  </Link>
                  <span className="text-xs text-zinc-400 block truncate">
                    @{item.username}
                  </span>

                  <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                    <GraduationCap className="h-3.5 w-3.5" />
                    <span>
                      {item.is_alumni || item.year === "Alumni"
                        ? "Alumni"
                        : item.year || "Student"}{" "}
                      {item.branch ? `• ${item.branch.replace(/\(.*?\)/g, "").trim()}` : ""}
                    </span>
                  </div>
                </div>

                {/* Bio */}
                {item.bio && (
                  <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2 leading-relaxed">
                    {item.bio}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                {item.linkedin_url && (
                  <a
                    href={item.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-blue-600/10 py-1.5 text-xs font-semibold text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition"
                  >
                    <LinkedinIcon className="h-3.5 w-3.5" />
                    <span>LinkedIn</span>
                  </a>
                )}

                <div className="flex items-center gap-2">
                  <Link
                    href={`/profile/${item.username}`}
                    className="flex-1 rounded-xl border border-zinc-200 py-1.5 text-center text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition"
                  >
                    Profile
                  </Link>

                  {user && user.id !== item.id && (
                    <>
                      <Link
                        href={`/messages?user=${item.username}`}
                        title="Send Message"
                        className="flex items-center justify-center rounded-xl border border-zinc-200 px-2.5 py-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-indigo-600 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Link>

                      <button
                        onClick={() => handleFollowToggle(item.username)}
                        className={`flex items-center justify-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                          item.is_following
                            ? "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                            : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-xs"
                        }`}
                      >
                        {item.is_following ? (
                          <>
                            <UserCheck className="h-3.5 w-3.5" />
                            <span className="hidden xs:inline">Following</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-3.5 w-3.5" />
                            <span className="hidden xs:inline">Follow</span>
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Load More */}
      {hasNext && (
        <div className="mt-8 text-center">
          <button
            onClick={() => fetchUsers(query, role, branch, page + 1, true)}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-100 px-5 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition"
          >
            {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>Load More Results</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
