"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { Notification, PaginatedNotifications } from "@/types";
import { api } from "@/lib/api";
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  CheckCheck,
  Loader2,
} from "lucide-react";

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

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
    } catch {
      //
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await api.notifications.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      //
    } finally {
      setMarkingAll(false);
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <Bell className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-700" />
        <h2 className="mt-4 text-base font-bold text-zinc-900 dark:text-white">
          Sign In to View Notifications
        </h2>
        <a
          href="/login"
          className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs"
        >
          Sign In
        </a>
      </div>
    );
  }

  const unreadExist = notifications.some((n) => !n.is_read);

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
            <Bell className="h-4 w-4" />
          </div>
          <h1 className="text-lg font-bold text-zinc-900 dark:text-white">
            Notifications
          </h1>
        </div>

        {unreadExist && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 transition disabled:opacity-50"
          >
            <CheckCheck className="h-3.5 w-3.5 text-indigo-600" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-zinc-400">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 py-16 text-center">
          <Bell className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-700" />
          <p className="mt-2 text-sm font-semibold text-zinc-900 dark:text-white">
            No notifications yet
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">
            When others like your posts, comment, or follow you, you&apos;ll see it here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.is_read && handleMarkAsRead(n.id)}
              className={`flex items-start gap-3 rounded-xl border p-4 transition cursor-pointer ${
                n.is_read
                  ? "border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900"
                  : "border-indigo-200 bg-indigo-50/50 dark:border-indigo-900/60 dark:bg-indigo-950/20"
              }`}
            >
              {/* Type Icon Badge */}
              <div className="relative mt-0.5">
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700 overflow-hidden dark:bg-indigo-950 dark:text-indigo-300">
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
                <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white dark:bg-zinc-900 shadow-xs">
                  {n.type === "like" && (
                    <Heart className="h-3 w-3 fill-rose-500 text-rose-500" />
                  )}
                  {n.type === "comment" && (
                    <MessageCircle className="h-3 w-3 fill-indigo-500 text-indigo-500" />
                  )}
                  {n.type === "follow" && (
                    <UserPlus className="h-3 w-3 text-green-500" />
                  )}
                </div>
              </div>

              {/* Notification Message */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-snug">
                  <a
                    href={`/profile/${n.sender.username}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-bold hover:underline"
                  >
                    {n.sender.full_name}
                  </a>{" "}
                  {n.type === "like" && "liked your post."}
                  {n.type === "comment" && "commented on your post."}
                  {n.type === "follow" && "started following you."}
                </p>

                <p className="mt-1 text-[11px] text-zinc-400">
                  {new Date(n.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {!n.is_read && (
                <div className="h-2 w-2 rounded-full bg-indigo-600 mt-2 shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
