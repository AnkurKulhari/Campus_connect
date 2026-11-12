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
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#2C251F] dark:text-[#F6F2EC] flex items-center gap-2.5">
          <Users className="h-7 w-7 text-[#8C7A58] dark:text-[#A8936E]" />
          <span>Find Students & Alumni</span>
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-[#8C7E70] dark:text-[#9F9385]">
          Search peers, batchmates, and graduated seniors across Inderprastha Engineering College.
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="relative mb-5">
        <Search className="absolute left-4 top-3.5 h-5 w-5 text-[#8C7E70]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, username, branch (CSE/IT), or interests..."
          className="w-full rounded-full border border-[#DFD5C6] bg-[#FAF7F2] pl-12 pr-4 py-3 text-xs sm:text-sm text-[#2C251F] placeholder-[#8C7E70] shadow-2xs focus:border-[#8C7A58] focus:outline-none dark:border-[#383129] dark:bg-[#221E1A] dark:text-[#F6F2EC]"
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
                    ? "bg-[#8C7A58] text-white shadow-2xs"
                    : "bg-[#FAF7F2] text-[#685E53] border border-[#E6DED3] hover:bg-[#EDE6DA] dark:border-[#383129] dark:bg-[#221E1A] dark:text-[#C7BCB0]"
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
                className={`shrink-0 rounded-full px-3.5 py-1 text-[11px] font-semibold transition ${
                  isSelected
                    ? "bg-[#2C251F] text-white dark:bg-[#F6F2EC] dark:text-[#2C251F]"
                    : "bg-[#FAF7F2] text-[#685E53] border border-[#E6DED3] hover:bg-[#EDE6DA] dark:border-[#383129] dark:bg-[#221E1A] dark:text-[#C7BCB0]"
                }`}
              >
                {b}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-xs font-semibold text-[#8C7E70] dark:text-[#9F9385]">
        Found {total} {total === 1 ? "result" : "results"}
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#8C7A58]" />
          <p className="text-xs text-[#8C7E70]">Searching campus directory...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#DFD5C6] p-12 text-center dark:border-[#383129] bg-[#FAF7F2] dark:bg-[#221E1A]">
          <Users className="mx-auto h-12 w-12 text-[#8C7E70] mb-2" />
          <h3 className="text-base font-bold text-[#2C251F] dark:text-[#F6F2EC]">
            No Students Found
          </h3>
          <p className="mt-1 text-xs text-[#8C7E70] max-w-sm mx-auto">
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
              className="flex flex-col justify-between rounded-3xl border border-[#E6DED3] bg-[#FAF7F2] p-5 shadow-xs transition hover:border-[#8C7A58] dark:border-[#383129] dark:bg-[#221E1A] dark:hover:border-[#A8936E]"
            >
              <div>
                {/* Header: Avatar + Verification */}
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/profile/${item.username}`}
                    className="relative flex h-13 w-13 shrink-0 items-center justify-center rounded-full bg-[#8C7A58] font-bold text-white overflow-hidden shadow-2xs"
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
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
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
                    className="font-bold text-sm text-[#2C251F] hover:underline dark:text-[#F6F2EC] block truncate"
                  >
                    {item.full_name}
                  </Link>
                  <span className="text-xs text-[#8C7E70] dark:text-[#9F9385] block truncate">
                    @{item.username}
                  </span>

                  <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#EDE6DA] px-2.5 py-0.5 text-[11px] font-semibold text-[#685E53] dark:bg-[#2B2520] dark:text-[#D4C8B8]">
                    <GraduationCap className="h-3.5 w-3.5 text-[#8C7A58]" />
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
                  <p className="mt-3 text-xs text-[#685E53] dark:text-[#C7BCB0] line-clamp-2 leading-relaxed">
                    {item.bio}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-[#EDE6DA] dark:border-[#2E2822] space-y-2">
                {item.linkedin_url && (
                  <a
                    href={item.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-1.5 rounded-full bg-[#0077b5]/10 py-1.5 text-xs font-semibold text-[#0077b5] dark:bg-[#0077b5]/20 dark:text-blue-300 hover:bg-[#0077b5] hover:text-white transition"
                  >
                    <LinkedinIcon className="h-3.5 w-3.5" />
                    <span>LinkedIn</span>
                  </a>
                )}

                <div className="flex items-center gap-2">
                  <Link
                    href={`/profile/${item.username}`}
                    className="flex-1 rounded-full border border-[#DFD5C6] bg-white py-1.5 text-center text-xs font-semibold text-[#2C251F] hover:bg-[#EDE6DA] dark:border-[#383129] dark:bg-[#1A1714] dark:text-[#F6F2EC] dark:hover:bg-[#241F1A] transition"
                  >
                    Profile
                  </Link>

                  {user && user.id !== item.id && (
                    <>
                      <Link
                        href={`/messages?user=${item.username}`}
                        title="Send Message"
                        className="flex items-center justify-center rounded-full border border-[#DFD5C6] bg-white p-2 text-[#8C7E70] hover:bg-[#EDE6DA] dark:border-[#383129] dark:bg-[#1A1714] dark:text-[#C7BCB0] dark:hover:bg-[#241F1A] transition"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Link>

                      <button
                        onClick={() => handleFollowToggle(item.username)}
                        className={`flex items-center justify-center gap-1 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                          item.is_following
                            ? "bg-[#EDE6DA] text-[#685E53] hover:bg-[#E0D7C8] dark:bg-[#2B2520] dark:text-[#BDB1A3]"
                            : "bg-[#8C7A58] text-white hover:bg-[#796847] shadow-2xs"
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
            className="inline-flex items-center gap-2 rounded-full border border-[#DFD5C6] bg-[#FAF7F2] px-6 py-2.5 text-xs font-bold text-[#685E53] hover:bg-[#EDE6DA] dark:border-[#383129] dark:bg-[#221E1A] dark:text-[#C7BCB0] transition"
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
