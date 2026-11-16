"use client";

import React, { useEffect, useState, use, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AuthGuard } from "@/components/AuthGuard";
import { api, ApiError } from "@/lib/api";
import { Club, ClubMember, Post } from "@/types";
import { LinkedinIcon } from "@/components/icons/LinkedinIcon";
import { InstagramIcon } from "@/components/icons/InstagramIcon";
import { YoutubeIcon } from "@/components/icons/YoutubeIcon";
import { ImageCropModal } from "@/components/ImageCropModal";
import { PostCard } from "@/components/PostCard";
import { CreatePostBox } from "@/components/CreatePostBox";
import { checkImageSafety } from "@/lib/nsfw";
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
  Upload,
  Camera,
  Settings,
  Flag,
  ShieldAlert,
  MoreVertical,
  FileText,
  Share2,
  Crown,
  Trophy,
  Calendar,
} from "lucide-react";

interface ClubPageProps {
  params: Promise<{ slug: string }>;
}

const CATEGORIES = [
  "Technical",
  "Cultural",
  "Sports",
  "Literary",
  "Social",
  "Departmental",
  "Other",
];

export default function ClubDetailPage({ params }: ClubPageProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const { user } = useAuth();
  const router = useRouter();

  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add Member Modal State
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberUsername, setMemberUsername] = useState("");
  const [memberRole, setMemberRole] = useState("CORE");
  const [memberTitle, setMemberTitle] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Edit Society Details Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editCategory, setEditCategory] = useState("Technical");
  const [editTagline, setEditTagline] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editLogoUrl, setEditLogoUrl] = useState("");
  const [editBannerUrl, setEditBannerUrl] = useState("");
  const [editInstagramUrl, setEditInstagramUrl] = useState("");
  const [editLinkedinUrl, setEditLinkedinUrl] = useState("");
  const [editYoutubeUrl, setEditYoutubeUrl] = useState("");
  const [editWebsiteUrl, setEditWebsiteUrl] = useState("");
  const [editFoundedIn, setEditFoundedIn] = useState("");
  const [editFoundedBy, setEditFoundedBy] = useState("");
  const [editAchievements, setEditAchievements] = useState("");
  const [editFacultyName, setEditFacultyName] = useState("");

  const [editLogoUploading, setEditLogoUploading] = useState(false);
  const [editBannerUploading, setEditBannerUploading] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const editLogoInputRef = useRef<HTMLInputElement>(null);
  const editBannerInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<"about" | "posts" | "team">("about");
  const [clubPosts, setClubPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);

  // Three-dot header menu state
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  // Transfer Leadership Modal State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferUsername, setTransferUsername] = useState("");
  const [transferringPresidency, setTransferringPresidency] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);

  // Custom remove team member modal state
  const [memberToRemove, setMemberToRemove] = useState<{
    id: number;
    name: string;
    title?: string | null;
    role: string;
  } | null>(null);
  const [removingMember, setRemovingMember] = useState(false);

  // Crop modal state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropType, setCropType] = useState<"logo" | "banner">("logo");

  // Report modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("Rogue / Unauthorized Registration (Student is not president or coordinator)");
  const [reportDetails, setReportDetails] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  const isLead =
    club &&
    (club.is_owner ||
      club.my_role === "PRESIDENT" ||
      club.my_role === "VICE_PRESIDENT" ||
      club.my_role === "LEAD");

  const isPresidentOrVP =
    club &&
    (club.is_owner ||
      club.my_role === "PRESIDENT" ||
      club.my_role === "VICE_PRESIDENT");

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

  const fetchClubPosts = useCallback(async () => {
    if (!slug) return;
    setPostsLoading(true);
    try {
      const res = await api.posts.getClubPosts(slug);
      setClubPosts(res.posts);
    } catch {
      //
    } finally {
      setPostsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchClub();
    fetchClubPosts();
  }, [slug, fetchClubPosts]);

  // Open Edit Modal with current values
  const handleOpenEditModal = () => {
    if (!club) return;
    setEditName(club.name || "");
    setEditSlug(club.slug || "");
    setEditCategory(club.category || "Technical");
    setEditTagline(club.tagline || "");
    setEditDescription(club.description || "");
    setEditLogoUrl(club.logo_url || "");
    setEditBannerUrl(club.banner_url || "");
    setEditInstagramUrl(club.instagram_url || "");
    setEditLinkedinUrl(club.linkedin_url || "");
    setEditYoutubeUrl(club.youtube_url || "");
    setEditWebsiteUrl(club.website_url || "");
    setEditFoundedIn(club.founded_in || "");
    setEditFoundedBy(club.founded_by || "");
    setEditAchievements(club.achievements || "");
    setEditFacultyName(club.faculty_coordinator_name || "");
    setEditError(null);
    setShowEditModal(true);
  };

  // Select Logo in Edit Modal -> Opens Crop Modal
  const handleEditLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setEditError("Please select an image file (PNG, JPG, WEBP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setEditError("Logo image size must be under 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
      setCropType("logo");
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Select Banner in Edit Modal -> Opens Crop Modal
  const handleEditBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setEditError("Please select an image file (PNG, JPG, WEBP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setEditError("Cover banner image size must be under 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
      setCropType("banner");
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Cropping finished -> runs NSFW check & uploads to Cloudinary
  const handleCropDone = async (croppedFile: File) => {
    if (cropType === "logo") {
      setEditLogoUploading(true);
      setEditError(null);
      try {
        const safety = await checkImageSafety(croppedFile);
        if (safety.isExplicit) {
          setEditError("Adult or explicit content detected in logo photo.");
          return;
        }
        const res = await api.clubs.uploadImage(croppedFile, "logo");
        setEditLogoUrl(res.url);
      } catch (err) {
        setEditError(err instanceof ApiError ? err.detail : "Failed to upload logo.");
      } finally {
        setEditLogoUploading(false);
      }
    } else {
      setEditBannerUploading(true);
      setEditError(null);
      try {
        const safety = await checkImageSafety(croppedFile);
        if (safety.isExplicit) {
          setEditError("Adult or explicit content detected in banner photo.");
          return;
        }
        const res = await api.clubs.uploadImage(croppedFile, "banner");
        setEditBannerUrl(res.url);
      } catch (err) {
        setEditError(err instanceof ApiError ? err.detail : "Failed to upload banner.");
      } finally {
        setEditBannerUploading(false);
      }
    }
  };

  // Save Edit Changes (Supports clearing Logo or Banner when removed)
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!club) return;

    if (!editName.trim()) {
      setEditError("Society name cannot be empty.");
      return;
    }
    if (!editSlug.trim()) {
      setEditError("Society handle cannot be empty.");
      return;
    }

    setSavingEdit(true);
    setEditError(null);

    try {
      const updated = await api.clubs.update(slug, {
        name: editName.trim(),
        slug: editSlug.trim().toLowerCase(),
        category: editCategory,
        tagline: editTagline.trim(),
        description: editDescription.trim(),
        logo_url: editLogoUrl ? editLogoUrl : null,
        banner_url: editBannerUrl ? editBannerUrl : null,
        instagram_url: editInstagramUrl.trim() || undefined,
        linkedin_url: editLinkedinUrl.trim() || undefined,
        youtube_url: editYoutubeUrl.trim() || undefined,
        website_url: editWebsiteUrl.trim() || undefined,
        founded_in: editFoundedIn.trim() || undefined,
        founded_by: editFoundedBy.trim() || undefined,
        achievements: editAchievements.trim() || undefined,
        faculty_coordinator_name: editFacultyName.trim() || undefined,
      });

      setClub(updated);
      setShowEditModal(false);

      if (updated.slug !== slug) {
        router.push(`/clubs/${updated.slug}`);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setEditError(err.detail);
      } else {
        setEditError("Failed to update society details.");
      }
    } finally {
      setSavingEdit(false);
    }
  };

  // Submit Report Rogue Society
  const handleReportClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!club) return;

    setSubmittingReport(true);
    setReportError(null);
    setReportSuccess(null);

    try {
      const res = await api.clubs.report(club.slug, {
        reason: reportReason,
        details: reportDetails.trim() || undefined,
      });
      setReportSuccess(res.message || "Report submitted successfully for administrative review.");
      setTimeout(() => {
        setShowReportModal(false);
        setReportSuccess(null);
        setReportDetails("");
      }, 2500);
    } catch (err) {
      if (err instanceof ApiError) {
        setReportError(err.detail);
      } else {
        setReportError("Failed to submit report. Please try again.");
      }
    } finally {
      setSubmittingReport(false);
    }
  };

  // Share Society link to clipboard or native share
  const handleShareClub = async () => {
    setShowMoreMenu(false);
    if (typeof window === "undefined") return;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: club?.name,
          text: `Check out ${club?.name} on CampusConnect!`,
          url,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiedShareLink(true);
      setTimeout(() => setCopiedShareLink(false), 2500);
    } catch {
      //
    }
  };

  // Transfer Presidency / Succession
  const handleTransferPresidency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!club || !transferUsername.trim()) return;

    setTransferringPresidency(true);
    setTransferError(null);
    setTransferSuccess(null);

    try {
      const updated = await api.clubs.transferPresidency(club.slug, transferUsername.trim());
      setClub(updated);
      setTransferSuccess(`Presidency transferred successfully to @${transferUsername.trim()}!`);
      setTimeout(() => {
        setShowTransferModal(false);
        setTransferSuccess(null);
        setTransferUsername("");
      }, 2000);
    } catch (err) {
      setTransferError(err instanceof ApiError ? err.detail : "Failed to transfer leadership.");
    } finally {
      setTransferringPresidency(false);
    }
  };

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
        setModalError("Could not add student to team. Ensure the username is verified.");
      }
    } finally {
      setAddingMember(false);
    }
  };

  const handleOpenRemoveMemberModal = (member: ClubMember) => {
    setMemberToRemove({
      id: member.user_id,
      name: member.full_name,
      title: member.title,
      role: member.role,
    });
  };

  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove || !club) return;
    setRemovingMember(true);
    try {
      const updated = await api.clubs.removeMember(slug, memberToRemove.id);
      setClub(updated);
      setMemberToRemove(null);
    } catch (err) {
      alert(err instanceof ApiError ? err.detail : "Could not remove member.");
    } finally {
      setRemovingMember(false);
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
        <div className="relative aspect-[16/7] sm:aspect-[21/9] min-h-[180px] sm:min-h-[240px] max-h-[340px] w-full bg-slate-950 overflow-hidden flex items-center justify-center">
          {club.banner_url ? (
            <>
              {/* Blurred background backdrop so wide banner looks seamless on any screen */}
              <div
                className="absolute inset-0 bg-cover bg-center blur-md opacity-30 scale-105 pointer-events-none"
                style={{ backgroundImage: `url(${club.banner_url})` }}
              />
              <Image
                src={club.banner_url}
                alt={club.name}
                fill
                priority
                className="object-contain sm:object-cover object-center"
              />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-violet-900 via-indigo-950 to-slate-900">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
            </div>
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
          <div className="relative -mt-8 sm:-mt-16 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#131B2E] p-6 shadow-sm">
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
              <div className="flex items-center gap-2.5 flex-wrap">
                {isLead && (
                  <button
                    onClick={handleOpenEditModal}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#131B2E] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 px-3.5 py-2 text-xs font-bold transition shadow-2xs cursor-pointer min-h-[40px]"
                  >
                    <Edit3 className="h-4 w-4 text-violet-500" />
                    <span>Edit Details</span>
                  </button>
                )}

                {club.is_owner && (
                  <button
                    onClick={() => setShowAddMemberModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white px-3.5 py-2 text-xs font-bold transition shadow-xs cursor-pointer min-h-[40px]"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Team Member</span>
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
                  {club.youtube_url && (
                    <a
                      href={club.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-red-600 dark:text-slate-300 dark:hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                      title="YouTube Channel"
                    >
                      <YoutubeIcon className="h-4 w-4" />
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

                  {/* Three-Dot Menu (Visible to everyone) */}
                  <div className="relative ml-0.5">
                    <button
                      type="button"
                      onClick={() => setShowMoreMenu(!showMoreMenu)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                      title="More options"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {showMoreMenu && (
                      <div className="absolute right-0 top-full mt-1.5 z-40 w-56 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131B2E] p-1.5 shadow-xl animate-in fade-in duration-100">
                        {/* Share button - visible to everyone */}
                        <button
                          type="button"
                          onClick={handleShareClub}
                          className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        >
                          <Share2 className="h-3.5 w-3.5 shrink-0 text-violet-500" />
                          <span>{copiedShareLink ? "Link Copied!" : "Share Society Page"}</span>
                        </button>

                        {/* Handover Presidency - only for current Owner */}
                        {club.is_owner && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowMoreMenu(false);
                              setTransferError(null);
                              setTransferSuccess(null);
                              setShowTransferModal(true);
                            }}
                            className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition cursor-pointer"
                          >
                            <Crown className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                            <span>Handover Presidency</span>
                          </button>
                        )}

                        {/* Report Rogue Society - hidden for President & VP */}
                        {!isPresidentOrVP && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowMoreMenu(false);
                              setReportError(null);
                              setReportSuccess(null);
                              setShowReportModal(true);
                            }}
                            className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                          >
                            <Flag className="h-3.5 w-3.5 shrink-0 text-rose-500" />
                            <span>Report Rogue Society</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
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
                onClick={() => setActiveTab("posts")}
                className={`pb-2.5 text-xs font-bold transition cursor-pointer border-b-2 ${
                  activeTab === "posts"
                    ? "border-violet-600 text-violet-600 dark:text-violet-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                Society Posts ({clubPosts.length})
              </button>
              <button
                onClick={() => setActiveTab("team")}
                className={`pb-2.5 text-xs font-bold transition cursor-pointer border-b-2 ${
                  activeTab === "team"
                    ? "border-violet-600 text-violet-600 dark:text-violet-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                Society Team ({club.members_count})
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

                {/* Key Achievements & Honors */}
                {club.achievements && (
                  <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#131B2E] p-6 shadow-xs">
                    <div className="flex items-center gap-2 mb-3">
                      <Trophy className="h-4 w-4 text-amber-500" />
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                        Key Achievements & Honors
                      </h3>
                    </div>
                    <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {club.achievements}
                    </div>
                  </div>
                )}
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
                    <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white font-bold text-xs overflow-hidden">
                      {club.owner_profile_picture ? (
                        <Image
                          src={club.owner_profile_picture}
                          alt={club.owner_name}
                          fill
                          sizes="32px"
                          className="object-cover"
                        />
                      ) : (
                        club.owner_name.charAt(0).toUpperCase()
                      )}
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

                  {(club.founded_in || club.founded_by) && (
                    <>
                      <hr className="border-slate-100 dark:border-slate-800" />
                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-violet-500" />
                          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                            Society Heritage
                          </h3>
                        </div>
                        {club.founded_in && (
                          <div>
                            <p className="text-[10px] font-semibold text-slate-400">Founded In</p>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">
                              {club.founded_in}
                            </p>
                          </div>
                        )}
                        {club.founded_by && (
                          <div>
                            <p className="text-[10px] font-semibold text-slate-400">Founded By</p>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">
                              {club.founded_by}
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Society Posts & Updates */}
          {activeTab === "posts" && (
            <div className="mt-6 max-w-2xl mx-auto space-y-6">
              {/* If President or VP: show CreatePostBox locked to this society */}
              {isPresidentOrVP && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-violet-600 dark:text-violet-400">
                    <Landmark className="h-3.5 w-3.5" />
                    <span>Publish Announcement or Post as {club.name}</span>
                  </div>
                  <CreatePostBox
                    fixedClub={{
                      id: club.id,
                      name: club.name,
                      slug: club.slug,
                      logo_url: club.logo_url,
                      role: club.my_role || "PRESIDENT",
                    }}
                    onPostCreated={(newPost) => {
                      setClubPosts((prev) => [newPost, ...prev]);
                    }}
                  />
                </div>
              )}

              {/* Feed of Society Posts */}
              {postsLoading ? (
                <div className="flex justify-center py-12 text-slate-400">
                  <Loader2 className="h-7 w-7 animate-spin text-violet-600" />
                </div>
              ) : clubPosts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-[#131B2E] p-12 text-center shadow-xs">
                  <FileText className="mx-auto h-9 w-9 text-slate-400 mb-2" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    No posts published yet
                  </h4>
                  <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                    Official updates, event recaps, and announcements from {club.name} will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {clubPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onPostDeleted={(deletedId) => {
                        setClubPosts((prev) => prev.filter((p) => p.id !== deletedId));
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Society Team */}
          {activeTab === "team" && (
            <div className="mt-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#131B2E] p-6 shadow-xs">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Official Student Leadership & Team Roster
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Verified student coordinators and members managing {club.name}.
                  </p>
                </div>

                {club.is_owner && (
                  <button
                    onClick={() => setShowAddMemberModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Team Member</span>
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
                        onClick={() => handleOpenRemoveMemberModal(member)}
                        title="Remove member from society team"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 transition cursor-pointer"
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

        {/* Modal: Edit Society Details */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
            <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131B2E] p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150 my-8">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Edit3 className="h-4 w-4 text-violet-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Edit Society Details
                  </h3>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {editError && (
                <div className="mt-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-2.5 text-xs text-rose-700 dark:text-rose-300">
                  {editError}
                </div>
              )}

              <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Official Society Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none"
                  />
                </div>

                {/* Handle / Slug */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Society Handle / Slug
                  </label>
                  <input
                    type="text"
                    required
                    value={editSlug}
                    onChange={(e) => setEditSlug(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""))}
                    placeholder="csi.ipec or csi_ipec"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none"
                  />
                  <p className="mt-1 text-[10px] text-slate-400">
                    Supports dots (.) and underscores (_). Changing handle updates your society URL.
                  </p>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tagline */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tagline / Motto
                  </label>
                  <input
                    type="text"
                    maxLength={200}
                    value={editTagline}
                    onChange={(e) => setEditTagline(e.target.value)}
                    placeholder="Short one-line motto"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    About / Description
                  </label>
                  <textarea
                    rows={4}
                    maxLength={2000}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Describe your society..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-3 text-xs text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none resize-y"
                  />
                </div>

                {/* Heritage: Founded In & Founded By */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Founded Year (Established In)
                    </label>
                    <input
                      type="text"
                      maxLength={50}
                      value={editFoundedIn}
                      onChange={(e) => setEditFoundedIn(e.target.value)}
                      placeholder="e.g. 2018 or Fall 2019"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Founded By (Founding Members / Seniors)
                    </label>
                    <input
                      type="text"
                      maxLength={150}
                      value={editFoundedBy}
                      onChange={(e) => setEditFoundedBy(e.target.value)}
                      placeholder="e.g. Ankur Kulhari & Batch of 2022"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Achievements & Honors */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Key Achievements & Milestones (Optional)
                  </label>
                  <textarea
                    rows={3}
                    maxLength={3000}
                    value={editAchievements}
                    onChange={(e) => setEditAchievements(e.target.value)}
                    placeholder="List major hackathon wins, campus festival records, national competitions, or key milestones..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-3 text-xs text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none resize-y"
                  />
                </div>

                {/* Photo & Banner Uploads */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Logo Photo
                    </label>
                    <input
                      type="file"
                      ref={editLogoInputRef}
                      accept="image/*"
                      onChange={handleEditLogoSelect}
                      className="hidden"
                    />
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        {editLogoUrl ? (
                          <img
                            src={editLogoUrl}
                            alt="Logo"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-slate-400 font-bold text-xs">
                            No Logo
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <button
                          type="button"
                          disabled={editLogoUploading}
                          onClick={() => editLogoInputRef.current?.click()}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition"
                        >
                          {editLogoUploading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Camera className="h-3 w-3" />
                          )}
                          <span>Change</span>
                        </button>
                        {editLogoUrl && (
                          <button
                            type="button"
                            onClick={() => setEditLogoUrl("")}
                            className="block text-[10px] text-rose-500 hover:underline"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Cover Banner
                    </label>
                    <input
                      type="file"
                      ref={editBannerInputRef}
                      accept="image/*"
                      onChange={handleEditBannerSelect}
                      className="hidden"
                    />
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-18 shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        {editBannerUrl ? (
                          <img
                            src={editBannerUrl}
                            alt="Banner"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-slate-400 font-bold text-[10px]">
                            No Banner
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <button
                          type="button"
                          disabled={editBannerUploading}
                          onClick={() => editBannerInputRef.current?.click()}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition"
                        >
                          {editBannerUploading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Camera className="h-3 w-3" />
                          )}
                          <span>Change</span>
                        </button>
                        {editBannerUrl && (
                          <button
                            type="button"
                            onClick={() => setEditBannerUrl("")}
                            className="block text-[10px] text-rose-500 hover:underline"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Social Links */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Instagram URL
                    </label>
                    <input
                      type="url"
                      value={editInstagramUrl}
                      onChange={(e) => setEditInstagramUrl(e.target.value)}
                      placeholder="https://instagram.com/..."
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      LinkedIn URL
                    </label>
                    <input
                      type="url"
                      value={editLinkedinUrl}
                      onChange={(e) => setEditLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/..."
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      YouTube Channel URL
                    </label>
                    <input
                      type="url"
                      value={editYoutubeUrl}
                      onChange={(e) => setEditYoutubeUrl(e.target.value)}
                      placeholder="https://youtube.com/@..."
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Website URL
                    </label>
                    <input
                      type="url"
                      value={editWebsiteUrl}
                      onChange={(e) => setEditWebsiteUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Faculty Coordinator */}
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Faculty Coordinator Name
                  </label>
                  <input
                    type="text"
                    value={editFacultyName}
                    onChange={(e) => setEditFacultyName(e.target.value)}
                    placeholder="Prof. / Dr. ..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit || editLogoUploading || editBannerUploading}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white px-5 py-2 text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {savingEdit ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Add Team Member */}
        {showAddMemberModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131B2E] p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Add Team Member
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Add verified students from any year (1st, 2nd, 3rd, or 4th) to your society roster.
                  </p>
                </div>
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
                    <option value="VICE_PRESIDENT">Vice President / Co-Lead</option>
                    <option value="LEAD">Lead Coordinator</option>
                    <option value="CORE">Core Member</option>
                    <option value="MEMBER">Member / Volunteer (1st - 4th Year)</option>
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
                    placeholder="e.g. Technical Head, Design Lead, Volunteer"
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
                    className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
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

        {/* Modal: Report Rogue Club / Society */}
        {showReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-[#131B2E] p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Report Rogue Society
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 p-2.5 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                CampusConnect strictly enforces that only official student presidents with faculty clearance can register clubs. Rogue or fake registrations will be unlisted immediately.
              </div>

              {reportSuccess && (
                <div className="mt-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-2.5 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{reportSuccess}</span>
                </div>
              )}

              {reportError && (
                <div className="mt-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-2.5 text-xs text-rose-700 dark:text-rose-300">
                  {reportError}
                </div>
              )}

              <form onSubmit={handleReportClub} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Reason for Report
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-rose-500 focus:outline-none"
                  >
                    <option value="Rogue / Unauthorized Registration (Student is not president or coordinator)">
                      Rogue / Unauthorized Registration (Student is not president)
                    </option>
                    <option value="Impersonation of Official College Society or Club">
                      Impersonation of Official College Society
                    </option>
                    <option value="Offensive, Vulgar, or Defamatory Content">
                      Offensive, Vulgar, or Defamatory Content
                    </option>
                    <option value="Duplicate or Fake Club Page">
                      Duplicate or Fake Club Page
                    </option>
                    <option value="Other Policy Violation">Other Policy Violation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Details & Context (Optional)
                  </label>
                  <textarea
                    rows={3}
                    maxLength={1000}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Provide evidence or context for campus moderation..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-rose-500 focus:outline-none resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReport || !!reportSuccess}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {submittingReport ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <span>Submit Report</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Custom Warning to Remove Team Member */}
        {memberToRemove && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-[#131B2E] p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                    <Trash2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Remove Team Member
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setMemberToRemove(null)}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  Are you sure you want to remove{" "}
                  <span className="font-bold text-slate-900 dark:text-white">
                    {memberToRemove.name}
                  </span>{" "}
                  from <span className="font-bold text-slate-900 dark:text-white">{club.name}</span>?
                </p>

                <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 p-3 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  <span className="font-bold">Notice:</span> This action will immediately revoke their title{" "}
                  <span className="font-bold underline">
                    ({memberToRemove.title || memberToRemove.role.replace("_", " ")})
                  </span>{" "}
                  and remove their leadership & posting permissions for this society page.
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={() => setMemberToRemove(null)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={removingMember}
                  onClick={handleConfirmRemoveMember}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {removingMember ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Removing...</span>
                    </>
                  ) : (
                    <span>Yes, Remove Member</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Handover Presidency / Leadership Succession */}
        {showTransferModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-white dark:bg-[#131B2E] p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                    <Crown className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Handover Presidency
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setShowTransferModal(false)}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  Stepping down or graduating? You can transfer full ownership and presidential authority of{" "}
                  <span className="font-bold text-slate-900 dark:text-white">{club.name}</span> to another verified student coordinator.
                </p>

                <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 p-3 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed space-y-1">
                  <p className="font-bold">Important Succession Protocol:</p>
                  <p>• The student must be an active, ID-verified student.</p>
                  <p>• Your role will transition to <span className="font-bold underline">Former President / Advisor</span>.</p>
                  <p>• Only the newly appointed President can manage administrative settings from that point onward.</p>
                </div>
              </div>

              {transferSuccess && (
                <div className="mt-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-2.5 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{transferSuccess}</span>
                </div>
              )}

              {transferError && (
                <div className="mt-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-2.5 text-xs text-rose-700 dark:text-rose-300">
                  {transferError}
                </div>
              )}

              <form onSubmit={handleTransferPresidency} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Successor Student Username or Roll Number
                  </label>
                  <input
                    type="text"
                    required
                    value={transferUsername}
                    onChange={(e) => setTransferUsername(e.target.value)}
                    placeholder="e.g. ankur or 2200300100054"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                {/* Quick Select from Current Society Team Members */}
                {club.members.filter((m) => m.user_id !== club.owner_id).length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Or select from active team members:
                    </p>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                      {club.members
                        .filter((m) => m.user_id !== club.owner_id)
                        .map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setTransferUsername(m.username)}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
                              transferUsername.toLowerCase() === m.username.toLowerCase()
                                ? "border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                                : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                            }`}
                          >
                            <span>{m.full_name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">@{m.username}</span>
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowTransferModal(false)}
                    className="rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={transferringPresidency || !!transferSuccess || !transferUsername.trim()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {transferringPresidency ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Transferring...</span>
                      </>
                    ) : (
                      <span>Confirm & Handover Presidency</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Image Cropper */}
        <ImageCropModal
          isOpen={cropModalOpen}
          imageSrc={cropImageSrc}
          aspectRatio={cropType === "logo" ? "1:1" : "16:7"}
          title={cropType === "logo" ? "Crop Society Logo (1:1)" : "Crop Cover Banner (Wide)"}
          onClose={() => {
            setCropModalOpen(false);
            setCropImageSrc(null);
          }}
          onCropDone={handleCropDone}
        />
      </div>
    </AuthGuard>
  );
}
