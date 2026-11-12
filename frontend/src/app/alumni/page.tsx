"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { UserProfile } from "@/types";
import {
  GraduationCap,
  Search,
  UserPlus,
  UserCheck,
  Loader2,
  ShieldCheck,
  MessageSquare,
} from "lucide-react";
import { LinkedinIcon } from "@/components/icons/LinkedinIcon";

const BRANCH_FILTER_PILLS = [
  "All",
  "Computer Science & Engineering",
  "Information Technology",
  "Electronics & Communication",
  "Mechanical Engineering",
  "Civil Engineering",
  "MCA",
  "MBA",
];

export default function AlumniCirclePage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("All");
  const [alumni, setAlumni] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchAlumni = useCallback(
    async (query = search, br = selectedBranch, pageNum = 1, append = false) => {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        const data = await api.users.getAlumniCircle(query, br, pageNum, 12);
        if (append) {
          setAlumni((prev) => [...prev, ...data.alumni]);
        } else {
          setAlumni(data.alumni);
        }
        setTotal(data.total);
        setHasNext(data.has_next);
        setPage(pageNum);
      } catch (err) {
        console.error("Failed to load alumni circle:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [search, selectedBranch]
  );

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchAlumni(search, selectedBranch, 1, false);
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [search, selectedBranch, fetchAlumni]);

  const handleFollowToggle = async (targetUsername: string) => {
    try {
      const res = await api.users.toggleFollow(targetUsername);
      setAlumni((prev) =>
        prev.map((a) =>
          a.username === targetUsername
            ? {
                ...a,
                is_following: res.is_following,
                followers_count: res.followers_count,
              }
            : a
        )
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to toggle follow");
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header Banner - High contrast modern navy gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 p-6 sm:p-10 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold backdrop-blur-md text-blue-200 border border-blue-400/30 mb-4">
            <GraduationCap className="h-4 w-4 text-blue-400" />
            <span>IPEC Alumni Network</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Alumni Circle
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-300 leading-relaxed">
            Connect with graduated seniors from Inderprastha Engineering College. Find career guidance, discover industry opportunities, and expand your professional network.
          </p>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute right-20 top-0 h-40 w-40 rounded-full bg-indigo-500/20 blur-2xl" />
      </div>

      {/* Controls: Search & Branch Pills */}
      <div className="mt-8 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search alumni by name, username, company, or skills..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 py-3 text-xs text-slate-900 placeholder-slate-400 shadow-2xs focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Branch Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {BRANCH_FILTER_PILLS.map((pill) => {
            const isSelected = selectedBranch === pill;
            return (
              <button
                key={pill}
                onClick={() => setSelectedBranch(pill)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                {pill}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Header */}
      <div className="mt-6 flex items-center justify-between text-xs text-slate-500 font-medium">
        <span>
          Showing {alumni.length} of {total} Alumni
        </span>
      </div>

      {/* Alumni Grid */}
      {loading ? (
        <div className="mt-12 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-xs text-slate-500">Connecting to Alumni Circle...</p>
        </div>
      ) : alumni.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center bg-white dark:bg-slate-900">
          <GraduationCap className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-slate-100">
            No Alumni Found
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            {search || selectedBranch !== "All"
              ? "Try adjusting your search query or branch filter."
              : "As graduates register with Alumni status, they will appear here in the Alumni Circle."}
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {alumni.map((alumnus) => (
            <div
              key={alumnus.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-500 transition"
            >
              <div>
                {/* Avatar & Verification */}
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/profile/${alumnus.username}`}
                    className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-lg text-white overflow-hidden shadow-2xs"
                  >
                    {alumnus.profile_picture ? (
                      <Image
                        src={alumnus.profile_picture}
                        alt={alumnus.full_name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      alumnus.full_name.charAt(0).toUpperCase()
                    )}
                  </Link>

                  {alumnus.is_id_verified && (
                    <span
                      title="Verified College ID"
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                    >
                      <ShieldCheck className="h-3 w-3" />
                      <span>Verified</span>
                    </span>
                  )}
                </div>

                {/* Name & Academic Tag */}
                <div className="mt-3">
                  <Link
                    href={`/profile/${alumnus.username}`}
                    className="font-bold text-slate-900 hover:underline dark:text-slate-100 block truncate"
                  >
                    {alumnus.full_name}
                  </Link>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block truncate">
                    @{alumnus.username}
                  </span>

                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                    <GraduationCap className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    <span>
                      Alumni {alumnus.branch ? `• ${alumnus.branch.replace(/\(.*?\)/g, "").trim()}` : ""}
                    </span>
                  </div>
                </div>

                {/* Bio */}
                {alumnus.bio && (
                  <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {alumnus.bio}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                {alumnus.linkedin_url ? (
                  <a
                    href={alumnus.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#0077b5]/10 py-2 text-xs font-semibold text-[#0077b5] dark:bg-[#0077b5]/20 dark:text-blue-300 hover:bg-[#0077b5] hover:text-white transition"
                  >
                    <LinkedinIcon className="h-3.5 w-3.5" />
                    <span>Connect on LinkedIn</span>
                  </a>
                ) : null}

                <div className="flex items-center gap-2">
                  <Link
                    href={`/profile/${alumnus.username}`}
                    className="flex-1 rounded-xl border border-slate-200 bg-white py-1.5 text-center text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    View Profile
                  </Link>

                  {user && user.id !== alumnus.id && (
                    <>
                      <Link
                        href={`/messages?user=${alumnus.username}`}
                        title="Direct Message"
                        className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Link>

                      <button
                        onClick={() => handleFollowToggle(alumnus.username)}
                        className={`flex items-center justify-center gap-1 rounded-xl px-4 py-1.5 text-xs font-semibold transition ${
                          alumnus.is_following
                            ? "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                            : "bg-blue-600 text-white hover:bg-blue-700 shadow-2xs"
                        }`}
                      >
                        {alumnus.is_following ? (
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
            onClick={() => fetchAlumni(search, selectedBranch, page + 1, true)}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 transition"
          >
            {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>Load More Alumni</span>
          </button>
        </div>
      )}
    </div>
  );
}
