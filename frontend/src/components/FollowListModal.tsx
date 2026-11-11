"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { FollowUser } from "@/types";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { X, UserPlus, UserCheck, Loader2 } from "lucide-react";

export function FollowListModal({
  username,
  type,
  isOpen,
  onClose,
}: {
  username: string;
  type: "followers" | "following";
  isOpen: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    const fetchList = type === "followers"
      ? api.users.getFollowers(username, 1, 50)
      : api.users.getFollowing(username, 1, 50);

    fetchList
      .then((data) => setUsers(data.users))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [username, type, isOpen]);

  const handleToggle = async (targetUsername: string) => {
    try {
      const res = await api.users.toggleFollow(targetUsername);
      setUsers((prev) =>
        prev.map((u) =>
          u.username === targetUsername ? { ...u, is_following: res.is_following } : u
        )
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to toggle follow");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-base font-bold capitalize text-zinc-900 dark:text-white">
            {type}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 max-h-80 overflow-y-auto space-y-3">
          {loading ? (
            <div className="flex justify-center py-8 text-zinc-400">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <p className="py-8 text-center text-xs text-zinc-400">
              No {type} yet.
            </p>
          ) : (
            users.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-lg p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition"
              >
                <a
                  href={`/profile/${item.username}`}
                  onClick={onClose}
                  className="flex items-center gap-3 min-w-0"
                >
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 overflow-hidden">
                    {item.profile_picture ? (
                      <Image
                        src={item.profile_picture}
                        alt={item.username}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : (
                      item.full_name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-zinc-900 dark:text-white">
                      {item.full_name}
                    </p>
                    <p className="truncate text-[11px] text-zinc-400">
                      @{item.username}
                    </p>
                  </div>
                </a>

                {user && !item.is_self && (
                  <button
                    onClick={() => handleToggle(item.username)}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      item.is_following
                        ? "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                        : "bg-indigo-600 text-white hover:bg-indigo-500"
                    }`}
                  >
                    {item.is_following ? (
                      <>
                        <UserCheck className="h-3 w-3" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-3 w-3" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
