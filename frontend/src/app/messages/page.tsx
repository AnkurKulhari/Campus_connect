"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Conversation, DirectMessage } from "@/types";
import { api } from "@/lib/api";
import { AuthGuard } from "@/components/AuthGuard";
import {
  MessageSquare,
  Send,
  Search,
  ArrowLeft,
  ShieldCheck,
  GraduationCap,
  MoreVertical,
  Ban,
  Check,
  CheckCheck,
  Loader2,
  AlertCircle,
} from "lucide-react";

function MessagesContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userParam = searchParams.get("user");
  const idParam = searchParams.get("id");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  };

  // Fetch all conversations
  const fetchConversations = useCallback(async () => {
    try {
      const convList = await api.messages.getConversations();
      setConversations(convList);
      return convList;
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
      return [];
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (!user) return;
    fetchConversations();
  }, [user, fetchConversations]);

  // Handle URL query params (?user= or ?id=)
  useEffect(() => {
    if (!user) return;

    const handleParamStart = async () => {
      if (idParam) {
        const targetId = parseInt(idParam, 10);
        const found = conversations.find((c) => c.id === targetId);
        if (found) {
          setActiveConv(found);
          return;
        }
      }

      if (userParam && userParam !== user.username) {
        try {
          const conv = await api.messages.startConversation(userParam);
          setActiveConv(conv);
          // Refresh list to include new conversation
          fetchConversations();
        } catch (err) {
          console.error("Failed to open conversation with user:", err);
        }
      }
    };

    handleParamStart();
  }, [userParam, idParam, user, conversations, fetchConversations]);

  // Fetch messages for active conversation
  const fetchActiveMessages = useCallback(async (convId: number, isInitial = false) => {
    if (isInitial) setLoadingMessages(true);
    try {
      const msgs = await api.messages.getMessages(convId);
      setMessages(msgs);
      if (isInitial) {
        setTimeout(() => scrollToBottom(false), 50);
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      if (isInitial) setLoadingMessages(false);
    }
  }, []);

  // When active conversation changes
  useEffect(() => {
    if (!activeConv) return;
    fetchActiveMessages(activeConv.id, true);
    inputRef.current?.focus();

    // Mark unread as 0 locally
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConv.id ? { ...c, unread_count: 0 } : c))
    );

    // Poll for new messages every 3.5 seconds
    const interval = setInterval(() => {
      fetchActiveMessages(activeConv.id, false);
    }, 3500);

    return () => clearInterval(interval);
  }, [activeConv, fetchActiveMessages]);

  // Scroll to bottom when message list expands
  useEffect(() => {
    scrollToBottom(true);
  }, [messages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConv || !inputText.trim() || sending) return;

    const textToSend = inputText.trim();
    setInputText("");
    setSending(true);
    setError(null);

    try {
      const newMsg = await api.messages.sendMessage(activeConv.id, textToSend);
      setMessages((prev) => [...prev, newMsg]);

      // Update conversation in list
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConv.id
            ? {
                ...c,
                last_message: {
                  id: newMsg.id,
                  sender_id: newMsg.sender_id,
                  content: newMsg.content,
                  is_read: false,
                  created_at: newMsg.created_at,
                },
                last_message_at: newMsg.created_at,
              }
            : c
        )
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send message.");
      setInputText(textToSend); // Restore unsent message
    } finally {
      setSending(false);
    }
  };

  const handleBlockUser = async () => {
    if (!activeConv) return;
    const confirmBlock = window.confirm(
      `Block @${activeConv.participant.username}? They won't be able to message you.`
    );
    if (!confirmBlock) return;

    try {
      await api.messages.blockUser(activeConv.participant.username);
      alert(`@${activeConv.participant.username} has been blocked.`);
      setActiveConv(null);
      fetchConversations();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to block user.");
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.participant.full_name.toLowerCase().includes(q) ||
      c.participant.username.toLowerCase().includes(q)
    );
  });

  const formatMessageTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatConvTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div
      className={`mx-auto max-w-5xl px-2 sm:px-4 py-3 sm:py-6 h-[calc(100vh-4.5rem)] sm:h-[calc(100vh-5rem)] ${
        activeConv ? "pb-0" : "pb-16 md:pb-0"
      }`}
    >
      <div className="flex h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        {/* Left Column: Conversation List */}
        <div
          className={`w-full md:w-80 lg:w-96 flex-col border-r border-slate-200 dark:border-slate-800 ${
            activeConv ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Header & Search */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h1 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span>Direct Messages</span>
            </h1>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Conversation List Scrollable */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-850">
            {loadingConvs ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <MessageSquare className="mx-auto h-8 w-8 opacity-40 mb-2 text-slate-400" />
                <p className="text-xs">
                  {searchQuery
                    ? "No matching conversations."
                    : "No conversations yet. Visit student profiles or Alumni Circle to start a chat!"}
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = activeConv?.id === conv.id;
                const p = conv.participant;
                return (
                  <button
                    key={conv.id}
                    onClick={() => {
                      setActiveConv(conv);
                      router.replace(`/messages?id=${conv.id}`, { scroll: false });
                    }}
                    className={`w-full flex items-start gap-3 p-3.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                      isSelected
                        ? "bg-blue-50/80 dark:bg-slate-800"
                        : ""
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-sm text-white overflow-hidden shadow-2xs">
                      {p.profile_picture ? (
                        <Image
                          src={p.profile_picture}
                          alt={p.username}
                          fill
                          sizes="44px"
                          className="object-cover"
                        />
                      ) : (
                        p.full_name.charAt(0).toUpperCase()
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                          {p.full_name}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {conv.last_message
                            ? formatConvTime(conv.last_message.created_at)
                            : ""}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                        <span className="truncate">@{p.username}</span>
                        {p.year && (
                          <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 text-[9px] font-semibold text-slate-600 dark:text-slate-300 shrink-0">
                            {p.year}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-1">
                        <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                          {conv.last_message?.content || "Started conversation"}
                        </p>
                        {conv.unread_count > 0 && (
                          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shrink-0 shadow-2xs">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Chat Window */}
        <div
          className={`flex-1 flex flex-col h-full bg-slate-50/50 dark:bg-slate-950 ${
            activeConv ? "flex" : "hidden md:flex"
          }`}
        >
          {activeConv ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setActiveConv(null);
                      router.replace("/messages", { scroll: false });
                    }}
                    className="md:hidden rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center -ml-1"
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>

                  <Link
                    href={`/profile/${activeConv.participant.username}`}
                    className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-sm text-white overflow-hidden shadow-2xs"
                  >
                    {activeConv.participant.profile_picture ? (
                      <Image
                        src={activeConv.participant.profile_picture}
                        alt={activeConv.participant.username}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : (
                      activeConv.participant.full_name.charAt(0).toUpperCase()
                    )}
                  </Link>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/profile/${activeConv.participant.username}`}
                        className="font-bold text-xs sm:text-sm text-slate-900 hover:underline dark:text-slate-100"
                      >
                        {activeConv.participant.full_name}
                      </Link>
                      {activeConv.participant.is_id_verified && (
                        <span title="Verified Student ID">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>@{activeConv.participant.username}</span>
                      {activeConv.participant.is_alumni || activeConv.participant.year === "Alumni" ? (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-2 py-0.2 text-[10px] font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                          <GraduationCap className="h-2.5 w-2.5" />
                          <span>Alumni</span>
                        </span>
                      ) : activeConv.participant.year ? (
                        <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.2 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                          {activeConv.participant.year}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Chat Options */}
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-800 dark:bg-slate-900 z-20">
                      <Link
                        href={`/profile/${activeConv.participant.username}`}
                        className="block px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                        onClick={() => setMenuOpen(false)}
                      >
                        View Full Profile
                      </Link>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          handleBlockUser();
                        }}
                        className="w-full flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        <Ban className="h-3.5 w-3.5" />
                        <span>Block User</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMessages ? (
                  <div className="flex h-48 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center text-slate-400 py-12">
                    <MessageSquare className="h-10 w-10 opacity-30 mb-2 text-blue-500" />
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">No messages in this conversation yet.</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Send a message to introduce yourself, discuss projects, or ask questions!
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = user && msg.sender_id === user.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[78%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-2xs whitespace-pre-wrap break-words ${
                            isMe
                              ? "bg-blue-600 text-white rounded-tr-xs"
                              : "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-tl-xs"
                          }`}
                        >
                          {msg.content}
                        </div>
                        <div className="flex items-center gap-1 mt-1 px-1 text-[10px] text-slate-400">
                          <span>{formatMessageTime(msg.created_at)}</span>
                          {isMe && (
                            <span>
                              {msg.is_read ? (
                                <CheckCheck className="h-3 w-3 text-blue-500" />
                              ) : (
                                <Check className="h-3 w-3 text-slate-400" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Error Callout */}
              {error && (
                <div className="mx-4 mb-2 flex items-center gap-2 rounded-xl bg-rose-50 p-2 text-xs text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Chat Input Bar */}
              <form
                onSubmit={handleSendMessage}
                className="flex items-center gap-2 border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a message (Enter to send)..."
                  maxLength={2000}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || sending}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs transition hover:bg-blue-700 disabled:opacity-40"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Empty State when no conversation selected */
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 mb-4 shadow-xs">
                <MessageSquare className="h-8 w-8" />
              </div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                Your Direct Messages
              </h2>
              <p className="mt-1 text-xs text-slate-500 max-w-sm leading-relaxed">
                Send private messages to batchmates, reach out to alumni for career advice, or collaborate with team members on hackathons and college projects.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <AuthGuard>
      <Suspense
        fallback={
          <div className="flex h-96 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        }
      >
        <MessagesContent />
      </Suspense>
    </AuthGuard>
  );
}
