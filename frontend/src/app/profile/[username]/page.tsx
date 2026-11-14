"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { UserProfile, Post, PaginatedPosts } from "@/types";
import { api } from "@/lib/api";
import { PostCard } from "@/components/PostCard";
import { EditProfileModal } from "@/components/EditProfileModal";
import { FollowListModal } from "@/components/FollowListModal";
import {
  UserPlus,
  UserCheck,
  Edit3,
  Grid,
  Loader2,
  Sparkles,
  GraduationCap,
  ShieldCheck,
  AlertTriangle,
  MessageSquare,
  LogOut,
} from "lucide-react";
import { LinkedinIcon } from "@/components/icons/LinkedinIcon";
import { AuthGuard } from "@/components/AuthGuard";

export default function ProfilePage() {
  const params = useParams<{ username: string }>();
  const username = params.username;
  const { user, logout } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  // Modals
  const [editOpen, setEditOpen] = useState(false);
  const [followModal, setFollowModal] = useState<"followers" | "following" | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!username) return;
    try {
      const data = await api.users.getProfile(username);
      setProfile(data);
    } catch {
      // User not found or error
    } finally {
      setLoading(false);
    }
  }, [username]);

  const fetchUserPosts = useCallback(async () => {
    if (!username) return;
    setPostsLoading(true);
    try {
      const data: PaginatedPosts = await api.posts.getUserPosts(username, 1, 30);
      setPosts(data.posts);
    } catch {
      //
    } finally {
      setPostsLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchProfile();
    fetchUserPosts();
  }, [fetchProfile, fetchUserPosts]);

  const handleToggleFollow = async () => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    if (!profile || isFollowLoading) return;

    setIsFollowLoading(true);
    const prevFollowing = profile.is_following;
    const prevCount = profile.followers_count;

    // Optimistic UI
    setProfile({
      ...profile,
      is_following: !prevFollowing,
      followers_count: prevFollowing ? prevCount - 1 : prevCount + 1,
    });

    try {
      const res = await api.users.toggleFollow(username);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              is_following: res.is_following,
              followers_count: res.followers_count,
            }
          : prev
      );
    } catch {
      // Revert on error
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              is_following: prevFollowing,
              followers_count: prevCount,
            }
          : prev
      );
    } finally {
      setIsFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-lg py-24 text-center">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Student Profile Not Found
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          The requested user @{username} doesn&apos;t exist or is not verified on CampusConnect.
        </p>
        <Link
          href="/home"
          className="mt-4 inline-block rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition"
        >
          Return to Feed
        </Link>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8 pb-24 lg:pb-8">
      {/* Profile Header Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar with Download & Drag Protection */}
          <div
            onContextMenu={(e) => e.preventDefault()}
            className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-blue-600 text-3xl font-bold text-white overflow-hidden shadow-md ring-4 ring-slate-100 dark:ring-slate-800 select-none"
          >
            {profile.profile_picture ? (
              <>
                <Image
                  src={profile.profile_picture}
                  alt={profile.username}
                  fill
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  sizes="96px"
                  className="object-cover pointer-events-none select-none"
                />
                <div
                  className="absolute inset-0 z-10"
                  onContextMenu={(e) => e.preventDefault()}
                />
              </>
            ) : (
              profile.full_name.charAt(0).toUpperCase()
            )}
          </div>

          {/* Details */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                    {profile.full_name}
                  </h1>
                  {profile.is_id_verified && (
                    <span
                      title="Verified Student ID"
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                    >
                      <ShieldCheck className="h-3 w-3" />
                      <span>Verified Student</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">@{profile.username}</p>

                {/* Academic Badges */}
                <div className="mt-2 flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  {profile.is_alumni || profile.year === "Alumni" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                      <GraduationCap className="h-3.5 w-3.5" />
                      <span>Alumni</span>
                      {profile.branch && <span>• {profile.branch.replace(/\(.*?\)/g, "").trim()}</span>}
                    </span>
                  ) : profile.year ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      <GraduationCap className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      <span>{profile.year}</span>
                      {profile.course && <span>({profile.course})</span>}
                      {profile.branch && <span>• {profile.branch.replace(/\(.*?\)/g, "").trim()}</span>}
                    </span>
                  ) : null}

                  {profile.is_self && profile.is_year_back && (
                    <span
                      title="Only visible to you: Course duration extended"
                      className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      <span>Extended Course Active (Private)</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center sm:justify-end gap-2 flex-wrap">
                {profile.linkedin_url && (
                  <a
                    href={profile.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0077b5]/10 px-4 py-1.5 text-xs font-semibold text-[#0077b5] dark:bg-[#0077b5]/20 dark:text-blue-300 hover:bg-[#0077b5] hover:text-white shadow-2xs transition"
                  >
                    <LinkedinIcon className="h-3.5 w-3.5" />
                    <span>LinkedIn</span>
                  </a>
                )}

                {profile.is_self ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 shadow-2xs transition"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Edit Profile</span>
                    </button>
                    <button
                      onClick={logout}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/60 px-3.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-900/50 shadow-2xs transition"
                      title="Log Out of CampusConnect"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/messages?user=${profile.username}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 shadow-2xs transition"
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Message</span>
                    </Link>

                    <button
                      onClick={handleToggleFollow}
                      disabled={isFollowLoading}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-5 py-1.5 text-xs font-semibold transition ${
                        profile.is_following
                          ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                          : "bg-blue-600 text-white hover:bg-blue-700 shadow-2xs"
                      }`}
                    >
                      {profile.is_following ? (
                        <>
                          <UserCheck className="h-3.5 w-3.5" />
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-3.5 w-3.5" />
                          <span>Follow</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                {profile.bio}
              </p>
            )}

            {/* Stats row */}
            <div className="mt-5 flex items-center justify-center sm:justify-start gap-6 border-t border-slate-100 dark:border-slate-800 pt-4 text-xs">
              <div>
                <span className="font-extrabold text-slate-900 dark:text-slate-100">
                  {profile.posts_count}
                </span>{" "}
                <span className="text-slate-400">posts</span>
              </div>

              <button
                onClick={() => setFollowModal("followers")}
                className="hover:underline cursor-pointer"
              >
                <span className="font-extrabold text-slate-900 dark:text-slate-100">
                  {profile.followers_count}
                </span>{" "}
                <span className="text-slate-400">followers</span>
              </button>

              <button
                onClick={() => setFollowModal("following")}
                className="hover:underline cursor-pointer"
              >
                <span className="font-extrabold text-slate-900 dark:text-slate-100">
                  {profile.following_count}
                </span>{" "}
                <span className="text-slate-400">following</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* User's Posts Feed */}
      <div className="mt-8">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-6">
          <Grid className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-100">
            Posts by @{profile.username}
          </h2>
        </div>

        {postsLoading ? (
          <div className="flex justify-center py-12 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 py-12 text-center bg-white dark:bg-slate-900">
            <Sparkles className="mx-auto h-6 w-6 text-slate-400" />
            <p className="mt-2 text-xs text-slate-500">No posts shared yet.</p>
          </div>
        ) : (
          <div className="space-y-4 max-w-2xl mx-auto">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onPostDeleted={(id) =>
                  setPosts((prev) => prev.filter((p) => p.id !== id))
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {profile.is_self && (
        <EditProfileModal
          profile={profile}
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          onUpdated={(updated) => setProfile(updated)}
        />
      )}

      {followModal && (
        <FollowListModal
          username={profile.username}
          type={followModal}
          isOpen={true}
          onClose={() => setFollowModal(null)}
        />
      )}
      </div>
    </AuthGuard>
  );
}
