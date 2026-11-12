"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
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
    const fetchList =
      type === "followers"
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
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-bold capitalize text-slate-900 dark:text-slate-100">
            {type}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 max-h-80 overflow-y-auto space-y-3">
          {loading ? (
            <div className="flex justify-center py-8 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : users.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400">
              No {type} yet.
            </p>
          ) : (
            users.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
              >
                <Link
                  href={`/profile/${item.username}`}
                  onClick={onClose}
                  className="flex items-center gap-3 min-w-0"
                >
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white overflow-hidden shadow-2xs">
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
                    <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {item.full_name}
                    </p>
                    <p className="truncate text-[11px] text-slate-400">
                      @{item.username}
                    </p>
                  </div>
                </Link>

                {user && !item.is_self && (
                  <button
                    onClick={() => handleToggle(item.username)}
                    className={`inline-flex items-center gap-1 rounded-xl px-3 py-1 text-xs font-semibold transition ${
                      item.is_following
                        ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        : "bg-blue-600 text-white hover:bg-blue-700 shadow-2xs"
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
