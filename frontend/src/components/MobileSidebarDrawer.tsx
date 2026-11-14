"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/lib/api";
import { UserProfile, TrendingTopic } from "@/types";
import {
  X,
  Compass,
  GraduationCap,
  MessageSquare,
  Bell,
  Search,
  User as UserIcon,
  LogOut,
  ShieldCheck,
  Flame,
  School,
  UserPlus,
  UserCheck,
  Loader2,
  Sun,
  Moon,
} from "lucide-react";

interface MobileSidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSidebarDrawer({ isOpen, onClose }: MobileSidebarDrawerProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [unreadMsgs, setUnreadMsgs] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [suggestions, setSuggestions] = useState<UserProfile[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Load sidebar data (counts, trending, suggestions) when opened
  useEffect(() => {
    if (!isOpen || !user) return;

    let isMounted = true;

    async function loadDrawerData() {
      setLoadingSuggestions(true);
      try {
        const [msgRes, notifRes, trendingRes, suggestRes] = await Promise.allSettled([
          api.messages.getUnreadCount(),
          api.notifications.getUnreadCount(),
          api.posts.getTrendingTopics(5),
          api.users.getSuggestions(4),
        ]);

        if (!isMounted) return;

        if (msgRes.status === "fulfilled") setUnreadMsgs(msgRes.value.unread_count || 0);
        if (notifRes.status === "fulfilled") setUnreadNotifs(notifRes.value.unread_count || 0);
        if (trendingRes.status === "fulfilled") setTrendingTopics(trendingRes.value || []);
        if (suggestRes.status === "fulfilled") setSuggestions(suggestRes.value || []);
      } catch {
        // Silently catch error
      } finally {
        if (isMounted) setLoadingSuggestions(false);
      }
    }

    loadDrawerData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, user]);

  const handleFollowToggle = async (username: string) => {
    try {
      const res = await api.users.toggleFollow(username);
      setSuggestions((prev) =>
        prev.map((peer) =>
          peer.username === username
            ? { ...peer, is_following: res.is_following }
            : peer
        )
      );
    } catch {
      // Silently handle follow error
    }
  };

  if (!isOpen || !user || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] lg:hidden flex">
      {/* Dimmed backdrop overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        aria-hidden="true"
      />

      {/* Drawer content pane */}
      <div className="relative flex flex-col w-[85%] max-w-sm h-full bg-white dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 shadow-2xl z-10 overflow-y-auto animate-in slide-in-from-left duration-200 border-r border-slate-200/80 dark:border-slate-800/80">
        {/* Top Drawer Header with Close Button */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <GraduationCap className="h-4.5 w-4.5" />
            </div>
            <span className="font-extrabold text-base tracking-tight">
              campus<span className="text-blue-600 dark:text-blue-400">connect</span>
            </span>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Profile Card */}
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <Link
            href={`/profile/${user.username}`}
            onClick={onClose}
            className="flex items-center gap-3 group"
          >
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-lg text-white overflow-hidden shadow-xs ring-2 ring-white dark:ring-slate-800">
              {user.profile_picture ? (
                <Image
                  src={user.profile_picture}
                  alt={user.username}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              ) : (
                user.full_name.charAt(0).toUpperCase()
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white truncate group-hover:text-blue-600 transition">
                  {user.full_name}
                </span>
                {user.is_id_verified && (
                  <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                )}
              </div>
              <p className="text-xs text-slate-400 truncate">@{user.username}</p>
              {user.roll_number && (
                <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 tracking-wider">
                  {user.roll_number}
                </p>
              )}
            </div>
          </Link>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/50">
              {user.is_alumni ? "Alumni" : user.year || "Student"}{" "}
              {user.branch ? `• ${user.branch.replace(/\(.*?\)/g, "").trim()}` : ""}
            </span>
          </div>
        </div>

        {/* Section 1: Core Navigation (Left Sidebar Features) */}
        <div className="p-3 border-b border-slate-200/80 dark:border-slate-800/80">
          <p className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Navigation
          </p>
          <nav className="space-y-1 mt-1">
            <Link
              href="/home"
              onClick={onClose}
              className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition min-h-[44px] ${
                pathname === "/home"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <div className="flex items-center gap-3">
                <Compass className="h-4 w-4" />
                <span>Timeline Feed</span>
              </div>
            </Link>

            <Link
              href="/alumni"
              onClick={onClose}
              className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition min-h-[44px] ${
                pathname.startsWith("/alumni")
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <div className="flex items-center gap-3">
                <GraduationCap className="h-4 w-4 text-indigo-500" />
                <span>Alumni Circle</span>
              </div>
            </Link>

            <Link
              href="/messages"
              onClick={onClose}
              className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition min-h-[44px] ${
                pathname.startsWith("/messages")
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="h-4 w-4 text-blue-500" />
                <span>Direct Messages</span>
              </div>
              {unreadMsgs > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white shadow-2xs">
                  {unreadMsgs > 99 ? "99+" : unreadMsgs}
                </span>
              )}
            </Link>

            <Link
              href="/notifications"
              onClick={onClose}
              className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition min-h-[44px] ${
                pathname.startsWith("/notifications")
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4 text-amber-500" />
                <span>Notifications</span>
              </div>
              {unreadNotifs > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white shadow-2xs">
                  {unreadNotifs > 99 ? "99+" : unreadNotifs}
                </span>
              )}
            </Link>

            <Link
              href="/search"
              onClick={onClose}
              className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition min-h-[44px] ${
                pathname === "/search"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <div className="flex items-center gap-3">
                <Search className="h-4 w-4 text-emerald-500" />
                <span>Find Students</span>
              </div>
            </Link>

            <Link
              href={`/profile/${user.username}`}
              onClick={onClose}
              className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition min-h-[44px] ${
                pathname === `/profile/${user.username}`
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <div className="flex items-center gap-3">
                <UserIcon className="h-4 w-4 text-slate-500" />
                <span>My Profile</span>
              </div>
            </Link>

            {/* Theme Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition min-h-[44px] cursor-pointer"
              title="Toggle Light / Dark Mode"
            >
              <div className="flex items-center gap-3">
                {theme === "dark" ? (
                  <Sun className="h-4 w-4 text-amber-500" />
                ) : (
                  <Moon className="h-4 w-4 text-indigo-500" />
                )}
                <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200/60 dark:border-slate-700/60">
                {theme === "dark" ? "Dark" : "Light"}
              </span>
            </button>
          </nav>
        </div>

        {/* Section 2: Trending on Campus (Right Sidebar Feature) */}
        <div className="p-3 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center justify-between px-3 py-1">
            <div className="flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-orange-500" />
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Trending on Campus
              </p>
            </div>
            <Link
              href="/home"
              onClick={onClose}
              className="text-[10px] font-bold text-blue-600 dark:text-blue-400"
            >
              Feed
            </Link>
          </div>

          <div className="space-y-1 mt-1.5">
            {trendingTopics.length === 0 ? (
              <p className="px-3 py-2 text-xs text-slate-400">
                No active trends yet. Tag a post to start one!
              </p>
            ) : (
              trendingTopics.map((topic) => (
                <button
                  key={topic.tag}
                  onClick={() => {
                    onClose();
                    router.push(`/home?tag=${encodeURIComponent(topic.tag)}`);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/80 transition min-h-[38px]"
                >
                  <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                    #{topic.tag}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {topic.post_count} {topic.post_count === 1 ? "post" : "posts"}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Section 3: Who to Connect With (Suggestions - Right Sidebar Feature) */}
        <div className="p-3 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center justify-between px-3 py-1">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Who to Connect With
            </p>
            <Link
              href="/search"
              onClick={onClose}
              className="text-[10px] font-bold text-blue-600 dark:text-blue-400"
            >
              See all
            </Link>
          </div>

          <div className="space-y-2 mt-2">
            {loadingSuggestions ? (
              <div className="flex items-center justify-center p-3">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              </div>
            ) : suggestions.length === 0 ? (
              <p className="px-3 py-2 text-xs text-slate-400">
                No suggestions right now.
              </p>
            ) : (
              suggestions.map((peer) => (
                <div
                  key={peer.id}
                  className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <Link
                    href={`/profile/${peer.username}`}
                    onClick={onClose}
                    className="flex items-center gap-2 min-w-0 flex-1"
                  >
                    <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-xs text-white overflow-hidden shadow-2xs">
                      {peer.profile_picture ? (
                        <Image
                          src={peer.profile_picture}
                          alt={peer.username}
                          fill
                          sizes="32px"
                          className="object-cover"
                        />
                      ) : (
                        peer.full_name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {peer.full_name}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {peer.year || "Student"} {peer.branch ? `• ${peer.branch.replace(/\(.*?\)/g, "").trim()}` : ""}
                      </p>
                    </div>
                  </Link>

                  <div className="flex items-center gap-1 shrink-0">
                    <Link
                      href={`/messages?user=${peer.username}`}
                      onClick={onClose}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-blue-600 dark:hover:bg-slate-700 transition"
                      title="Message"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                    </Link>
                    <button
                      onClick={() => handleFollowToggle(peer.username)}
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition ${
                        peer.is_following
                          ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                          : "bg-blue-600 text-white hover:bg-blue-700 shadow-2xs"
                      }`}
                    >
                      {peer.is_following ? (
                        <span className="flex items-center gap-1">
                          <UserCheck className="h-3 w-3" />
                          Following
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <UserPlus className="h-3 w-3" />
                          Follow
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Section 4: Campus Verification Card */}
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 p-3.5 text-white shadow-sm">
            <div className="flex items-center gap-2">
              <School className="h-4 w-4 text-blue-200" />
              <span className="text-xs font-extrabold">IPEC Campus Exclusive</span>
            </div>
            <p className="mt-1 text-[11px] text-blue-100 leading-snug">
              Connected exclusively with verified students & alumni of Inderprastha Engineering College.
            </p>
            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-bold text-emerald-200 border border-emerald-300/30">
              <ShieldCheck className="h-3 w-3 text-emerald-300" />
              <span>Roll Number & ID Verified</span>
            </div>
          </div>
        </div>

        {/* Section 5: Logout Footer */}
        <div className="p-4 mt-auto">
          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition min-h-[44px]"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out of CampusConnect</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
