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
      <div className="flex items-center justify-between pb-4 border-b border-[#E6DED3] dark:border-[#383129] mb-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#8C7A58] text-white shadow-2xs">
            <Bell className="h-4 w-4" />
          </div>
          <h1 className="text-xl font-extrabold text-[#2C251F] dark:text-[#F6F2EC]">
            Notifications
          </h1>
        </div>

        {unreadExist && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#DFD5C6] bg-[#FAF7F2] px-3.5 py-1.5 text-xs font-semibold text-[#685E53] hover:bg-[#EDE6DA] dark:border-[#383129] dark:bg-[#221E1A] dark:text-[#C7BCB0] transition disabled:opacity-50"
          >
            <CheckCheck className="h-3.5 w-3.5 text-[#8C7A58] dark:text-[#A8936E]" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-[#8C7E70]">
          <Loader2 className="h-8 w-8 animate-spin text-[#8C7A58]" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#DFD5C6] dark:border-[#383129] py-16 text-center bg-[#FAF7F2] dark:bg-[#221E1A]">
          <Bell className="mx-auto h-8 w-8 text-[#8C7E70]" />
          <p className="mt-2 text-sm font-bold text-[#2C251F] dark:text-[#F6F2EC]">
            No notifications yet
          </p>
          <p className="text-xs text-[#8C7E70] mt-0.5">
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
                  ? "border-[#E6DED3] bg-[#FAF7F2] dark:border-[#383129] dark:bg-[#221E1A]"
                  : "border-[#DFD5C6] bg-[#EDE6DA]/70 dark:border-[#3D352B] dark:bg-[#28231E]"
              }`}
            >
              {/* Type Icon Badge */}
              <div className="relative mt-0.5">
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#8C7A58] font-bold text-white overflow-hidden shadow-2xs">
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
                <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white dark:bg-[#221E1A] shadow-xs">
                  {n.type === "like" && (
                    <Heart className="h-3 w-3 fill-[#E15241] text-[#E15241]" />
                  )}
                  {n.type === "comment" && (
                    <MessageCircle className="h-3 w-3 fill-[#8C7A58] text-[#8C7A58]" />
                  )}
                  {n.type === "follow" && (
                    <UserPlus className="h-3 w-3 text-emerald-600" />
                  )}
                </div>
              </div>

              {/* Notification Message */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#2C251F] dark:text-[#F6F2EC] leading-snug">
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

                <p className="mt-1 text-[11px] text-[#8C7E70] dark:text-[#9F9385]">
                  {new Date(n.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {!n.is_read && (
                <div className="h-2 w-2 rounded-full bg-[#E15241] mt-2 shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
