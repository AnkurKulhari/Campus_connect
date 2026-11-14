"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Post } from "@/types";
import { api } from "@/lib/api";
import {
  Heart,
  MessageCircle,
  ShieldCheck,
  Layers,
  ArrowUpRight,
  AlertCircle,
  Loader2,
} from "lucide-react";

// In-memory cache for posts to prevent duplicate network calls across messages
const postCache = new Map<number, Post>();

interface ChatPostPreviewProps {
  postId: number;
  isMe: boolean;
}

export function ChatPostPreview({ postId, isMe }: ChatPostPreviewProps) {
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(() => postCache.get(postId) || null);
  const [loading, setLoading] = useState<boolean>(!postCache.has(postId));
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    if (postCache.has(postId)) {
      setPost(postCache.get(postId)!);
      setLoading(false);
      return;
    }

    let isSubscribed = true;
    setLoading(true);

    api.posts
      .getPost(postId)
      .then((data) => {
        if (!isSubscribed) return;
        postCache.set(postId, data);
        setPost(data);
        setError(false);
      })
      .catch(() => {
        if (!isSubscribed) return;
        setError(true);
      })
      .finally(() => {
        if (isSubscribed) setLoading(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, [postId]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/posts/${postId}`);
  };

  if (loading) {
    return (
      <div
        className={`my-1.5 flex items-center gap-2 rounded-2xl p-3 text-xs border ${
          isMe
            ? "border-blue-400/40 bg-blue-700/40 text-blue-100"
            : "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-900/60"
        } w-[260px] sm:w-[290px]`}
      >
        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
        <span>Loading shared post...</span>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div
        onClick={handleClick}
        className={`my-1.5 flex items-center gap-2 rounded-2xl p-3 text-xs border cursor-pointer ${
          isMe
            ? "border-blue-400/30 bg-blue-700/30 text-blue-200"
            : "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-900/60"
        } w-[260px] sm:w-[290px]`}
      >
        <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
        <span className="truncate">Post unavailable or removed.</span>
      </div>
    );
  }

  const hasMedia = post.media && post.media.length > 0;

  return (
    <div
      onClick={handleClick}
      className={`my-1.5 overflow-hidden rounded-2xl border transition-all cursor-pointer shadow-sm hover:opacity-95 w-[260px] sm:w-[290px] ${
        isMe
          ? "border-white/20 bg-blue-700/60 text-white backdrop-blur-xs hover:border-white/30"
          : "border-slate-200/90 bg-slate-50/90 text-slate-900 dark:border-slate-800 dark:bg-slate-900/90 dark:text-white hover:border-slate-300 dark:hover:border-slate-700"
      }`}
    >
      {/* Author Header */}
      <div className="flex items-center gap-2 p-2.5 pb-2">
        <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-[10px] text-white overflow-hidden shadow-2xs">
          {post.author.profile_picture ? (
            <Image
              src={post.author.profile_picture}
              alt={post.author.username}
              fill
              sizes="28px"
              className="object-cover"
            />
          ) : (
            post.author.full_name.charAt(0).toUpperCase()
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span className="font-bold text-xs truncate leading-tight">
              {post.author.full_name}
            </span>
            {post.author.is_id_verified && (
              <ShieldCheck className="h-3 w-3 text-emerald-400 shrink-0" />
            )}
          </div>
          <p
            className={`text-[10px] truncate leading-tight ${
              isMe ? "text-blue-100/75" : "text-slate-400"
            }`}
          >
            @{post.author.username}
          </p>
        </div>
      </div>

      {/* Media Image Thumbnail (Instagram DM style) */}
      {hasMedia && (
        <div className="relative aspect-video w-full overflow-hidden bg-slate-950/20">
          <Image
            src={post.media[0].cloudinary_url}
            alt="Shared post media"
            fill
            sizes="300px"
            className="object-cover"
          />
          {post.media.length > 1 && (
            <div className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs flex items-center gap-1 shadow-xs">
              <Layers className="h-2.5 w-2.5" />
              <span>1/{post.media.length}</span>
            </div>
          )}
        </div>
      )}

      {/* Post Content Snippet */}
      {post.content && (
        <div className="px-3 pt-2">
          <p
            className={`text-xs leading-relaxed line-clamp-3 ${
              isMe ? "text-blue-50/90" : "text-slate-700 dark:text-slate-300"
            }`}
          >
            {post.content}
          </p>
        </div>
      )}

      {/* Footer Info & View Post Prompt */}
      <div
        className={`flex items-center justify-between px-3 py-2 text-[10px] border-t mt-2 ${
          isMe
            ? "border-white/10 text-blue-100/80"
            : "border-slate-200/60 dark:border-slate-800 text-slate-400"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1">
            <Heart className="h-2.5 w-2.5" />
            <span>{post.like_count}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="h-2.5 w-2.5" />
            <span>{post.comment_count}</span>
          </span>
        </div>

        <span
          className={`inline-flex items-center gap-0.5 font-bold ${
            isMe ? "text-white" : "text-blue-600 dark:text-blue-400"
          }`}
        >
          <span>View Post</span>
          <ArrowUpRight className="h-3 w-3" />
        </span>
      </div>
    </div>
  );
}
