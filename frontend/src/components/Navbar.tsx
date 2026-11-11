"use client";

import React, { useEffect, useState } from "react";
import Link from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import {
  GraduationCap,
  Home,
  Bell,
  User as UserIcon,
  LogOut,
  PlusCircle,
} from "lucide-react";
import { api } from "@/lib/api";

export function Navbar({ onOpenCreatePost }: { onOpenCreatePost?: () => void }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    if (!user) return;

    const fetchCount = async () => {
      try {
        const res = await api.notifications.getUnreadCount();
        setUnreadCount(res.unread_count);
      } catch {
        // Silently catch if not authorized
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 20000); // refresh every 20s
    return () => clearInterval(interval);
  }, [user]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="flex items-center gap-2.5 font-bold text-xl tracking-tight text-zinc-900 dark:text-white"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-sm shadow-indigo-500/20">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span>
              Campus<span className="text-indigo-600 dark:text-indigo-400">Connect</span>
            </span>
          </a>
          <span className="hidden sm:inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
            IPEC Campus
          </span>
        </div>

        {/* Navigation */}
        {user ? (
          <nav className="flex items-center gap-1 sm:gap-2">
            <a
              href="/"
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                pathname === "/"
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
              }`}
            >
              <Home className="h-4 w-4" />
              <span className="hidden md:inline">Feed</span>
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
              href={`/profile/${user.username}`}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                pathname.startsWith("/profile")
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
              }`}
            >
              <UserIcon className="h-4 w-4" />
              <span className="hidden md:inline">@{user.username}</span>
            </a>

            {onOpenCreatePost && (
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
