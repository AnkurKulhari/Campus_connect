"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AuthGuard } from "@/components/AuthGuard";
import { api, ApiError } from "@/lib/api";
import {
  Landmark,
  ShieldAlert,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  UploadCloud,
  ExternalLink,
  GraduationCap,
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
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [facultyCoordinatorName, setFacultyCoordinatorName] = useState("");
  const [facultyCoordinatorEmail, setFacultyCoordinatorEmail] = useState("");
  const [declarationAccepted, setDeclarationAccepted] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate slug from name if slug not yet manually touched
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9_]/g, "_")) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "_")
        .replace(/_+/g, "_")
        .slice(0, 30);
      setSlug(generated);
    }
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

    setSubmitting(true);
    setError(null);

    try {
      const newClub = await api.clubs.register({
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        category,
        tagline: tagline.trim() || undefined,
        description: description.trim() || undefined,
        logo_url: logoUrl.trim() || undefined,
        banner_url: bannerUrl.trim() || undefined,
        instagram_url: instagramUrl.trim() || undefined,
        linkedin_url: linkedinUrl.trim() || undefined,
        website_url: websiteUrl.trim() || undefined,
        faculty_coordinator_name: facultyCoordinatorName.trim() || undefined,
        faculty_coordinator_email: facultyCoordinatorEmail.trim() || undefined,
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

            {/* Error Message */}
            {error && (
              <div className="mt-6 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-3.5 flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
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
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    placeholder="csi_ipec"
                    className="w-full bg-transparent px-3 py-2.5 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none disabled:opacity-50"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Lowercase letters, numbers, and underscores only. Max 50 characters.
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

              {/* Field 6: Logo URL & Banner URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Logo Image URL
                  </label>
                  <input
                    type="url"
                    disabled={!isEligible || submitting}
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50"
                  />
                  <p className="mt-1 text-[10px] text-slate-400">Square PNG or JPG recommended</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Cover Banner URL (Optional)
                  </label>
                  <input
                    type="url"
                    disabled={!isEligible || submitting}
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50"
                  />
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

              {/* Field 8: Faculty Coordinator Information */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Faculty Mentor / Teacher-in-Charge
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Faculty College Email
                    </label>
                    <input
                      type="email"
                      disabled={!isEligible || submitting}
                      value={facultyCoordinatorEmail}
                      onChange={(e) => setFacultyCoordinatorEmail(e.target.value)}
                      placeholder="faculty_name@ipec.org.in"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50"
                    />
                  </div>
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
                  disabled={!isEligible || !declarationAccepted || submitting}
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
