"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Post } from "@/types";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  X,
  Copy,
  Check,
  Search,
  Send,
  Loader2,
  Clock,
  ShieldCheck,
  Share2,
} from "lucide-react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
}

interface SharePerson {
  id: number;
  username: string;
  full_name: string;
  profile_picture: string | null;
  is_id_verified?: boolean;
  isRecent: boolean;
}

export function ShareModal({ isOpen, onClose, post }: ShareModalProps) {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [people, setPeople] = useState<SharePerson[]>([]);
  const [loading, setLoading] = useState(false);
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});
  const [sendingUser, setSendingUser] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const postUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/posts/${post.id}`
      : `https://campusc0nnect.vercel.app/posts/${post.id}`;

  useEffect(() => {
    if (!isOpen || !user) return;

    let isSubscribed = true;
    setLoading(true);
    setError(null);

    const loadPeople = async () => {
      try {
        // 1. Fetch recent conversations (recent chat people on top)
        const conversationsPromise = api.messages.getConversations().catch(() => []);
        // 2. Fetch following people
        const followingPromise = api.users
          .getFollowing(user.username, 1, 50)
          .catch(() => ({ users: [] }));

        const [conversations, followingRes] = await Promise.all([
          conversationsPromise,
          followingPromise,
        ]);

        if (!isSubscribed) return;

        const mergedList: SharePerson[] = [];
        const seenUsernames = new Set<string>();

        // Add recent chat participants first
        conversations.forEach((conv) => {
          const p = conv.participant;
          if (p && p.username !== user.username && !seenUsernames.has(p.username)) {
            seenUsernames.add(p.username);
            mergedList.push({
              id: p.id,
              username: p.username,
              full_name: p.full_name,
              profile_picture: p.profile_picture,
              is_id_verified: p.is_id_verified,
              isRecent: true,
            });
          }
        });

        // Add following users who are not already in recent chat
        followingRes.users.forEach((fUser) => {
          if (fUser.username !== user.username && !seenUsernames.has(fUser.username)) {
            seenUsernames.add(fUser.username);
            mergedList.push({
              id: fUser.id,
              username: fUser.username,
              full_name: fUser.full_name,
              profile_picture: fUser.profile_picture,
              isRecent: false,
            });
          }
        });

        setPeople(mergedList);
      } catch (err: unknown) {
        if (isSubscribed) {
          setError(err instanceof Error ? err.message : "Failed to load people");
        }
      } finally {
        if (isSubscribed) setLoading(false);
      }
    };

    loadPeople();

    return () => {
      isSubscribed = false;
    };
  }, [isOpen, user]);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(postUrl);
      } else {
        const input = document.createElement("input");
        input.value = postUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleSendDm = async (targetUsername: string) => {
    if (sendingUser || sentMap[targetUsername]) return;
    setSendingUser(targetUsername);

    try {
      const shareMessage = postUrl;
      await api.messages.startConversation(targetUsername, shareMessage);
      setSentMap((prev) => ({ ...prev, [targetUsername]: true }));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to send post");
    } finally {
      setSendingUser(null);
    }
  };

  if (!isOpen || !mounted) return null;

  const filteredPeople = people.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.full_name.toLowerCase().includes(q) ||
      p.username.toLowerCase().includes(q)
    );
  });

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xl dark:border-slate-800 dark:bg-[#131B2E] transition-all scale-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <Share2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Share Post
              </h3>
              <p className="text-[11px] text-slate-400 font-normal">
                By @{post.author.username}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
            aria-label="Close share dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Copy Link Option */}
        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Post Link
          </label>
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-1.5 dark:border-slate-800 dark:bg-slate-900/60">
            <input
              type="text"
              readOnly
              value={postUrl}
              className="w-full bg-transparent px-2.5 text-xs text-slate-600 dark:text-slate-300 truncate focus:outline-none select-all"
            />
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition cursor-pointer shadow-xs ${
                copied
                  ? "bg-emerald-600 text-white shadow-emerald-500/20"
                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20"
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Send in Direct Message */}
        <div className="mt-5 flex-1 min-h-0 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Send in Direct Message
            </label>
            <span className="text-[10px] text-slate-400 font-medium">
              Recent chats on top
            </span>
          </div>

          {/* Search Input */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search following or recent chats..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none dark:border-slate-800 dark:bg-slate-900/60 dark:text-white transition"
            />
          </div>

          {/* People List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-[160px] max-h-[240px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin text-blue-500 mb-2" />
                <span className="text-xs">Loading contacts...</span>
              </div>
            ) : filteredPeople.length > 0 ? (
              filteredPeople.map((person) => {
                const isSent = Boolean(sentMap[person.username]);
                const isSending = sendingUser === person.username;

                return (
                  <div
                    key={person.username}
                    className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition border border-transparent hover:border-slate-100 dark:hover:border-slate-800"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-xs text-white overflow-hidden shadow-2xs">
                        {person.profile_picture ? (
                          <Image
                            src={person.profile_picture}
                            alt={person.username}
                            fill
                            sizes="36px"
                            className="object-cover"
                          />
                        ) : (
                          person.full_name.charAt(0).toUpperCase()
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1 truncate">
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {person.full_name}
                          </span>
                          {person.is_id_verified && (
                            <ShieldCheck className="h-3 w-3 text-emerald-500 shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 truncate">
                          <span>@{person.username}</span>
                          {person.isRecent && (
                            <>
                              <span>•</span>
                              <span className="inline-flex items-center gap-0.5 text-blue-600 dark:text-blue-400 font-semibold">
                                <Clock className="h-2.5 w-2.5" />
                                <span>Recent</span>
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSendDm(person.username)}
                      disabled={isSent || isSending}
                      className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer shrink-0 ${
                        isSent
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60"
                          : "bg-blue-600 text-white hover:bg-blue-700 shadow-xs"
                      } disabled:cursor-default`}
                    >
                      {isSending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : isSent ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Sent</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-3 w-3" />
                          <span>Send</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-xs text-slate-400 font-normal">
                {searchQuery
                  ? "No matching student found."
                  : "No recent chats or followed students yet."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
