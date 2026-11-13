"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Notification, PaginatedNotifications } from "@/types";
import { api } from "@/lib/api";
import { AuthGuard } from "@/components/AuthGuard";
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

  return (
    <AuthGuard>
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-6 sm:py-8 pb-24 lg:pb-8">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-2xs">
            <Bell className="h-4 w-4" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
            Notifications
          </h1>
        </div>

        {unreadExist && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition disabled:opacity-50"
          >
            <CheckCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 py-16 text-center bg-white dark:bg-slate-900">
          <Bell className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-2 text-sm font-bold text-slate-900 dark:text-slate-100">
            No notifications yet
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            When others like your posts, comment, or follow you, you&apos;ll see it here.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.is_read && handleMarkAsRead(n.id)}
              className={`flex items-start gap-3 rounded-2xl border p-4 transition cursor-pointer ${
                n.is_read
                  ? "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                  : "border-blue-200 bg-blue-50/70 dark:border-blue-900 dark:bg-blue-950/20"
              }`}
            >
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
                  <Link
                    href={`/profile/${n.sender.username}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-bold hover:underline"
                  >
                    {n.sender.full_name}
                  </Link>{" "}
                  {n.type === "like" && "liked your post."}
                  {n.type === "comment" && "commented on your post."}
                  {n.type === "follow" && "started following you."}
                </p>

                <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                  {new Date(n.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {!n.is_read && (
                <div className="h-2 w-2 rounded-full bg-blue-600 mt-2 shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}
      </div>
    </AuthGuard>
  );
}
