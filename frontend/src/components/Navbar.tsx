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
    <header className="sticky top-0 z-40 w-full border-b border-[#E6DED3] bg-[#F6F1E9]/95 backdrop-blur dark:border-[#383129] dark:bg-[#171412]/95 transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2 font-black text-xl tracking-tight text-[#2C251F] dark:text-[#F6F2EC] hover:opacity-90 transition"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#8C7A58] text-white shadow-sm dark:bg-[#A8936E]">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="font-extrabold tracking-tight">
              campus<span className="text-[#8C7A58] dark:text-[#A8936E]">connect</span>
            </span>
          </Link>
          <span className="hidden md:inline-flex items-center rounded-full bg-[#EDE6DA] px-2.5 py-0.5 text-[11px] font-semibold text-[#6D5D46] dark:bg-[#28231E] dark:text-[#D4C8B8] border border-[#DFD6C8] dark:border-[#3D352B]">
            IPEC Campus
          </span>
        </div>

        {/* Global Student & Alumni Search (Center Pill - Goonly style) */}
        {user && (
          <div ref={searchContainerRef} className="relative flex-1 max-w-xs md:max-w-md mx-3 hidden sm:block">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#8C7E70] dark:text-[#9F9385]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  placeholder="Search students, alumni, branch..."
                  className="w-full rounded-full border border-[#DFD6C8] bg-[#EDE6DA]/70 pl-9.5 pr-8 py-2 text-xs text-[#2C251F] placeholder-[#8C7E70] transition-all focus:border-[#8C7A58] focus:bg-white focus:outline-none dark:border-[#383129] dark:bg-[#221E1A] dark:text-[#F6F2EC] dark:placeholder-[#9F9385] dark:focus:bg-[#1A1714] shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                    className="absolute right-2.5 top-2.5 text-[#8C7E70] hover:text-[#2C251F] dark:hover:text-[#F6F2EC]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </form>

            {/* Live Search Floating Dropdown */}
            {searchFocused && searchQuery.trim().length >= 2 && (
              <div className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-[#DFD6C8] bg-white p-2 shadow-xl dark:border-[#383129] dark:bg-[#221E1A] z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8C7E70]">
                  {isSearching ? "Searching..." : "Students & Alumni"}
                </div>

                {isSearching ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin text-[#8C7A58]" />
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-3 text-center text-xs text-[#8C7E70]">
                    No results found for &quot;{searchQuery}&quot;
                  </div>
                ) : (
                  <div className="space-y-1">
                    {searchResults.map((result) => (
                      <Link
                        key={result.id}
                        href={`/profile/${result.username}`}
                        onClick={() => setSearchFocused(false)}
                        className="flex items-center gap-2.5 rounded-xl p-2 hover:bg-[#EDE6DA]/60 dark:hover:bg-[#2C2621] transition text-left"
                      >
                        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#8C7A58] font-bold text-xs text-white overflow-hidden">
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
                            <span className="font-semibold text-xs text-[#2C251F] dark:text-[#F6F2EC] truncate">
                              {result.full_name}
                            </span>
                            {result.is_id_verified && (
                              <ShieldCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-[#8C7E70] truncate">
                            <span>@{result.username}</span>
                            {result.year && <span>• {result.year}</span>}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                <div className="mt-1 pt-1 border-t border-[#DFD6C8] dark:border-[#383129]">
                  <Link
                    href={`/search?q=${encodeURIComponent(searchQuery.trim())}`}
                    onClick={() => setSearchFocused(false)}
                    className="block rounded-lg px-3 py-1.5 text-center text-[11px] font-semibold text-[#8C7A58] dark:text-[#A8936E] hover:bg-[#EDE6DA]/60 dark:hover:bg-[#2C2621]"
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
                  ? "bg-[#8C7A58] text-white"
                  : "text-[#685E53] hover:bg-[#EDE6DA] dark:text-[#BDB1A3] dark:hover:bg-[#28231E]"
              }`}
              title="Search students"
            >
              <Search className="h-4 w-4" />
            </Link>

            {/* Notification Bell (Matches Goonly Top Bar Icon) */}
            <Link
              href="/notifications"
              className={`relative flex items-center justify-center rounded-full p-2 transition-colors ${
                pathname === "/notifications"
                  ? "bg-[#8C7A58] text-white"
                  : "text-[#685E53] hover:bg-[#EDE6DA] dark:text-[#BDB1A3] dark:hover:bg-[#28231E]"
              }`}
              title="Notifications"
            >
              <Bell className="h-4.5 w-4.5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E15241] px-1 text-[10px] font-bold text-white shadow-xs">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>

            {/* User Profile Pill */}
            <Link
              href={`/profile/${user.username}`}
              className={`flex items-center gap-2 rounded-full pl-1.5 pr-3 py-1 text-xs font-semibold border transition ${
                pathname.startsWith("/profile")
                  ? "bg-[#8C7A58] text-white border-[#8C7A58]"
                  : "bg-[#EDE6DA]/60 border-[#DFD6C8] text-[#2C251F] hover:bg-[#EDE6DA] dark:bg-[#241F1A] dark:border-[#383129] dark:text-[#F6F2EC] dark:hover:bg-[#2A241E]"
              }`}
            >
              <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#8C7A58] font-bold text-[11px] text-white overflow-hidden shadow-2xs">
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
              className="rounded-full p-2 text-[#8C7E70] hover:bg-[#EDE6DA] hover:text-[#2C251F] dark:text-[#A09485] dark:hover:bg-[#28231E] dark:hover:text-[#F6F2EC] transition"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </nav>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-xs font-semibold text-[#2C251F] hover:bg-[#EDE6DA] dark:text-[#F6F2EC] dark:hover:bg-[#28231E] transition"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-[#8C7A58] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#796847] dark:bg-[#A8936E] dark:hover:bg-[#97825E] transition"
            >
              Join Campus
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
