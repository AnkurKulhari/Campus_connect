"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserProfile } from "@/types";
import {
  GraduationCap,
  Bell,
  LogOut,
  Search,
  X,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";

export function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const fetchCounts = async () => {
      try {
        const notifRes = await api.notifications.getUnreadCount();
        setUnreadCount(notifRes.unread_count);
      } catch {
        // Silently catch if not authorized
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, [user]);

  // Live search preview
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.users.search(searchQuery.trim(), "all", "All", 1, 4);
        setSearchResults(res.users);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close search on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchFocused(false);
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur dark:border-slate-800/80 dark:bg-[#0B0F19]/90 transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2 font-black text-xl tracking-tight text-slate-900 dark:text-white hover:opacity-90 transition"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/20">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="font-extrabold tracking-tight">
              campus<span className="text-blue-600 dark:text-blue-400">connect</span>
            </span>
          </Link>
          <span className="hidden md:inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
            IPEC Campus
          </span>
        </div>

        {/* Global Student & Alumni Search */}
        {user && (
          <div ref={searchContainerRef} className="relative flex-1 max-w-xs md:max-w-md mx-3 hidden sm:block">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  placeholder="Search students, alumni, branch..."
                  className="w-full rounded-full border border-slate-200 bg-slate-100/70 pl-9.5 pr-8 py-2 text-xs text-slate-900 placeholder-slate-400 transition-all focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500 dark:focus:bg-slate-800 shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </form>

            {/* Live Search Floating Dropdown */}
            {searchFocused && searchQuery.trim().length >= 2 && (
              <div className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {isSearching ? "Searching..." : "Students & Alumni"}
                </div>

                {isSearching ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-500">
                    No results found for &quot;{searchQuery}&quot;
                  </div>
                ) : (
                  <div className="space-y-1">
                    {searchResults.map((result) => (
                      <Link
                        key={result.id}
                        href={`/profile/${result.username}`}
                        onClick={() => setSearchFocused(false)}
                        className="flex items-center gap-2.5 rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left"
                      >
                        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-xs text-white overflow-hidden shadow-2xs">
                          {result.profile_picture ? (
                            <Image
                              src={result.profile_picture}
                              alt={result.username}
                              fill
                              sizes="32px"
                              className="object-cover"
                            />
                          ) : (
                            result.full_name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                              {result.full_name}
                            </span>
                            {result.is_id_verified && (
                              <ShieldCheck className="h-3 w-3 text-emerald-500 shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate">
                            <span>@{result.username}</span>
                            {result.year && <span>• {result.year}</span>}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                <div className="mt-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <Link
                    href={`/search?q=${encodeURIComponent(searchQuery.trim())}`}
                    onClick={() => setSearchFocused(false)}
                    className="block rounded-lg px-3 py-1.5 text-center text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                  >
                    View all results for &quot;{searchQuery}&quot; →
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation - Streamlined without duplicate sidebar links */}
        {user ? (
          <nav className="flex items-center gap-1.5 sm:gap-2">
            {/* Mobile Search Button */}
            <Link
              href="/search"
              className={`sm:hidden flex items-center justify-center rounded-full p-2 text-sm font-medium transition-colors ${
                pathname === "/search"
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
              title="Search students"
            >
              <Search className="h-4 w-4" />
            </Link>

            {/* Notification Bell */}
            <Link
              href="/notifications"
              className={`relative flex items-center justify-center rounded-full p-2 transition-colors ${
                pathname === "/notifications"
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
              title="Notifications"
            >
              <Bell className="h-4.5 w-4.5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-xs">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>

            {/* User Profile Pill */}
            <Link
              href={`/profile/${user.username}`}
              className={`flex items-center gap-2 rounded-full pl-1.5 pr-3 py-1 text-xs font-semibold border transition ${
                pathname.startsWith("/profile")
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-slate-100/80 border-slate-200/80 text-slate-800 hover:bg-slate-200/70 dark:bg-slate-800/80 dark:border-slate-700/60 dark:text-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-[11px] text-white overflow-hidden shadow-2xs">
                {user.profile_picture ? (
                  <Image
                    src={user.profile_picture}
                    alt={user.username}
                    fill
                    sizes="28px"
                    className="object-cover"
                  />
                ) : (
                  user.full_name.charAt(0).toUpperCase()
                )}
              </div>
              <span className="hidden sm:inline">@{user.username}</span>
            </Link>

            {/* Logout button */}
            <button
              onClick={logout}
              title="Log out"
              className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </nav>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 transition"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
            >
              Join Campus
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
