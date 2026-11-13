"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Notification, PaginatedNotifications } from "@/types";
import { api } from "@/lib/api";
import { AuthGuard } from "@/components/AuthGuard";
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
} from "@/lib/browserNotifications";
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  CheckCheck,
  Loader2,
  Trash2,
  Sparkles,
  ExternalLink,
} from "lucide-react";

type NotifFilter = "all" | "interactions" | "follows";

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);
  const [filter, setFilter] = useState<NotifFilter>("all");
  const [showPermBanner, setShowPermBanner] = useState(false);

  useEffect(() => {
    if (isNotificationSupported() && getNotificationPermission() === "default") {
      setShowPermBanner(true);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const data: PaginatedNotifications = await api.notifications.list(1, 50);
      setNotifications(data.notifications);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
  }, [user, fetchNotifications]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.notifications.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("campusconnect-unread-update"));
      }
    } catch {
      //
    }
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!n.is_read) {
      await handleMarkAsRead(n.id);
    }
    if ((n.type === "like" || n.type === "comment") && n.post_id) {
      router.push(`/posts/${n.post_id}`);
    } else if (n.type === "follow") {
      router.push(`/profile/${n.sender.username}`);
    }
  };

  const handleDeleteNotification = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await api.notifications.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("campusconnect-unread-update"));
      }
    } catch {
      //
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await api.notifications.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("campusconnect-unread-update"));
      }
    } catch {
      //
    } finally {
      setMarkingAll(false);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to clear all notifications?")) return;
    setClearingAll(true);
    try {
      await api.notifications.clearAll();
      setNotifications([]);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("campusconnect-unread-update"));
      }
    } catch {
      //
    } finally {
      setClearingAll(false);
    }
  };

  const handleEnableDesktopNotifications = async () => {
    const res = await requestNotificationPermission();
    if (res !== "default") {
      setShowPermBanner(false);
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <Bell className="mx-auto h-12 w-12 text-slate-400" />
        <h2 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
          Sign In to View Notifications
        </h2>
        <Link
          href="/login"
          className="mt-4 inline-block rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const unreadExist = notifications.some((n) => !n.is_read);

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "interactions") return n.type === "like" || n.type === "comment";
    if (filter === "follows") return n.type === "follow";
    return true;
  });

  return (
    <AuthGuard>
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-6 sm:py-8 pb-24 lg:pb-8">
        {/* Browser Notifications Opt-In Banner */}
        {showPermBanner && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-3.5 text-white shadow-sm">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-5 w-5 shrink-0 text-blue-200" />
              <p className="text-xs font-medium">
                Enable desktop alerts to never miss a direct message or campus mention.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleEnableDesktopNotifications}
                className="rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-blue-700 shadow-2xs hover:bg-blue-50 transition"
              >
                Enable
              </button>
              <button
                onClick={() => setShowPermBanner(false)}
                className="rounded-xl px-2 py-1.5 text-xs text-blue-100 hover:text-white"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-2xs">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                Notifications
              </h1>
              <p className="text-[11px] text-slate-500">
                Activity from your IPEC peers & classmates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {unreadExist && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition disabled:opacity-50"
              >
                <CheckCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span>Mark read</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                disabled={clearingAll}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:border-rose-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-rose-400 transition disabled:opacity-50"
                title="Clear all notifications"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 mb-4 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80">
          <button
            onClick={() => setFilter("all")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
              filter === "all"
                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter("interactions")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
              filter === "interactions"
                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Likes & Comments (
            {notifications.filter((n) => n.type === "like" || n.type === "comment").length}
            )
          </button>
          <button
            onClick={() => setFilter("follows")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
              filter === "follows"
                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Follows ({notifications.filter((n) => n.type === "follow").length})
          </button>
        </div>

        {/* List Content */}
        {loading ? (
          <div className="flex justify-center py-16 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 py-16 text-center bg-white dark:bg-slate-900">
            <Bell className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-2 text-sm font-bold text-slate-900 dark:text-slate-100">
              {filter === "all"
                ? "No notifications yet"
                : filter === "interactions"
                ? "No likes or comments yet"
                : "No new followers yet"}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              When classmates engage with your posts or profile, you&apos;ll see updates here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredNotifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`group flex items-center justify-between gap-3 rounded-2xl border p-3.5 transition cursor-pointer hover:shadow-2xs ${
                  n.is_read
                    ? "border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900"
                    : "border-blue-200 bg-blue-50/70 dark:border-blue-900/60 dark:bg-blue-950/20"
                }`}
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  {/* Type Icon Badge */}
                  <div className="relative mt-0.5">
                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white overflow-hidden shadow-2xs">
                      {n.sender.profile_picture ? (
                        <Image
                          src={n.sender.profile_picture}
                          alt={n.sender.username}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      ) : (
                        n.sender.full_name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white dark:bg-slate-900 shadow-xs">
                      {n.type === "like" && (
                        <Heart className="h-3 w-3 fill-rose-500 text-rose-500" />
                      )}
                      {n.type === "comment" && (
                        <MessageCircle className="h-3 w-3 fill-blue-600 text-blue-600" />
                      )}
                      {n.type === "follow" && (
                        <UserPlus className="h-3 w-3 text-emerald-600" />
                      )}
                    </div>
                  </div>

                  {/* Notification Message */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-900 dark:text-slate-100 leading-snug">
                      <span className="font-bold hover:underline">
                        {n.sender.full_name}
                      </span>{" "}
                      {n.type === "like" && "liked your post."}
                      {n.type === "comment" && "commented on your post."}
                      {n.type === "follow" && "started following you."}
                    </p>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        {new Date(n.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {((n.type === "like" || n.type === "comment") && n.post_id) && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 dark:text-blue-400 font-semibold group-hover:underline">
                          <span>View post</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!n.is_read && (
                    <div className="h-2 w-2 rounded-full bg-blue-600 shrink-0" title="Unread" />
                  )}
                  <button
                    onClick={(e) => handleDeleteNotification(e, n.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Dismiss"
                    aria-label="Dismiss notification"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
