"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AuthGuard } from "@/components/AuthGuard";
import { api, ApiError } from "@/lib/api";
import { Club, ClubMember } from "@/types";
import { LinkedinIcon } from "@/components/icons/LinkedinIcon";
import { InstagramIcon } from "@/components/icons/InstagramIcon";
import {
  Landmark,
  ShieldCheck,
  Users,
  ArrowLeft,
  Globe,
  Plus,
  Trash2,
  Edit3,
  Loader2,
  AlertCircle,
  School,
  CheckCircle2,
  UserCheck,
  User as UserIcon,
  X,
} from "lucide-react";

interface ClubPageProps {
  params: Promise<{ slug: string }>;
}

export default function ClubDetailPage({ params }: ClubPageProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const { user } = useAuth();
  const router = useRouter();

  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberUsername, setMemberUsername] = useState("");
  const [memberRole, setMemberRole] = useState("CORE");
  const [memberTitle, setMemberTitle] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"about" | "team">("about");

  const fetchClub = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.clubs.get(slug);
      setClub(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail);
      } else {
        setError("Failed to load society details.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClub();
  }, [slug]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberUsername.trim()) return;

    setAddingMember(true);
    setModalError(null);
    try {
      const updated = await api.clubs.addMember(slug, {
        username: memberUsername.trim(),
        role: memberRole,
        title: memberTitle.trim() || undefined,
      });
      setClub(updated);
      setShowAddMemberModal(false);
      setMemberUsername("");
      setMemberTitle("");
    } catch (err) {
      if (err instanceof ApiError) {
        setModalError(err.detail);
      } else {
        setModalError("Could not add student to core team. Ensure the username is verified.");
      }
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId: number, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from the core team?`)) {
      return;
    }

    try {
      const updated = await api.clubs.removeMember(slug, userId);
      setClub(updated);
    } catch (err) {
      alert(err instanceof ApiError ? err.detail : "Could not remove member.");
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#0B0F19]">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        </div>
      </AuthGuard>
    );
  }

  if (error || !club) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] py-12 px-4">
          <div className="mx-auto max-w-lg text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 mb-4">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Society Not Found
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {error || "The society you are looking for does not exist or may have been unlisted."}
            </p>
            <div className="mt-6">
              <Link
                href="/clubs"
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-xs"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Return to Societies Directory</span>
              </Link>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] transition-colors pb-16">
        {/* Banner Area */}
        <div className="relative h-44 sm:h-56 w-full bg-gradient-to-r from-violet-900 via-indigo-950 to-slate-900 overflow-hidden">
          {club.banner_url ? (
            <Image
              src={club.banner_url}
              alt={club.name}
              fill
              priority
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
          )}
          <div className="absolute top-4 left-4 z-10">
            <Link
              href="/clubs"
              className="inline-flex items-center gap-1.5 rounded-full bg-black/40 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-white hover:bg-black/60 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>All Societies</span>
            </Link>
          </div>
        </div>

        {/* Profile Card Header */}
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-16 sm:-mt-20 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#131B2E] p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
              {/* Logo + Details */}
              <div className="flex items-start sm:items-end gap-4">
                <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white font-extrabold text-2xl sm:text-3xl ring-4 ring-white dark:ring-[#131B2E] shadow-md overflow-hidden">
                  {club.logo_url ? (
                    <Image
                      src={club.logo_url}
                      alt={club.name}
                      fill
                      priority
                      className="object-cover"
                    />
                  ) : (
                    club.name.charAt(0).toUpperCase()
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded-md bg-violet-100 dark:bg-violet-950/70 px-2 py-0.5 text-[11px] font-bold text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                      {club.category}
                    </span>
                    {club.is_verified && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>IPEC Verified</span>
                      </span>
                    )}
                  </div>

                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    {club.name}
                  </h1>
                  <p className="text-xs font-mono text-slate-400">
                    @{club.slug}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5">
                {club.is_owner && (
                  <button
                    onClick={() => setShowAddMemberModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white px-3.5 py-2 text-xs font-bold transition shadow-xs cursor-pointer min-h-[40px]"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Core Member</span>
                  </button>
                )}

                {/* Social Links */}
                <div className="flex items-center gap-1">
                  {club.instagram_url && (
                    <a
                      href={club.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-pink-600 dark:text-slate-300 dark:hover:text-pink-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                      title="Instagram"
                    >
                      <InstagramIcon className="h-4 w-4" />
                    </a>
                  )}
                  {club.linkedin_url && (
                    <a
                      href={club.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                      title="LinkedIn"
                    >
                      <LinkedinIcon className="h-4 w-4" />
                    </a>
                  )}
                  {club.website_url && (
                    <a
                      href={club.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-violet-600 dark:text-slate-300 dark:hover:text-violet-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                      title="Official Website / Portal"
                    >
                      <Globe className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Tagline */}
            {club.tagline && (
              <p className="mt-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {club.tagline}
              </p>
            )}

            {/* Navigation Tabs */}
            <div className="mt-6 flex border-b border-slate-200/80 dark:border-slate-800 gap-6">
              <button
                onClick={() => setActiveTab("about")}
                className={`pb-2.5 text-xs font-bold transition cursor-pointer border-b-2 ${
                  activeTab === "about"
                    ? "border-violet-600 text-violet-600 dark:text-violet-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                About & Overview
              </button>
              <button
                onClick={() => setActiveTab("team")}
                className={`pb-2.5 text-xs font-bold transition cursor-pointer border-b-2 ${
                  activeTab === "team"
                    ? "border-violet-600 text-violet-600 dark:text-violet-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                Core Team & Leadership ({club.members_count})
              </button>
            </div>
          </div>

          {/* Tab 1: About */}
          {activeTab === "about" && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#131B2E] p-6 shadow-xs">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">
                    About this Society
                  </h3>
                  <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {club.description || "No detailed description provided by the coordinators yet."}
                  </div>
                </div>
              </div>

              {/* Sidebar Info */}
              <div className="space-y-5">
                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#131B2E] p-5 shadow-xs space-y-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Faculty Coordinator
                  </h3>
                  {club.faculty_coordinator_name ? (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {club.faculty_coordinator_name}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">Not specified</p>
                  )}

                  <hr className="border-slate-100 dark:border-slate-800" />

                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Society President / Lead
                  </h3>
                  <Link
                    href={`/profile/${club.owner_username}`}
                    className="flex items-center gap-2.5 group"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-white font-bold text-xs">
                      {club.owner_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-violet-600 transition">
                        {club.owner_name}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        @{club.owner_username}
                      </p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Core Team */}
          {activeTab === "team" && (
            <div className="mt-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#131B2E] p-6 shadow-xs">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Official Student Leadership Roster
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Verified student coordinators managing {club.name}.
                  </p>
                </div>

                {club.is_owner && (
                  <button
                    onClick={() => setShowAddMemberModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Member</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {club.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800 p-3.5 bg-slate-50/60 dark:bg-slate-900/40"
                  >
                    <Link
                      href={`/profile/${member.username}`}
                      className="flex items-center gap-3 min-w-0 flex-1 group"
                    >
                      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white font-bold text-xs overflow-hidden">
                        {member.profile_picture ? (
                          <Image
                            src={member.profile_picture}
                            alt={member.full_name}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        ) : (
                          member.full_name.charAt(0).toUpperCase()
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-violet-600 transition truncate">
                            {member.full_name}
                          </p>
                          {member.is_id_verified && (
                            <ShieldCheck className="h-3 w-3 text-emerald-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 truncate">
                          {member.title || member.role}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {member.year || "Student"} {member.branch ? `• ${member.branch}` : ""}
                        </p>
                      </div>
                    </Link>

                    {/* Owner delete button (cannot remove owner) */}
                    {club.is_owner && member.user_id !== club.owner_id && (
                      <button
                        onClick={() => handleRemoveMember(member.user_id, member.full_name)}
                        title="Remove member from core team"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal: Add Core Member */}
        {showAddMemberModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131B2E] p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Add Core Team Member
                </h3>
                <button
                  onClick={() => setShowAddMemberModal(false)}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {modalError && (
                <div className="mt-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-2.5 text-xs text-rose-700 dark:text-rose-300">
                  {modalError}
                </div>
              )}

              <form onSubmit={handleAddMember} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Student Username or Roll Number
                  </label>
                  <input
                    type="text"
                    required
                    value={memberUsername}
                    onChange={(e) => setMemberUsername(e.target.value)}
                    placeholder="e.g. ankur or 2200300100054"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none"
                  />
                  <p className="mt-1 text-[10px] text-slate-400">
                    Must be an active, ID-verified IPEC student.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Team Role
                  </label>
                  <select
                    value={memberRole}
                    onChange={(e) => setMemberRole(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none"
                  >
                    <option value="VICE_PRESIDENT">Vice President</option>
                    <option value="LEAD">Lead Coordinator</option>
                    <option value="CORE">Core Member</option>
                    <option value="MEMBER">Member / Volunteer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Custom Designation / Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={memberTitle}
                    onChange={(e) => setMemberTitle(e.target.value)}
                    placeholder="e.g. Technical Head, Design Lead, General Secretary"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddMemberModal(false)}
                    className="rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingMember}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 text-xs font-bold transition shadow-xs disabled:opacity-50"
                  >
                    {addingMember ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Adding...</span>
                      </>
                    ) : (
                      <span>Add to Team</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
