"use client";

import React, { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AuthGuard } from "@/components/AuthGuard";
import { api, ApiError } from "@/lib/api";
import { Club } from "@/types";
import {
  Landmark,
  Search,
  Plus,
  ShieldCheck,
  Users,
  Compass,
  GraduationCap,
  Sparkles,
  ExternalLink,
  Loader2,
  AlertCircle,
  School,
  ChevronRight,
} from "lucide-react";

const CATEGORIES = [
  { id: "all", label: "All Societies" },
  { id: "Technical", label: "Technical & Coding" },
  { id: "Cultural", label: "Cultural & Arts" },
  { id: "Sports", label: "Sports & Athletics" },
  { id: "Literary", label: "Literary & Debating" },
  { id: "Social", label: "Social & Welfare" },
  { id: "Departmental", label: "Departmental" },
];

export default function ClubsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isPending, startTransition] = useTransition();

  const isEligibleToRegister =
    user?.is_id_verified &&
    (user?.year === "3rd Year" || user?.year === "4th Year");

  const fetchClubs = async (cat: string, q: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.clubs.list(cat, q, 1, 50);
      setClubs(data.clubs);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail);
      } else {
        setError("Failed to load clubs and societies. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClubs(selectedCategory, searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [selectedCategory, searchQuery]);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] transition-colors pb-16">
        {/* Hero Header */}
        <div className="relative border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#131B2E] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600/5 via-blue-600/5 to-transparent pointer-events-none" />
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 dark:bg-violet-950/70 border border-violet-200/80 dark:border-violet-800/60 px-3 py-1 text-xs font-bold text-violet-700 dark:text-violet-300">
                  <Landmark className="h-3.5 w-3.5" />
                  <span>IPEC Campus Societies</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Clubs & Student Societies
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
                  Connect with official technical chapters, cultural teams, sports clubs,
                  and student organizations verified at Inderprastha Engineering College.
                </p>
              </div>

              {/* Action Button: Register Society */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Link
                  href="/clubs/register"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 text-xs font-bold shadow-sm transition min-h-[44px]"
                >
                  <Plus className="h-4 w-4" />
                  <span>Register a Society</span>
                </Link>
              </div>
            </div>

            {/* Search and Filters Bar */}
            <div className="mt-6 flex flex-col md:flex-row items-stretch md:items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by society name, handle (@csi_ipec), or motto..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900/60 pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 min-h-[42px]"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition cursor-pointer min-h-[38px] ${
                      selectedCategory === cat.id
                        ? "bg-violet-600 text-white shadow-xs"
                        : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-4 flex items-center gap-3 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-violet-500 mb-3" />
              <p className="text-xs font-medium">Loading campus societies...</p>
            </div>
          ) : clubs.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#131B2E] p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 mb-4">
                <Landmark className="h-7 w-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No societies found
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {searchQuery || selectedCategory !== "all"
                  ? "Try adjusting your search query or category filter."
                  : "No official societies registered in this directory yet."}
              </p>
              {isEligibleToRegister && (
                <div className="mt-6">
                  <Link
                    href="/clubs/register"
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 text-xs font-bold transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Register Your Society</span>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {clubs.map((club) => (
                <Link
                  key={club.id}
                  href={`/clubs/${club.slug}`}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#131B2E] p-5 shadow-xs hover:border-violet-500/50 hover:shadow-md transition duration-200"
                >
                  <div>
                    {/* Header: Logo, Badges */}
                    <div className="flex items-start gap-3.5">
                      <div className="relative flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white font-extrabold text-lg overflow-hidden ring-1 ring-black/5 dark:ring-white/10 shadow-xs">
                        {club.logo_url ? (
                          <Image
                            src={club.logo_url}
                            alt={club.name}
                            fill
                            sizes="52px"
                            className="object-cover"
                          />
                        ) : (
                          club.name.charAt(0).toUpperCase()
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="rounded-md bg-violet-50 dark:bg-violet-950/60 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:text-violet-300 border border-violet-200/50 dark:border-violet-800/40">
                            {club.category}
                          </span>
                          {club.is_verified && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                              <ShieldCheck className="h-3 w-3" />
                              <span>Verified</span>
                            </span>
                          )}
                        </div>

                        {/* Official Club Name */}
                        <h2 className="mt-1.5 text-sm font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition truncate">
                          {club.name}
                        </h2>
                        <p className="text-[11px] font-mono text-slate-400 truncate">
                          @{club.slug}
                        </p>
                      </div>
                    </div>

                    {/* Tagline / Bio */}
                    {club.tagline && (
                      <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {club.tagline}
                      </p>
                    )}
                  </div>

                  {/* Footer metadata */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      <span>{club.members_count} team {club.members_count === 1 ? "member" : "members"}</span>
                    </div>

                    <div className="flex items-center gap-1 font-semibold text-violet-600 dark:text-violet-400 group-hover:translate-x-0.5 transition">
                      <span>View</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
