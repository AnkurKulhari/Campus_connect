"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { UserProfile } from "@/types";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { X, Loader2, Camera, Upload, Crop, ShieldCheck } from "lucide-react";
import { LinkedinIcon } from "@/components/icons/LinkedinIcon";
import { AvatarCropModal } from "@/components/AvatarCropModal";

export function EditProfileModal({
  profile,
  isOpen,
  onClose,
  onUpdated,
}: {
  profile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updated: UserProfile) => void;
}) {
  const { refreshUser } = useAuth();
  const [fullName, setFullName] = useState(profile.full_name);
  const [bio, setBio] = useState(profile.bio || "");
  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedin_url || "");
  const [year, setYear] = useState(profile.year || "1st Year");
  const [branch, setBranch] = useState(profile.branch || "Computer Science & Engineering (CSE)");
  const [course, setCourse] = useState(profile.course || "B.Tech");
  const [isYearBack, setIsYearBack] = useState(profile.is_year_back || false);

  // Avatar states
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.profile_picture || null);
  const [rawImageToCrop, setRawImageToCrop] = useState<string | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (JPEG, PNG, WEBP, or GIF).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image size exceeds 10MB limit.");
      return;
    }

    setError(null);
    const objectUrl = URL.createObjectURL(file);
    setRawImageToCrop(objectUrl);
    setCropModalOpen(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCropDone = (croppedFile: File, croppedPreviewUrl: string) => {
    setAvatarFile(croppedFile);
    setAvatarPreview(croppedPreviewUrl);
    setCropModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      let currentPicUrl = profile.profile_picture;

      // 1. If an image file was cropped & selected, upload it directly to Cloudinary
      if (avatarFile) {
        const uploadRes = await api.users.uploadAvatar(avatarFile);
        currentPicUrl = uploadRes.profile_picture;
      }

      // 2. Update profile fields
      const updated = await api.users.updateMeProfile({
        full_name: fullName.trim() || undefined,
        bio: bio.trim() || null,
        profile_picture: currentPicUrl,
        linkedin_url: linkedinUrl.trim() || null,
        course,
        branch,
        year,
        is_year_back: isYearBack,
      });

      onUpdated(updated);
      try {
        await refreshUser();
      } catch {
        // ignore refresh error
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
        <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Edit Profile
            </h2>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {error && (
              <p className="rounded-xl bg-red-50 p-2 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-400">
                {error}
              </p>
            )}

            {/* Profile Picture Upload & Crop Section */}
            <div className="flex flex-col items-center gap-2 pb-2">
              <div className="relative group">
                <div className="relative h-24 w-24 rounded-full overflow-hidden bg-blue-100 dark:bg-slate-800 border-2 border-blue-500/30 shadow-md flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-3xl">
                  {avatarPreview ? (
                    <Image
                      src={avatarPreview}
                      alt={profile.username}
                      fill
                      draggable={false}
                      sizes="96px"
                      className="object-cover select-none pointer-events-none"
                    />
                  ) : (
                    profile.full_name.charAt(0).toUpperCase()
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-full bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition text-white text-xs font-semibold"
                  title="Change Avatar"
                >
                  <Camera className="h-6 w-6 mb-1" />
                  <span>Change</span>
                </button>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
              />

              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 transition"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>{avatarFile ? "Choose different" : "Upload new photo"}</span>
                </button>

                {avatarPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setRawImageToCrop(avatarPreview);
                      setCropModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 dark:border-blue-900 bg-blue-50/80 dark:bg-blue-950/40 px-3.5 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition"
                    title="Crop this photo"
                  >
                    <Crop className="h-3.5 w-3.5" />
                    <span>Crop photo</span>
                  </button>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Full Name
                </label>
                {profile.is_id_verified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-800/40">
                    <ShieldCheck className="h-3 w-3" />
                    <span>Verified via College ID</span>
                  </span>
                )}
              </div>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={profile.is_id_verified}
                readOnly={profile.is_id_verified}
                required
                className={`w-full rounded-xl border px-3.5 py-2 text-sm transition ${
                  profile.is_id_verified
                    ? "border-slate-200 bg-slate-100/80 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400 cursor-not-allowed select-none"
                    : "border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                }`}
              />
              {profile.is_id_verified && (
                <p className="mt-1 text-[11px] text-slate-400">
                  To safeguard campus trust and prevent spoofing, verified names are permanently bound to your college ID card.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                maxLength={200}
                placeholder="Tell other students about yourself, branch, interests..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                LinkedIn Profile URL
              </label>
              <div className="relative">
                <LinkedinIcon className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9.5 pr-3 py-2 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Course
                </label>
                <select
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="B.Tech">B.Tech</option>
                  <option value="MCA">MCA</option>
                  <option value="MBA">MBA</option>
                  <option value="M.Tech">M.Tech</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Year / Status
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Alumni">Alumni</option>
                </select>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-3.5 dark:border-amber-900/40 dark:bg-amber-950/20">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isYearBack}
                  onChange={(e) => setIsYearBack(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-amber-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    Extended Course Duration (Year-Back)
                  </span>
                  <p className="mt-0.5 text-[11px] text-amber-800/80 dark:text-amber-300/80 leading-snug">
                    Keeps your student account active past your original batch timeline. Private and never shown to other students.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-slate-200 px-5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 hover:bg-blue-700 px-5 py-2 text-xs font-bold text-white shadow-xs transition disabled:opacity-50"
              >
                {saving ? (
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

      {/* Avatar Cropping Modal */}
      <AvatarCropModal
        imageSrc={rawImageToCrop}
        isOpen={cropModalOpen}
        onClose={() => setCropModalOpen(false)}
        onCropDone={handleCropDone}
      />
    </>
  );
}
