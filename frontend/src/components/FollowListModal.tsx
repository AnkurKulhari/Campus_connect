"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { FollowUser } from "@/types";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { X, UserPlus, UserCheck, UserMinus, Loader2 } from "lucide-react";

export function FollowListModal({
  username,
  type,
  isOpen,
  onClose,
  onFollowerRemoved,
}: {
  username: string;
  type: "followers" | "following";
  isOpen: boolean;
  onClose: () => void;
  onFollowerRemoved?: (username: string) => void;
}) {
  const { user } = useAuth();
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmRemoveUser, setConfirmRemoveUser] = useState<FollowUser | null>(null);
  const [removingUser, setRemovingUser] = useState<string | null>(null);

  const isOwner = Boolean(user && user.username === username);

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

  const executeRemoveFollower = async (targetUsername: string) => {
    setRemovingUser(targetUsername);
    try {
      await api.users.removeFollower(targetUsername);
      setUsers((prev) => prev.filter((u) => u.username !== targetUsername));
      setConfirmRemoveUser(null);
      if (onFollowerRemoved) {
        onFollowerRemoved(targetUsername);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to remove follower");
    } finally {
      setRemovingUser(null);
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

                <div className="flex items-center gap-1.5 shrink-0">
                  {user && !item.is_self && (
                    <button
                      type="button"
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

                  {isOwner && type === "followers" && !item.is_self && (
                    <button
                      type="button"
                      onClick={() => setConfirmRemoveUser(item)}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 dark:hover:border-rose-800 transition cursor-pointer"
                      title={`Remove @${item.username} from your followers`}
                    >
                      <UserMinus className="h-3 w-3" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Remove Follower Confirmation Dialog */}
        {confirmRemoveUser && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center animate-in fade-in zoom-in-95 duration-150">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
                <UserMinus className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Remove follower?
              </h3>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                CampusConnect won&apos;t notify <span className="font-semibold text-slate-700 dark:text-slate-200">@{confirmRemoveUser.username}</span> that they were removed from your followers.
              </p>
              <div className="mt-5 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setConfirmRemoveUser(null)}
                  disabled={removingUser === confirmRemoveUser.username}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => executeRemoveFollower(confirmRemoveUser.username)}
                  disabled={removingUser === confirmRemoveUser.username}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50 transition cursor-pointer"
                >
                  {removingUser === confirmRemoveUser.username ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    "Remove"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
