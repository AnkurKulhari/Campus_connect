"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AuthGuard } from "@/components/AuthGuard";
import { api, ApiError } from "@/lib/api";
import { checkImageSafety } from "@/lib/nsfw";
import {
  Landmark,
  ShieldAlert,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Upload,
  Image as ImageIcon,
  Trash2,
  Camera,
} from "lucide-react";

const CATEGORIES = [
  "Technical",
  "Cultural",
  "Sports",
  "Literary",
  "Social",
  "Departmental",
  "Other",
];

export default function RegisterClubPage() {
  const { user } = useAuth();
  const router = useRouter();

  const isVerified = user?.is_id_verified && user?.is_verified;
  const isSenior = user?.year === "3rd Year" || user?.year === "4th Year";
  const isEligible = isVerified && isSenior;

  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("Technical");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [facultyCoordinatorName, setFacultyCoordinatorName] = useState("");
  const [declarationAccepted, setDeclarationAccepted] = useState(false);

  // Logo upload state
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Banner upload state
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string>("");
  const [bannerUploading, setBannerUploading] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Auto-generate slug from name if slug not yet manually touched
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9._]/g, "_")) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9._]/g, "_")
        .replace(/_+/g, "_")
        .slice(0, 30);
      setSlug(generated);
    }
  };

  // Logo selection & upload handler
  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please upload an image file (PNG, JPG, WEBP).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Logo image size must be under 10MB.");
      return;
    }

    setUploadError(null);
    setLogoUploading(true);

    try {
      // Step 1: Client-side explicit nudity scan
      const safety = await checkImageSafety(file);
      if (safety.isExplicit) {
        setUploadError("Photo rejected: Adult or explicit content detected. Please choose another logo.");
        setLogoUploading(false);
        return;
      }

      // Step 2: Instant local preview
      const localUrl = URL.createObjectURL(file);
      setLogoPreview(localUrl);

      // Step 3: Cloudinary upload
      const res = await api.clubs.uploadImage(file, "logo");
      setLogoUrl(res.url);
    } catch (err) {
      if (err instanceof ApiError) {
        setUploadError(err.detail);
      } else {
        setUploadError("Failed to upload logo image. Please try again.");
      }
      setLogoPreview(null);
      setLogoUrl("");
    } finally {
      setLogoUploading(false);
    }
  };

  // Banner selection & upload handler
  const handleBannerSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please upload an image file (PNG, JPG, WEBP).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Cover banner image size must be under 10MB.");
      return;
    }

    setUploadError(null);
    setBannerUploading(true);

    try {
      // Step 1: Client-side explicit nudity scan
      const safety = await checkImageSafety(file);
      if (safety.isExplicit) {
        setUploadError("Photo rejected: Adult or explicit content detected. Please choose another banner.");
        setBannerUploading(false);
        return;
      }

      // Step 2: Instant local preview
      const localUrl = URL.createObjectURL(file);
      setBannerPreview(localUrl);

      // Step 3: Cloudinary upload
      const res = await api.clubs.uploadImage(file, "banner");
      setBannerUrl(res.url);
    } catch (err) {
      if (err instanceof ApiError) {
        setUploadError(err.detail);
      } else {
        setUploadError("Failed to upload cover banner. Please try again.");
      }
      setBannerPreview(null);
      setBannerUrl("");
    } finally {
      setBannerUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setLogoUrl("");
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const handleRemoveBanner = () => {
    setBannerPreview(null);
    setBannerUrl("");
    if (bannerInputRef.current) bannerInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEligible) return;

    if (!declarationAccepted) {
      setError(
        "You must accept the mandatory anti-rogue declaration confirming your official appointment as President / Lead Coordinator."
      );
      return;
    }

    if (!name.trim()) {
      setError("Please provide the official Name of the club or society.");
      return;
    }

    if (!slug.trim()) {
      setError("Please provide a unique handle/slug for the club URL.");
      return;
    }

    if (logoUploading || bannerUploading) {
      setError("Please wait for media uploads to finish before submitting.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const newClub = await api.clubs.register({
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        category,
        tagline: tagline.trim() || undefined,
        description: description.trim() || undefined,
        logo_url: logoUrl || undefined,
        banner_url: bannerUrl || undefined,
        instagram_url: instagramUrl.trim() || undefined,
        linkedin_url: linkedinUrl.trim() || undefined,
        website_url: websiteUrl.trim() || undefined,
        faculty_coordinator_name: facultyCoordinatorName.trim() || undefined,
        declaration_accepted: declarationAccepted,
      });

      router.push(`/clubs/${newClub.slug}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail);
      } else {
        setError("An error occurred during registration. Please check your inputs.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {/* Top navigation link */}
          <Link
            href="/clubs"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-6 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Societies Directory</span>
          </Link>

          {/* Card Container */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#131B2E] p-6 sm:p-8 shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600 text-white shadow-xs">
                <Landmark className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Register a College Club or Society
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Establish an official student chapter or cultural society at Inderprastha Engineering College.
                </p>
              </div>
            </div>

            {/* MANDATORY ANTI-ROGUE WARNING BANNER */}
            <div className="mt-6 rounded-2xl border-2 border-amber-500/80 bg-amber-50/80 dark:bg-amber-950/30 p-5 text-amber-900 dark:text-amber-200 shadow-xs">
              <div className="flex items-start gap-3.5">
                <ShieldAlert className="h-6 w-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1.5 text-xs">
                  <p className="font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                    Mandatory Campus Notice — Anti-Rogue Society Policy
                  </p>
                  <p className="leading-relaxed">
                    <strong>Only official Presidents or authorized Faculty-Appointed Lead Coordinators</strong> are permitted to register a college society or club.
                  </p>
                  <p className="leading-relaxed text-amber-800/90 dark:text-amber-200/90">
                    Any rogue, fraudulent, prank, or duplicate society page reported by students or faculty will be <strong>permanently removed</strong>. The student account responsible will be flagged and reported for disciplinary review under IPEC student conduct guidelines.
                  </p>
                </div>
              </div>
            </div>

            {/* Ineligibility notice if 1st/2nd year or unverified */}
            {!isEligible && (
              <div className="mt-6 rounded-2xl border border-rose-200 dark:border-rose-800/80 bg-rose-50 dark:bg-rose-950/40 p-5 text-xs text-rose-800 dark:text-rose-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-sm">Eligibility Restriction</p>
                    <p className="leading-relaxed">
                      Only <strong>verified 3rd Year and 4th Year student coordinators</strong> can establish an official club or society.
                    </p>
                    <ul className="list-disc pl-5 space-y-0.5 mt-2 text-[11px] text-rose-700 dark:text-rose-300">
                      <li>ID Card Verification: {isVerified ? "✓ Verified" : "✗ Pending Verification"}</li>
                      <li>Academic Standing: {user?.year || "Unspecified"} (Requires 3rd or 4th Year)</li>
                    </ul>
                    <p className="mt-2 text-[11px]">
                      If you are an appointed junior lead, please coordinate with your 3rd or 4th year Society President to register the page.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* General & Upload Error Messages */}
            {(error || uploadError) && (
              <div className="mt-6 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-3.5 flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error || uploadError}</span>
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              {/* Field 1: Official Club Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Official Club / Society Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={!isEligible || submitting}
                  value={name}
                  onChange={handleNameChange}
                  placeholder="e.g. Computer Society of India - IPEC, Samavesh, GDG On Campus"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  The full official name as recognized by Inderprastha Engineering College.
                </p>
              </div>

              {/* Field 2: Handle / Slug */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Society Handle / URL Slug <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 overflow-hidden focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-500">
                  <span className="px-3 text-xs font-mono text-slate-400 border-r border-slate-200 dark:border-slate-700 select-none">
                    campusconnect/clubs/
                  </span>
                  <input
                    type="text"
                    required
                    disabled={!isEligible || submitting}
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""))}
                    placeholder="csi.ipec or csi_ipec"
                    className="w-full bg-transparent px-3 py-2.5 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none disabled:opacity-50"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Lowercase letters, numbers, dots (.), and underscores (_). Max 50 characters.
                </p>
              </div>

              {/* Field 3: Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Society Category <span className="text-rose-500">*</span>
                </label>
                <select
                  disabled={!isEligible || submitting}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Field 4: Tagline / Motto */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tagline / Motto
                </label>
                <input
                  type="text"
                  maxLength={200}
                  disabled={!isEligible || submitting}
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Official Student Chapter for Innovation and Computing at IPEC"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50"
                />
              </div>

              {/* Field 5: Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  About the Society / Mission
                </label>
                <textarea
                  rows={4}
                  maxLength={2000}
                  disabled={!isEligible || submitting}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your society's vision, regular events (hackathons, workshops, fests), departments, and membership process..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-3.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50 resize-y"
                />
              </div>

              {/* Field 6: UPLOADABLE LOGO & COVER BANNER */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-slate-100 dark:border-slate-800">
                {/* Logo Upload Box */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Society Logo Photo
                  </label>
                  <input
                    type="file"
                    ref={logoInputRef}
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    disabled={!isEligible || submitting || logoUploading}
                    onChange={handleLogoSelect}
                    className="hidden"
                  />

                  {logoPreview ? (
                    <div className="relative flex items-center gap-3.5 rounded-xl border border-slate-200 dark:border-slate-700 p-3 bg-slate-50/80 dark:bg-slate-900/40">
                      <div className="relative h-14 w-14 shrink-0 rounded-xl overflow-hidden ring-1 ring-black/10 dark:ring-white/10 bg-slate-200 dark:bg-slate-800">
                        <img
                          src={logoPreview}
                          alt="Logo Preview"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {logoUploading ? "Uploading to Cloud..." : "Logo Ready"}
                        </p>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                          {logoUploading ? (
                            <Loader2 className="h-3 w-3 animate-spin text-violet-500" />
                          ) : (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                          <span>{logoUploading ? "Processing..." : "Cloud Verified"}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => logoInputRef.current?.click()}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                          title="Change Logo"
                        >
                          <Camera className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="rounded-lg p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          title="Remove Logo"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={!isEligible || submitting || logoUploading}
                      onClick={() => logoInputRef.current?.click()}
                      className="w-full flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 hover:border-violet-500 dark:border-slate-700 dark:hover:border-violet-400 p-5 bg-slate-50/50 hover:bg-slate-100/60 dark:bg-slate-900/30 dark:hover:bg-slate-800/40 transition cursor-pointer disabled:opacity-50 group min-h-[110px]"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 group-hover:scale-105 transition mb-2">
                        {logoUploading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Upload className="h-5 w-5" />
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        {logoUploading ? "Scanning & Uploading..." : "Upload Society Logo"}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        PNG, JPG, or WEBP up to 10MB
                      </span>
                    </button>
                  )}
                </div>

                {/* Banner Upload Box */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Cover Banner Photo (Optional)
                  </label>
                  <input
                    type="file"
                    ref={bannerInputRef}
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    disabled={!isEligible || submitting || bannerUploading}
                    onChange={handleBannerSelect}
                    className="hidden"
                  />

                  {bannerPreview ? (
                    <div className="relative flex items-center gap-3.5 rounded-xl border border-slate-200 dark:border-slate-700 p-3 bg-slate-50/80 dark:bg-slate-900/40">
                      <div className="relative h-14 w-20 shrink-0 rounded-xl overflow-hidden ring-1 ring-black/10 dark:ring-white/10 bg-slate-200 dark:bg-slate-800">
                        <img
                          src={bannerPreview}
                          alt="Banner Preview"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {bannerUploading ? "Uploading to Cloud..." : "Banner Ready"}
                        </p>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                          {bannerUploading ? (
                            <Loader2 className="h-3 w-3 animate-spin text-violet-500" />
                          ) : (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                          <span>{bannerUploading ? "Processing..." : "Cloud Verified"}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => bannerInputRef.current?.click()}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                          title="Change Banner"
                        >
                          <Camera className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveBanner}
                          className="rounded-lg p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          title="Remove Banner"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={!isEligible || submitting || bannerUploading}
                      onClick={() => bannerInputRef.current?.click()}
                      className="w-full flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 hover:border-violet-500 dark:border-slate-700 dark:hover:border-violet-400 p-5 bg-slate-50/50 hover:bg-slate-100/60 dark:bg-slate-900/30 dark:hover:bg-slate-800/40 transition cursor-pointer disabled:opacity-50 group min-h-[110px]"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 group-hover:scale-105 transition mb-2">
                        {bannerUploading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <ImageIcon className="h-5 w-5" />
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        {bannerUploading ? "Scanning & Uploading..." : "Upload Cover Banner"}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        Wide 16:9 banner up to 10MB
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Field 7: Social Links */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Official Channels & Links
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Instagram URL
                    </label>
                    <input
                      type="url"
                      disabled={!isEligible || submitting}
                      value={instagramUrl}
                      onChange={(e) => setInstagramUrl(e.target.value)}
                      placeholder="https://instagram.com/..."
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      LinkedIn URL
                    </label>
                    <input
                      type="url"
                      disabled={!isEligible || submitting}
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/company/..."
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Website / GitHub URL
                    </label>
                    <input
                      type="url"
                      disabled={!isEligible || submitting}
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              {/* Field 8: Faculty Coordinator Information (EMAIL REMOVED) */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Faculty Mentor / Teacher-in-Charge
                </p>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Faculty Coordinator Name
                  </label>
                  <input
                    type="text"
                    disabled={!isEligible || submitting}
                    value={facultyCoordinatorName}
                    onChange={(e) => setFacultyCoordinatorName(e.target.value)}
                    placeholder="Prof. / Dr. ..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50"
                  />
                  <p className="mt-1 text-[10px] text-slate-400">
                    Faculty mentor or department teacher-in-charge overseeing this society.
                  </p>
                </div>
              </div>

              {/* Field 9: MANDATORY ANTI-ROGUE DECLARATION CHECKBOX */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-start gap-3 rounded-xl border-2 border-amber-300 dark:border-amber-800/80 bg-amber-50/50 dark:bg-amber-950/20 p-4 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    required
                    disabled={!isEligible || submitting}
                    checked={declarationAccepted}
                    onChange={(e) => setDeclarationAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <div className="text-xs text-amber-950 dark:text-amber-200 leading-relaxed">
                    <span className="font-bold">
                      Solemn Declaration under College Honor Code:
                    </span>{" "}
                    I hereby declare that I am the official <strong>President / Lead Coordinator</strong> of this society or club at Inderprastha Engineering College. I understand that creating a fake, duplicate, or unauthorized society page will result in <strong>immediate deletion</strong> and disciplinary proceedings.
                  </div>
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!isEligible || !declarationAccepted || submitting || logoUploading || bannerUploading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white py-3 px-4 text-xs font-bold shadow-sm transition disabled:opacity-50 cursor-pointer min-h-[44px]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Verifying & Registering Society...</span>
                    </>
                  ) : (
                    <>
                      <Landmark className="h-4 w-4" />
                      <span>Complete Society Registration</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
