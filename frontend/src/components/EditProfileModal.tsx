"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { UserProfile } from "@/types";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { X, Loader2, Camera, Upload } from "lucide-react";

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
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.profile_picture || null);
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

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size exceeds 5MB limit.");
      return;
    }

    setError(null);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      let currentPicUrl = profile.profile_picture;

      // 1. If an image file was selected, upload it directly to Cloudinary
      if (avatarFile) {
        const uploadRes = await api.users.uploadAvatar(avatarFile);
        currentPicUrl = uploadRes.profile_picture;
      }

      // 2. Update name and bio
      const updated = await api.users.updateMeProfile({
        full_name: fullName.trim() || undefined,
        bio: bio.trim() || null,
        profile_picture: currentPicUrl,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">
            Edit Profile
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <p className="rounded-lg bg-red-50 p-2 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-400">
              {error}
            </p>
          )}

          {/* Profile Picture Upload Section */}
          <div className="flex flex-col items-center gap-2 pb-2">
            <div className="relative group">
              <div className="relative h-20 w-20 rounded-full overflow-hidden bg-indigo-100 dark:bg-indigo-950 border-2 border-indigo-500/20 shadow-sm flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-2xl">
                {avatarPreview ? (
                  <Image
                    src={avatarPreview}
                    alt={profile.username}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : (
                  profile.full_name.charAt(0).toUpperCase()
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white"
                title="Change Avatar"
              >
                <Camera className="h-6 w-6" />
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
            >
              <Upload className="h-3 w-3" />
              <span>{avatarFile ? "Change photo" : "Upload new photo"}</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={200}
              placeholder="Tell other students about yourself, branch, interests..."
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500 transition disabled:opacity-50"
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
  );
}
