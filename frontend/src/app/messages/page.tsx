"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Conversation, DirectMessage } from "@/types";
import { api } from "@/lib/api";
import { AuthGuard } from "@/components/AuthGuard";
import { ConfirmModal } from "@/components/ConfirmModal";
import { ChatMessageContent } from "@/components/ChatMessageContent";
import {
  playMessageSentSound,
  playMessageReceivedSound,
  isSoundEnabled,
  setSoundEnabled,
} from "@/lib/sound";
import { showBrowserNotification } from "@/lib/browserNotifications";
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
  UserPlus,
  Volume2,
  VolumeX,
  Copy,
  Trash2,
  X,
  Sparkles,
} from "lucide-react";

const STARTER_PROMPTS = [
  "👋 Hey! Saw your profile on CampusConnect.",
  "🤝 Hey, are you working on any hackathon projects?",
  "📚 Hey, do you have notes for this semester?",
];

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
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dmTab, setDmTab] = useState<"following" | "requests">("following");
  const [soundOn, setSoundOn] = useState(true);
  const [inChatSearchOpen, setInChatSearchOpen] = useState(false);
  const [inChatSearchQuery, setInChatSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [selectedMsgId, setSelectedMsgId] = useState<number | null>(null);
  const [activeMsgAction, setActiveMsgAction] = useState<DirectMessage | null>(null);
  const [mounted, setMounted] = useState(false);
  const [msgIdToUnsend, setMsgIdToUnsend] = useState<number | null>(null);
  const [isUnsending, setIsUnsending] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [pressingMsgId, setPressingMsgId] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const handledParamRef = useRef<string | null>(null);
  const currentConvIdRef = useRef<number | null>(null);
  const latestMessageIdRef = useRef<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const activeConvRef = useRef<Conversation | null>(null);
  activeConvRef.current = activeConv;

  const maxKnownMsgIdRef = useRef<number>(0);
  const isConversationsInitializedRef = useRef<boolean>(false);
  const fetchSeqRef = useRef<number>(0);
  const isSendingRef = useRef<boolean>(false);

  useEffect(() => {
    setSoundOn(isSoundEnabled());
  }, []);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
  };

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  };

  // Fetch messages for active conversation
  const fetchActiveMessages = useCallback(async (convId: number, isInitial = false) => {
    if (isInitial) setLoadingMessages(true);
    const seq = ++fetchSeqRef.current;
    try {
      const msgs = await api.messages.getMessages(convId);

      // If a newer fetch or send operation has started, drop this stale response!
      if (seq !== fetchSeqRef.current) return;
      
      // Check for incoming new messages during polling
      if (!isInitial && msgs.length > 0) {
        const newest = msgs[msgs.length - 1];
        if (
          latestMessageIdRef.current &&
          newest.id > latestMessageIdRef.current &&
          newest.sender_id !== user?.id
        ) {
          playMessageReceivedSound();
          if (typeof document !== "undefined" && document.hidden) {
            showBrowserNotification(`New message from @${activeConvRef.current?.participant.username || "classmate"}`, {
              body: newest.content,
              url: `/messages?id=${convId}`,
            });
          }
        }
      }

      if (msgs.length > 0) {
        const newest = msgs[msgs.length - 1];
        latestMessageIdRef.current = newest.id;
        maxKnownMsgIdRef.current = Math.max(maxKnownMsgIdRef.current, newest.id);

        // Keep conversation list snippet in sync with newest message
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  last_message: {
                    id: newest.id,
                    sender_id: newest.sender_id,
                    content: newest.content,
                    is_read: true,
                    created_at: newest.created_at,
                  },
                  last_message_at: newest.created_at,
                  unread_count: 0,
                }
              : c
          )
        );
      }

      // Preserve any in-flight optimistic messages (id < 0) so they never vanish
      setMessages((prev) => {
        const pending = prev.filter((m) => m.id < 0);
        if (pending.length === 0) return msgs;
        const stillPending = pending.filter(
          (opt) =>
            !msgs.some(
              (m) =>
                m.id === opt.id ||
                (m.sender_id === opt.sender_id &&
                  m.content === opt.content &&
                  Math.abs(new Date(m.created_at).getTime() - new Date(opt.created_at).getTime()) < 30000)
            )
        );
        return [...msgs, ...stillPending];
      });

      if (isInitial) {
        setTimeout(() => scrollToBottom(false), 50);
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      if (isInitial) setLoadingMessages(false);
    }
  }, [user?.id]);

  // Fetch all conversations with live incoming message detection
  const fetchConversations = useCallback(async (isInitial = false) => {
    if (isInitial) setLoadingConvs(true);
    try {
      const convList = await api.messages.getConversations();

      const highestMsgId = convList.reduce((max, c) => {
        return c.last_message ? Math.max(max, c.last_message.id) : max;
      }, 0);

      if (!isConversationsInitializedRef.current) {
        isConversationsInitializedRef.current = true;
        maxKnownMsgIdRef.current = highestMsgId;
      } else if (highestMsgId > maxKnownMsgIdRef.current) {
        // Detect if any new incoming message arrived across any conversation
        const incoming = convList.find(
          (c) =>
            c.last_message &&
            c.last_message.id > maxKnownMsgIdRef.current &&
            c.last_message.sender_id !== user?.id
        );

        if (incoming && incoming.last_message) {
          if (currentConvIdRef.current === incoming.id) {
            // Already inside this chat; refresh active messages immediately
            fetchActiveMessages(incoming.id, false);
          } else {
            // Message in another chat or when on conversation list view
            playMessageReceivedSound();
            if (typeof document !== "undefined" && document.hidden) {
              showBrowserNotification(
                `New message from @${incoming.participant.username}`,
                {
                  body: incoming.last_message.content,
                  url: `/messages?id=${incoming.id}`,
                }
              );
            }
          }
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("campusconnect-unread-update"));
          }
        }
        maxKnownMsgIdRef.current = Math.max(maxKnownMsgIdRef.current, highestMsgId);
      }

      // If active conversation is open, keep its local unread count 0
      const adjustedList = convList.map((c) =>
        currentConvIdRef.current && c.id === currentConvIdRef.current
          ? { ...c, unread_count: 0 }
          : c
      );

      setConversations(adjustedList);
      return adjustedList;
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
      return [];
    } finally {
      if (isInitial) setLoadingConvs(false);
    }
  }, [user?.id, fetchActiveMessages]);

  // Initial load and URL query param resolution (only runs once per param change)
  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    const init = async () => {
      const convList = await fetchConversations(true);
      if (!isMounted) return;

      const paramKey = `${idParam || ""}_${userParam || ""}`;
      if (handledParamRef.current === paramKey) return;
      handledParamRef.current = paramKey;

      if (idParam) {
        const targetId = parseInt(idParam, 10);
        const found = convList.find((c) => c.id === targetId);
        if (found) {
          currentConvIdRef.current = found.id;
          setActiveConv(found);
          if (found.participant.is_following === false) {
            setDmTab("requests");
          }
          return;
        }
      }

      if (userParam && userParam !== user.username) {
        try {
          const conv = await api.messages.startConversation(userParam);
          if (!isMounted) return;
          currentConvIdRef.current = conv.id;
          setActiveConv(conv);
          if (conv.participant.is_following === false) {
            setDmTab("requests");
          }
          setConversations((prev) =>
            prev.some((c) => c.id === conv.id) ? prev : [conv, ...prev]
          );
        } catch (err) {
          console.error("Failed to open conversation with user:", err);
        }
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [user, idParam, userParam, fetchConversations]);

  // Continuous background polling for conversations list (active both when in chat and on list view)
  useEffect(() => {
    if (!user) return;

    let timeoutId: NodeJS.Timeout;
    let isCancelled = false;

    const scheduleNextPoll = () => {
      const isHidden = typeof document !== "undefined" && document.hidden;
      const delay = isHidden ? 15000 : 5000;

      timeoutId = setTimeout(async () => {
        if (isCancelled) return;
        await fetchConversations(false);
        if (!isCancelled) scheduleNextPoll();
      }, delay);
    };

    scheduleNextPoll();

    const handleVisibilityChange = () => {
      if (!document.hidden && !isCancelled) {
        fetchConversations(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user, fetchConversations]);

  // When active conversation changes
  useEffect(() => {
    if (!activeConv) {
      currentConvIdRef.current = null;
      return;
    }

    const isDifferentConv = currentConvIdRef.current !== activeConv.id;
    currentConvIdRef.current = activeConv.id;

    fetchActiveMessages(activeConv.id, isDifferentConv);
    textareaRef.current?.focus();

    // Silently mark unread as 0 locally
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConv.id && c.unread_count > 0 ? { ...c, unread_count: 0 } : c))
    );

    // Sync notification badges in navbar & mobile nav immediately
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("campusconnect-unread-update"));
    }

    // Poll for new messages every 4 seconds in the active conversation (skip while sending)
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      if (isSendingRef.current) return;
      fetchActiveMessages(activeConv.id, false);
    }, 4000);

    return () => clearInterval(interval);
  }, [activeConv?.id, fetchActiveMessages]);

  // Scroll to bottom when message list expands
  useEffect(() => {
    scrollToBottom(true);
  }, [messages.length]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
  };

  // 0ms Latency Optimistic Send
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConv || !inputText.trim()) return;

    // Invalidate any in-flight background polls and pause active chat poll
    fetchSeqRef.current++;
    isSendingRef.current = true;

    const textToSend = inputText.trim();
    setInputText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setError(null);

    // Optimistic temporary message
    const tempId = -Date.now();
    const optimisticMsg: DirectMessage = {
      id: tempId,
      conversation_id: activeConv.id,
      sender_id: user?.id || 0,
      receiver_id: activeConv.participant.id,
      content: textToSend,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    // Instant 0ms UI update
    setMessages((prev) => [...prev, optimisticMsg]);
    playMessageSentSound();

    // Optimistically update conversation snippet in left list
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConv.id
          ? {
              ...c,
              last_message: {
                id: tempId,
                sender_id: user?.id || 0,
                content: textToSend,
                is_read: false,
                created_at: optimisticMsg.created_at,
              },
              last_message_at: optimisticMsg.created_at,
            }
          : c
      )
    );

    try {
      const newMsg = await api.messages.sendMessage(activeConv.id, textToSend);
      latestMessageIdRef.current = newMsg.id;
      maxKnownMsgIdRef.current = Math.max(maxKnownMsgIdRef.current, newMsg.id);

      // Invalidate any older in-flight fetches again
      fetchSeqRef.current++;

      // Safely replace optimistic placeholder with confirmed server message
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) {
          return prev.filter((m) => m.id !== tempId);
        }
        if (prev.some((m) => m.id === tempId)) {
          return prev.map((m) => (m.id === tempId ? newMsg : m));
        }
        return [...prev, newMsg];
      });

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
      // Rollback failed optimistic message
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInputText(textToSend); // Restore unsent message
    } finally {
      isSendingRef.current = false;
    }
  };

  const handleDeleteMessage = (msgId: number) => {
    setMsgIdToUnsend(msgId);
  };

  const confirmUnsend = async () => {
    if (!msgIdToUnsend) return;
    setIsUnsending(true);
    try {
      await api.messages.deleteMessage(msgIdToUnsend);
      setMessages((prev) => prev.filter((m) => m.id !== msgIdToUnsend));
      setSelectedMsgId(null);
      setMsgIdToUnsend(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to unsend message.");
    } finally {
      setIsUnsending(false);
    }
  };

  const handleCopyText = (msgId: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => {
      setCopiedId(null);
      setSelectedMsgId(null);
    }, 1800);
  };

  // Mobile Long-Press gesture with 8px scroll cancellation (prevents accidental triggers during scrolling)
  const handleTouchStart = (msg: DirectMessage, e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    setPressingMsgId(msg.id);

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    // 400ms intentional hold threshold
    longPressTimerRef.current = setTimeout(() => {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try {
          navigator.vibrate(35);
        } catch {}
      }
      setActiveMsgAction(msg);
      setPressingMsgId(null);
      longPressTimerRef.current = null;
    }, 400);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartRef.current.x);
    const dy = Math.abs(touch.clientY - touchStartRef.current.y);

    // If movement exceeds 8px in any direction, the user is scrolling: cancel long press immediately!
    if (dx > 8 || dy > 8) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      setPressingMsgId(null);
      touchStartRef.current = null;
    }
  };

  const handleTouchEnd = () => {
    // If finger was lifted before 400ms, it was a normal tap or scroll finish: cancel!
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setPressingMsgId(null);
    touchStartRef.current = null;
  };

  const handleBlockUser = () => {
    if (!activeConv) return;
    setMenuOpen(false);
    setShowBlockModal(true);
  };

  const confirmBlock = async () => {
    if (!activeConv) return;
    setIsBlocking(true);
    try {
      await api.messages.blockUser(activeConv.participant.username);
      setShowBlockModal(false);
      setActiveConv(null);
      fetchConversations();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to block user.");
    } finally {
      setIsBlocking(false);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.participant.full_name.toLowerCase().includes(q) ||
      c.participant.username.toLowerCase().includes(q)
    );
  });

  const followingConvs = filteredConversations.filter(
    (c) => c.participant.is_following !== false
  );
  const requestConvs = filteredConversations.filter(
    (c) => c.participant.is_following === false
  );
  const displayedConversations =
    dmTab === "following" ? followingConvs : requestConvs;

  const formatMessageTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDateDivider = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
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

  const visibleMessages = inChatSearchQuery.trim()
    ? messages.filter((m) =>
        m.content.toLowerCase().includes(inChatSearchQuery.toLowerCase())
      )
    : messages;

  return (
    <div
      className={`mx-auto max-w-5xl h-[calc(100dvh-4rem)] md:h-[calc(100dvh-5rem)] ${
        activeConv
          ? "p-0 md:px-4 md:py-6"
          : "px-2 sm:px-4 py-3 sm:py-6 pb-20 md:pb-6"
      }`}
    >
      <div
        className={`flex h-full overflow-hidden bg-white dark:bg-slate-900 ${
          activeConv
            ? "rounded-none md:rounded-2xl border-0 md:border md:border-slate-200 md:dark:border-slate-800 shadow-none md:shadow-xs"
            : "rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs"
        }`}
      >
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

            {/* DM Category Tabs: Following vs Requests */}
            <div className="flex items-center gap-1 mt-3 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setDmTab("following")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition relative ${
                  dmTab === "following"
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                Following ({followingConvs.length})
                {followingConvs.some((c) => c.unread_count > 0) && (
                  <span className="inline-block w-2 h-2 rounded-full bg-rose-500 ml-1.5 align-middle" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setDmTab("requests")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition relative ${
                  dmTab === "requests"
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                Requests ({requestConvs.length})
                {requestConvs.some((c) => c.unread_count > 0) && (
                  <span className="inline-block w-2 h-2 rounded-full bg-rose-500 ml-1.5 align-middle" />
                )}
              </button>
            </div>
          </div>

          {/* Conversation List Scrollable */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-850">
            {loadingConvs ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : displayedConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <MessageSquare className="mx-auto h-8 w-8 opacity-40 mb-2 text-slate-400" />
                <p className="text-xs">
                  {searchQuery
                    ? "No matching conversations."
                    : dmTab === "requests"
                    ? "No message requests. Direct messages from classmates outside your following list will appear here."
                    : "No conversations with classmates you follow yet. Visit student profiles or Alumni Circle to connect!"}
                </p>
              </div>
            ) : (
              displayedConversations.map((conv) => {
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
                        <span
                          className={`text-xs truncate ${
                            conv.unread_count > 0
                              ? "font-extrabold text-blue-600 dark:text-blue-400"
                              : "font-bold text-slate-900 dark:text-slate-100"
                          }`}
                        >
                          {p.full_name}
                        </span>
                        <span
                          className={`text-[10px] shrink-0 ${
                            conv.unread_count > 0
                              ? "font-bold text-blue-600 dark:text-blue-400"
                              : "text-slate-400"
                          }`}
                        >
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
                        <p
                          className={`text-xs truncate ${
                            conv.unread_count > 0
                              ? "font-bold text-slate-900 dark:text-slate-100"
                              : "text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {(() => {
                            const text = conv.last_message?.content;
                            if (!text) return "Started conversation";
                            if (/(?:https?:\/\/[^\s/]+)?\/posts\/\d+/i.test(text.trim())) {
                              return "📷 Shared a post";
                            }
                            return text;
                          })()}
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

        {/* Right Column: Active Chat Window (Mobile Full Viewport & Desktop Embedded) */}
        <div
          className={`flex-col h-full bg-slate-50/50 dark:bg-slate-950 ${
            activeConv
              ? "fixed inset-0 z-50 flex h-[100dvh] md:static md:z-auto md:flex-1 md:h-full"
              : "hidden md:flex md:flex-1"
          }`}
        >
          {activeConv ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between border-b border-slate-200 bg-white px-3 sm:px-4 py-2.5 sm:py-3 dark:border-slate-800 dark:bg-slate-900 shadow-2xs shrink-0">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <button
                    onClick={() => {
                      setActiveConv(null);
                      router.replace("/messages", { scroll: false });
                    }}
                    className="md:hidden rounded-full p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center -ml-1"
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>

                  <Link
                    href={`/profile/${activeConv.participant.username}`}
                    className="relative flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-sm text-white overflow-hidden shadow-2xs"
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

                    <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
                      <span>@{activeConv.participant.username}</span>
                      {activeConv.participant.is_alumni || activeConv.participant.year === "Alumni" ? (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-2 py-0.2 text-[9px] sm:text-[10px] font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                          <GraduationCap className="h-2.5 w-2.5" />
                          <span>Alumni</span>
                        </span>
                      ) : activeConv.participant.year ? (
                        <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.2 text-[9px] sm:text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                          {activeConv.participant.year}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Chat Action Icons (Search, Sound, Options) */}
                <div className="flex items-center gap-0.5 sm:gap-1">
                  {/* Search toggle in chat */}
                  <button
                    onClick={() => {
                      setInChatSearchOpen(!inChatSearchOpen);
                      if (inChatSearchOpen) setInChatSearchQuery("");
                    }}
                    className={`rounded-full p-2 transition min-h-[44px] min-w-[44px] flex items-center justify-center ${
                      inChatSearchOpen
                        ? "bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400"
                        : "text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    }`}
                    title="Search in conversation"
                    aria-label="Search conversation messages"
                  >
                    <Search className="h-4 w-4" />
                  </button>

                  {/* Sound Toggle */}
                  <button
                    onClick={toggleSound}
                    className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
                    title={soundOn ? "Mute chat sounds" : "Enable chat sounds"}
                    aria-label={soundOn ? "Mute sounds" : "Enable sounds"}
                  >
                    {soundOn ? (
                      <Volume2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <VolumeX className="h-4 w-4 text-slate-400" />
                    )}
                  </button>

                  {/* More Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(!menuOpen)}
                      className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
                      aria-label="More options"
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
              </div>

              {/* In-Chat Search Bar */}
              {inChatSearchOpen && (
                <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2 dark:border-slate-800 dark:bg-slate-900/90 animate-in fade-in duration-150 shrink-0">
                  <Search className="h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={inChatSearchQuery}
                    onChange={(e) => setInChatSearchQuery(e.target.value)}
                    placeholder="Search messages in this chat..."
                    autoFocus
                    className="flex-1 bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-none dark:text-slate-100"
                  />
                  {inChatSearchQuery && (
                    <span className="text-[10px] text-slate-400">
                      {visibleMessages.length} found
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setInChatSearchOpen(false);
                      setInChatSearchQuery("");
                    }}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 min-h-[36px] min-w-[36px] flex items-center justify-center"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Message Request / Follow Back Banner */}
              {activeConv.participant.is_following === false && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 px-4 py-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <p className="text-xs text-amber-900 dark:text-amber-200">
                      <span className="font-bold">@{activeConv.participant.username}</span> is not in your following list.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const res = await api.users.toggleFollow(activeConv.participant.username);
                          setActiveConv({
                            ...activeConv,
                            participant: { ...activeConv.participant, is_following: res.is_following },
                          });
                          setConversations((prev) =>
                            prev.map((c) =>
                              c.id === activeConv.id
                                ? { ...c, participant: { ...c.participant, is_following: res.is_following } }
                                : c
                            )
                          );
                        } catch (err) {
                          console.error("Failed to follow back:", err);
                        }
                      }}
                      className="flex-1 sm:flex-initial rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition shadow-2xs"
                    >
                      Follow Back
                    </button>
                    <button
                      type="button"
                      onClick={handleBlockUser}
                      className="flex-1 sm:flex-initial rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                    >
                      Block
                    </button>
                  </div>
                </div>
              )}

              {/* Message List - Single Pure Scroll Container */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 overscroll-contain">
                {loadingMessages ? (
                  <div className="flex h-48 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  </div>
                ) : visibleMessages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center text-slate-400 py-12">
                    <MessageSquare className="h-10 w-10 opacity-30 mb-2 text-blue-500" />
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {inChatSearchQuery ? "No messages found matching search." : "No messages yet."}
                    </p>
                    {!inChatSearchQuery && (
                      <div className="mt-4 max-w-sm space-y-2">
                        <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-2">
                          <Sparkles className="h-3 w-3 text-blue-500" />
                          <span>Campus Conversation Starters</span>
                        </div>
                        {STARTER_PROMPTS.map((prompt, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setInputText(prompt);
                              setTimeout(() => {
                                if (textareaRef.current) {
                                  textareaRef.current.style.height = "auto";
                                  textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`;
                                  textareaRef.current.focus();
                                }
                              }, 0);
                            }}
                            className="w-full text-left rounded-xl border border-slate-200/90 bg-white p-2.5 text-xs text-slate-700 hover:border-blue-500 hover:bg-blue-50/50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-400 transition"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  visibleMessages.map((msg, index) => {
                    const isMe = user && msg.sender_id === user.id;
                    const prevMsg = visibleMessages[index - 1];
                    const nextMsg = visibleMessages[index + 1];

                    const isNewDay =
                      !prevMsg ||
                      new Date(msg.created_at).toDateString() !==
                        new Date(prevMsg.created_at).toDateString();

                    const isSameSenderAsPrev =
                      !isNewDay &&
                      prevMsg &&
                      prevMsg.sender_id === msg.sender_id &&
                      Math.abs(new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime()) < 2 * 60 * 1000;

                    const nextIsNewDay =
                      nextMsg &&
                      new Date(nextMsg.created_at).toDateString() !==
                        new Date(msg.created_at).toDateString();

                    const isSameSenderAsNext =
                      !nextIsNewDay &&
                      nextMsg &&
                      nextMsg.sender_id === msg.sender_id &&
                      Math.abs(new Date(nextMsg.created_at).getTime() - new Date(msg.created_at).getTime()) < 2 * 60 * 1000;

                    return (
                      <React.Fragment key={msg.id}>
                        {/* Day Divider Pill */}
                        {isNewDay && (
                          <div className="my-3 flex items-center justify-center">
                            <span className="rounded-full bg-slate-200/60 dark:bg-slate-800/80 px-3 py-0.5 text-[10px] font-bold text-slate-500 tracking-wider">
                              {formatDateDivider(msg.created_at)}
                            </span>
                          </div>
                        )}

                        <div
                          className={`group flex items-end gap-1.5 ${
                            isMe ? "justify-end" : "justify-start"
                          } ${isSameSenderAsNext ? "mb-1" : "mb-3"}`}
                        >
                          {/* Desktop Hover Action Toolbar for Sent Messages (Left of Bubble) */}
                          {isMe && (
                            <div className="hidden sm:flex opacity-0 group-hover:opacity-100 items-center gap-0.5 mb-1 transition">
                              <button
                                type="button"
                                onClick={() => handleCopyText(msg.id, msg.content)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition"
                                title={copiedId === msg.id ? "Copied!" : "Copy text"}
                                aria-label="Copy message"
                              >
                                {copiedId === msg.id ? (
                                  <Check className="h-3 w-3 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                                title="Unsend message"
                                aria-label="Unsend message"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          )}

                          {/* Message Bubble with Integrated Inline Timestamp (WhatsApp / Telegram style) */}
                          <div
                            onTouchStart={(e) => handleTouchStart(msg, e)}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                            onTouchCancel={handleTouchEnd}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              setActiveMsgAction(msg);
                            }}
                            className={`max-w-[82%] sm:max-w-[72%] px-3.5 py-1.5 text-xs sm:text-sm leading-relaxed shadow-2xs whitespace-pre-wrap break-words select-text transition-all ${
                              pressingMsgId === msg.id ? "scale-[0.97] opacity-90 " : ""
                            }${
                              isMe
                                ? `bg-blue-600 text-white rounded-2xl ${
                                    isSameSenderAsPrev ? "rounded-tr-xs" : ""
                                  } ${isSameSenderAsNext ? "rounded-br-xs" : ""}`
                                : `bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200/90 dark:border-slate-800 rounded-2xl ${
                                    isSameSenderAsPrev ? "rounded-tl-xs" : ""
                                  } ${isSameSenderAsNext ? "rounded-bl-xs" : ""}`
                            }`}
                          >
                            <ChatMessageContent content={msg.content} isMe={Boolean(isMe)} />
                            {/* Integrated Timestamp & Read Receipts */}
                            <span
                              className={`float-right ml-2.5 translate-y-0.5 inline-flex items-center gap-0.5 text-[10px] select-none shrink-0 ${
                                isMe ? "text-blue-100/80" : "text-slate-400 dark:text-slate-500"
                              }`}
                            >
                              <span>{formatMessageTime(msg.created_at)}</span>
                              {isMe && (
                                <span>
                                  {msg.id < 0 ? (
                                    <span className="inline-block animate-pulse text-[9px] text-blue-200">
                                      •
                                    </span>
                                  ) : msg.is_read ? (
                                    <CheckCheck className="h-3 w-3 text-blue-200" />
                                  ) : (
                                    <Check className="h-3 w-3 text-blue-200/70" />
                                  )}
                                </span>
                              )}
                            </span>
                          </div>

                          {/* Desktop Hover Action Toolbar for Received Messages (Right of Bubble) */}
                          {!isMe && (
                            <div className="hidden sm:flex opacity-0 group-hover:opacity-100 items-center gap-0.5 mb-1 transition">
                              <button
                                type="button"
                                onClick={() => handleCopyText(msg.id, msg.content)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition"
                                title={copiedId === msg.id ? "Copied!" : "Copy text"}
                                aria-label="Copy message"
                              >
                                {copiedId === msg.id ? (
                                  <Check className="h-3 w-3 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </React.Fragment>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Error Callout */}
              {error && (
                <div className="mx-4 mb-2 flex items-center gap-2 rounded-xl bg-rose-50 p-2 text-xs text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 shrink-0">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Chat Input Bar (Sticky at bottom, auto-expanding textarea) */}
              <form
                onSubmit={handleSendMessage}
                className="flex items-end gap-2 border-t border-slate-200 bg-white p-2.5 sm:p-3 pb-3 dark:border-slate-800 dark:bg-slate-900 shrink-0"
              >
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  placeholder="Type a message..."
                  maxLength={2000}
                  className="flex-1 max-h-32 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 overflow-y-auto leading-relaxed"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs transition hover:bg-blue-700 disabled:opacity-40 mb-0.5"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
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
        {/* Mobile Message Actions Bottom Sheet (Portal) */}
        {mounted && activeMsgAction && createPortal(
          <div
            className="fixed inset-0 z-[80] flex flex-col justify-end bg-black/60 backdrop-blur-xs p-3 sm:hidden animate-in fade-in duration-150"
            onClick={() => setActiveMsgAction(null)}
          >
            <div
              className="w-full rounded-3xl bg-white dark:bg-slate-900 p-4 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-2.5 animate-in slide-in-from-bottom-6 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Message snippet preview */}
              <div className="px-3.5 py-2.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl max-h-24 overflow-y-auto leading-relaxed">
                {activeMsgAction.content}
              </div>

              <div className="space-y-2 pt-1">
                {/* Copy Option */}
                <button
                  type="button"
                  onClick={() => {
                    handleCopyText(activeMsgAction.id, activeMsgAction.content);
                    setActiveMsgAction(null);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 transition min-h-[48px] active:scale-[0.99]"
                >
                  <Copy className="h-4 w-4 text-slate-500" />
                  <span>{copiedId === activeMsgAction.id ? "Copied!" : "Copy Text"}</span>
                </button>

                {/* Unsend Option (if sent by me) */}
                {user && activeMsgAction.sender_id === user.id && (
                  <button
                    type="button"
                    onClick={() => {
                      const msgId = activeMsgAction.id;
                      setActiveMsgAction(null);
                      handleDeleteMessage(msgId);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-sm font-bold text-rose-600 dark:text-rose-400 transition min-h-[48px] active:scale-[0.99]"
                  >
                    <Trash2 className="h-4 w-4 text-rose-500" />
                    <span>Unsend Message</span>
                  </button>
                )}

                {/* Cancel Button */}
                <button
                  type="button"
                  onClick={() => setActiveMsgAction(null)}
                  className="w-full py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition min-h-[48px]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Unsend Message Custom Modal */}
        <ConfirmModal
          isOpen={msgIdToUnsend !== null}
          title="Unsend Message?"
          message="This message will be permanently removed for everyone in this conversation."
          confirmText="Unsend"
          cancelText="Cancel"
          loadingText="Unsending..."
          isDestructive
          isLoading={isUnsending}
          onConfirm={confirmUnsend}
          onCancel={() => setMsgIdToUnsend(null)}
        />

        {/* Block User Custom Modal */}
        <ConfirmModal
          isOpen={showBlockModal}
          title={`Block @${activeConv?.participant.username}?`}
          message="They will no longer be able to send you direct messages or see your active status."
          confirmText="Block User"
          cancelText="Cancel"
          loadingText="Blocking..."
          isDestructive
          isLoading={isBlocking}
          onConfirm={confirmBlock}
          onCancel={() => setShowBlockModal(false)}
        />
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
