"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserProfile } from "@/types";
import {
  GraduationCap,
  Home,
  Bell,
  User as UserIcon,
  LogOut,
  PlusCircle,
  Users,
  MessageSquare,
  Search,
  X,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";

export function Navbar({ onOpenCreatePost }: { onOpenCreatePost?: () => void }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [unreadMessages, setUnreadMessages] = useState<number>(0);

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
        const [notifRes, msgRes] = await Promise.all([
          api.notifications.getUnreadCount(),
          api.messages.getUnreadCount(),
        ]);
        setUnreadCount(notifRes.unread_count);
        setUnreadMessages(msgRes.unread_count);
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
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <a
            href="/"
            className="flex items-center gap-2 font-bold text-lg sm:text-xl tracking-tight text-zinc-900 dark:text-white"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-sm shadow-indigo-500/20">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="hidden xs:inline">
              Campus<span className="text-indigo-600 dark:text-indigo-400">Connect</span>
            </span>
          </a>
          <span className="hidden lg:inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
            IPEC Campus
          </span>
        </div>

        {/* Global Student & Alumni Search (Lumina & Socially inspired) */}
        {user && (
          <div ref={searchContainerRef} className="relative flex-1 max-w-xs md:max-w-sm mx-3 hidden sm:block">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  placeholder="Search students, alumni, branch..."
                  className="w-full rounded-full border border-zinc-200 bg-zinc-50 pl-9.5 pr-8 py-2 text-xs text-zinc-900 placeholder-zinc-400 transition-all focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:bg-zinc-800 shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                    className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </form>

            {/* Live Search Floating Dropdown */}
            {searchFocused && searchQuery.trim().length >= 2 && (
              <div className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  {isSearching ? "Searching..." : "Students & Alumni"}
                </div>

                {isSearching ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-3 text-center text-xs text-zinc-500">
                    No results found for &quot;{searchQuery}&quot;
                  </div>
                ) : (
                  <div className="space-y-1">
                    {searchResults.map((result) => (
                      <Link
                        key={result.id}
                        href={`/profile/${result.username}`}
                        onClick={() => setSearchFocused(false)}
                        className="flex items-center gap-2.5 rounded-xl p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-left"
                      >
                        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 font-bold text-xs text-white overflow-hidden">
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
                            <span className="font-semibold text-xs text-zinc-900 dark:text-white truncate">
                              {result.full_name}
                            </span>
                            {result.is_id_verified && (
                              <ShieldCheck className="h-3 w-3 text-emerald-500 shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 truncate">
                            <span>@{result.username}</span>
                            {result.year && (
                              <span>• {result.year}</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                <div className="mt-1 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                  <Link
                    href={`/search?q=${encodeURIComponent(searchQuery.trim())}`}
                    onClick={() => setSearchFocused(false)}
                    className="block rounded-lg px-3 py-1.5 text-center text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                  >
                    View all results for &quot;{searchQuery}&quot; →
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        {user ? (
          <nav className="flex items-center gap-1 sm:gap-1.5">
            {/* Mobile Search Button */}
            <a
              href="/search"
              className={`sm:hidden flex items-center justify-center rounded-lg p-2 text-sm font-medium transition-colors ${
                pathname === "/search"
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
              }`}
              title="Search students"
            >
              <Search className="h-4 w-4" />
            </a>

            <a
              href="/"
              className={`flex items-center gap-2 rounded-lg px-2.5 sm:px-3 py-2 text-sm font-medium transition-colors ${
                pathname === "/"
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
              }`}
            >
              <Home className="h-4 w-4" />
              <span className="hidden md:inline">Feed</span>
            </a>

            <a
              href="/alumni"
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                pathname === "/alumni"
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
              }`}
            >
              <Users className="h-4 w-4 text-violet-500" />
              <span className="hidden md:inline">Alumni Circle</span>
            </a>

            <a
              href="/notifications"
              className={`relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                pathname === "/notifications"
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
              }`}
            >
              <Bell className="h-4 w-4" />
              <span className="hidden md:inline">Notifications</span>
              {unreadCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </a>

            <a
              href="/messages"
              className={`relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                pathname === "/messages"
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              <span className="hidden md:inline">Messages</span>
              {unreadMessages > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white">
                  {unreadMessages > 99 ? "99+" : unreadMessages}
                </span>
              )}
            </a>

            <a
              href={`/profile/${user.username}`}
              className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors ${
                pathname.startsWith("/profile")
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
              }`}
            >
              <div className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-[10px] text-indigo-700 overflow-hidden dark:bg-indigo-950 dark:text-indigo-300">
                {user.profile_picture ? (
                  <Image
                    src={user.profile_picture}
                    alt={user.username}
                    fill
                    sizes="24px"
                    className="object-cover"
                  />
                ) : (
                  user.full_name.charAt(0).toUpperCase()
                )}
              </div>
              <span className="hidden md:inline">@{user.username}</span>
            </a>

            {onOpenCreatePost && !user.is_alumni && user.year !== "Alumni" && (
              <button
                onClick={onOpenCreatePost}
                className="ml-1 hidden sm:flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Post</span>
              </button>
            )}

            <button
              onClick={logout}
              title="Log out"
              className="ml-1 rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white transition"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </nav>
        ) : (
          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition"
            >
              Sign In
            </a>
            <a
              href="/register"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition"
            >
              Join Campus
            </a>
          </div>
        )}
      </div>
    </header>
  );
}
