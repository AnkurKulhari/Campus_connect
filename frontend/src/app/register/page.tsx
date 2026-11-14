"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import {
  GraduationCap,
  Loader2,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Upload,
  X,
  ShieldCheck,
  RotateCw,
  Sparkles,
  Users,
  Briefcase,
  Lock,
  Mail,
  User as UserIcon,
} from "lucide-react";
import { LinkedinIcon } from "@/components/icons/LinkedinIcon";
import { SuccessModal } from "@/components/SuccessModal";
import { checkImageSafety } from "@/lib/nsfw";

const COURSE_OPTIONS = ["B.Tech", "MCA", "MBA", "M.Tech"];

const BRANCH_OPTIONS = [
  "Computer Science & Engineering (CSE)",
  "CSE (Artificial Intelligence & Machine Learning)",
  "CSE (Data Science)",
  "Information Technology (IT)",
  "Electronics & Communication Engineering (ECE)",
  "Mechanical Engineering (ME)",
  "Civil Engineering (CE)",
  "Applied Sciences / Other",
];

const YEAR_OPTIONS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "Alumni (Passed Out)",
];

const GENDER_OPTIONS = [
  { id: "Male", label: "Male" },
  { id: "Female", label: "Female" },
  { id: "Other", label: "Other" },
  { id: "Prefer not to say", label: "Prefer not to say" },
];

export default function RegisterPage() {
  const { user, isLoading, login } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<"form" | "otp">("form");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [collegeEmail, setCollegeEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("Prefer not to say");

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/home");
    }
  }, [user, isLoading, router]);

  // Academic Identity
  const [course, setCourse] = useState("B.Tech");
  const [branch, setBranch] = useState("Computer Science & Engineering (CSE)");
  const [year, setYear] = useState("1st Year");
  const [rollNumber, setRollNumber] = useState("");
  const [isYearBack, setIsYearBack] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState("");

  // ID Card Upload
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [idCardPreview, setIdCardPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Resend cooldown timer
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Automatically fill roll number if typed in college email
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCollegeEmail(val);
    const localPart = val.split("@")[0];
    if (/^\d{10,14}$/.test(localPart) && (!rollNumber || /^\d+$/.test(rollNumber))) {
      setRollNumber(localPart);
    }
  };

  // Compress camera photos for fast mobile uploads and reliable OCR
  const compressImage = (file: File, maxWidth = 1600, quality = 0.85): Promise<File> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith("image/") || file.size < 500 * 1024) {
        return resolve(file);
      }
      const img = document.createElement("img");
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(file);
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);
            const compressed = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(compressed);
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => resolve(file);
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  };

  const handleIdCardSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    if (file.size > 15 * 1024 * 1024) {
      setError("ID card image must be smaller than 15MB.");
      return;
    }

    // Pre-flight NSFW scan
    const safety = await checkImageSafety(file);
    if (safety.isExplicit) {
      setError(safety.reason || "Uploaded image violates community content safety guidelines.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setError(null);
    const processedFile = await compressImage(file);
    setIdCardFile(processedFile);
    setIdCardPreview(URL.createObjectURL(processedFile));
  };

  const removeIdCard = () => {
    if (idCardPreview) URL.revokeObjectURL(idCardPreview);
    setIdCardFile(null);
    setIdCardPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const email = collegeEmail.trim().toLowerCase();
    if (!email.endsWith("@ipec.org.in")) {
      setError("College email must end with @ipec.org.in (e.g. 2300300100032@ipec.org.in)");
      setLoading(false);
      return;
    }

    const localPart = email.split("@")[0];
    const isStandard13 = /^\d{13}$/.test(localPart) && localPart.substring(2, 6) === "0030";
    const isLegacy10 = /^\d{10}$/.test(localPart) && localPart.substring(2, 5) === "030";

    if (!isStandard13 && !isLegacy10) {
      setError(
        "Invalid college email: Must contain your official 13-digit AKTU roll number with IPEC institute code 0030 (e.g. 2300300100032@ipec.org.in)."
      );
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    if (linkedinUrl && !linkedinUrl.toLowerCase().includes("linkedin.com/")) {
      setError("Please provide a valid LinkedIn URL (e.g. https://linkedin.com/in/yourprofile).");
      setLoading(false);
      return;
    }

    if (!idCardFile) {
      setError("Official College ID card photo is required to verify your enrollment.");
      setLoading(false);
      return;
    }

    try {
      // 1. Upload ID card with OCR name verification
      const uploadRes = await api.auth.uploadIdCard(
        idCardFile,
        fullName.trim(),
        rollNumber.trim() || localPart
      );
      const uploadedIdCardUrl = uploadRes.id_card_url;

      const isAlumni = year.startsWith("Alumni");

      const res = await api.auth.register({
        full_name: fullName.trim(),
        username: username.trim().toLowerCase(),
        college_email: collegeEmail.trim(),
        password,
        gender,
        roll_number: rollNumber.trim() || localPart,
        course,
        branch,
        year: isAlumni ? "Alumni" : year,
        is_year_back: isYearBack,
        is_alumni: isAlumni,
        id_card_url: uploadedIdCardUrl,
        linkedin_url: linkedinUrl.trim() || undefined,
      });

      setSuccessMsg(res.message);
      setStep("otp");
      setCooldown(60);
    } catch (err: unknown) {
      console.error("[Register error]", err);
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.auth.verifyEmail({
        college_email: collegeEmail.trim(),
        otp: otp.trim(),
      });
      if (res.access_token) {
        await login(res.access_token);
      }
      setShowSuccessModal(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await api.auth.resendOtp(collegeEmail.trim());
      setSuccessMsg(res.message);
      setCooldown(60);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8 sm:py-12 relative overflow-hidden">
      {/* Decorative ambient gradient blooms */}
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
        {/* Left Column: CampusConnect Community Showcase (Visible on Desktop) */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between space-y-6 sticky top-24 pr-4">
          <div>
            {/* Campus badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-3.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>IPEC Campus Exclusive</span>
            </div>

            <h1 className="mt-4 text-3xl xl:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              Step into your campus circle.
            </h1>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              Connect exclusively with verified IPEC students and alumni. Share project breakthroughs, get placement insights, and stay ahead without the noise of open social networks.
            </p>

            {/* Feature Cards */}
            <div className="mt-8 space-y-3">
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl border border-slate-200/80 bg-white/70 backdrop-blur-xs dark:border-slate-800 dark:bg-[#131B2E]/70 shadow-xs">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">100% Verified Students & Alumni</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Zero spam or outsiders. Verification is tied directly to your official @ipec.org.in credentials.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl border border-slate-200/80 bg-white/70 backdrop-blur-xs dark:border-slate-800 dark:bg-[#131B2E]/70 shadow-xs">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Senior Mentorship & Referrals</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Get guidance directly from IPEC graduates working at top tech firms, product companies, and research labs.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl border border-slate-200/80 bg-white/70 backdrop-blur-xs dark:border-slate-800 dark:bg-[#131B2E]/70 shadow-xs">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Safe, Protected Campus Space</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Built-in media download protection shields and AI content safety filters safeguard student privacy.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Social Proof Footer */}
          <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800/60">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Live IPEC Campus Network
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Students and alumni actively engaging across B.Tech, MCA, MBA & Alumni Circle.
            </p>
          </div>
        </div>

        {/* Right Column: Registration Card */}
        <div className="col-span-12 lg:col-span-7">
          <div className="w-full rounded-3xl border border-slate-200/80 bg-white/95 dark:border-slate-800 dark:bg-[#131B2E]/95 p-6 sm:p-9 shadow-xl backdrop-blur-md">
            {/* Header / Brand on mobile & title */}
            <div className="text-left mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {step === "form" ? "Create Student Account" : "Verify College Email"}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {step === "form"
                      ? "Exclusive to verified IPEC students & alumni (@ipec.org.in)"
                      : `We sent a 6-digit confirmation code to ${collegeEmail}`}
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-5 rounded-2xl bg-rose-50 border border-rose-200/60 p-3.5 text-xs text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/40 dark:text-rose-300 flex items-start justify-between gap-2 animate-in fade-in">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
                  <span>{error}</span>
                </div>
                {(error.toLowerCase().includes("purged") ||
                  error.toLowerCase().includes("expired") ||
                  error.toLowerCase().includes("please register again")) && (
                  <button
                    type="button"
                    onClick={() => {
                      setStep("form");
                      setOtp("");
                      setError(null);
                    }}
                    className="shrink-0 underline font-bold hover:text-rose-900 dark:hover:text-rose-200 cursor-pointer"
                  >
                    Start Over →
                  </button>
                )}
              </div>
            )}

            {successMsg && !error && (
              <div className="mb-5 flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200/60 p-3.5 text-xs text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900/40 dark:text-emerald-300 animate-in fade-in">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                <span>{successMsg}</span>
              </div>
            )}

            {step === "form" ? (
              <form onSubmit={handleRegister} className="space-y-5">
                {/* Section 1: Account Credentials */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <UserIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Personal Identity
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Jake Gyllenhaal"
                        required
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:focus:bg-slate-800 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Username <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="e.g. jake_gyllenhaal"
                        required
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:focus:bg-slate-800 transition"
                      />
                    </div>
                  </div>

                  {/* Gender Selector */}
                  <div className="mt-4">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Gender <span className="text-slate-400 font-normal">(Displayed on profile)</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {GENDER_OPTIONS.map((opt) => {
                        const isSelected = gender === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setGender(opt.id)}
                            className={`px-3 py-2 text-xs font-semibold rounded-xl border transition text-center cursor-pointer ${
                              isSelected
                                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                : "bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-800"
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        College Email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                        <input
                          type="email"
                          value={collegeEmail}
                          onChange={handleEmailChange}
                          placeholder="e.g. 2100300100045@ipec.org.in"
                          required
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:focus:bg-slate-800 transition"
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">
                        Must end with @ipec.org.in
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Min 8 characters"
                          required
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:focus:bg-slate-800 transition"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Academic Standing */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-2 mb-3">
                    <GraduationCap className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Academic Standing & Verification
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Course <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={course}
                        onChange={(e) => setCourse(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white transition cursor-pointer"
                      >
                        {COURSE_OPTIONS.map((c) => (
                          <option key={c} value={c} className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Academic Standing <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white transition cursor-pointer"
                      >
                        {YEAR_OPTIONS.map((y) => (
                          <option key={y} value={y} className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Branch <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white transition truncate cursor-pointer"
                      >
                        {BRANCH_OPTIONS.map((b) => (
                          <option key={b} value={b} className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      13-Digit University Roll Number
                    </label>
                    <input
                      type="text"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      placeholder="e.g. 2100300100045"
                      maxLength={13}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-mono text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white transition"
                    />
                    <p className="mt-1 text-[11px] text-slate-400">
                      Your official AKTU roll number printed on your college ID enables instant automated verified badge activation.
                    </p>
                  </div>

                  {/* College ID Card Upload */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        College ID Card Photo <span className="text-red-500 font-bold">*</span>
                      </label>
                      <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full border border-blue-200/60 dark:border-blue-800/40">
                        Required • Verified via OCR
                      </span>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleIdCardSelect}
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                    />

                    {idCardPreview ? (
                      <div className="relative mt-1 aspect-video w-full max-w-xs rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                        <Image
                          src={idCardPreview}
                          alt="College ID Preview"
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={removeIdCard}
                          className="absolute top-2 right-2 rounded-full bg-black/70 p-1.5 text-white hover:bg-black transition cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2.5 rounded-2xl border border-dashed border-blue-300 dark:border-blue-800/80 p-4 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition bg-slate-50/60 dark:bg-slate-800/30 cursor-pointer"
                      >
                        <Upload className="h-4 w-4 text-blue-500" />
                        <span>Upload Official College ID Card (JPEG, PNG, max 10MB)</span>
                      </button>
                    )}
                    <p className="mt-1.5 text-[11px] text-slate-400 leading-relaxed">
                      Upload a clear photo of your official college student ID card. Your entered Full Name must match the name printed on your ID card for verification.
                    </p>
                  </div>
                </div>

                {/* Academic Year-Back / Course Extension Guidance */}
                <div className="rounded-2xl border border-amber-200/90 bg-amber-50/70 p-4 dark:border-amber-900/50 dark:bg-amber-950/25 transition">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isYearBack}
                      onChange={(e) => setIsYearBack(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-amber-400 text-blue-600 focus:ring-blue-500 dark:border-amber-700 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-amber-950 dark:text-amber-200">
                          Academic Year-Back / Course Extension Notice
                        </span>
                        <span className="rounded-full bg-amber-200/80 dark:bg-amber-900/60 px-2 py-0.5 text-[10px] font-bold text-amber-900 dark:text-amber-200">
                          Check if applicable
                        </span>
                      </div>

                      <div className="mt-2 space-y-2 text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed font-normal">
                        <p>
                          <strong>Why is this asked?</strong> CampusConnect automatically calculates your graduation year using the admission year in your AKTU roll number (e.g. <em>21...</em> indicates a 2021 admission).
                        </p>
                        
                        <div className="rounded-xl bg-amber-100/70 dark:bg-amber-900/30 p-2.5 space-y-1.5 text-[11px] border border-amber-200/70 dark:border-amber-800/40">
                          <p>
                            • <strong>Who should check this:</strong> Any student who repeated an academic year, took a session break, or has a delayed graduation timeline where their current year of study differs from their original admission batch.
                          </p>
                          <p>
                            • <strong>What this does:</strong> Protects your account from being prematurely converted to &ldquo;Alumni&rdquo; or expiring before you finish your degree, maintaining full student access to class feeds, discussions, and notes.
                          </p>
                          <p>
                            • <strong>Privacy guarantee:</strong> This selection is strictly administrative for badge verification and account duration. It is <strong>never shown publicly</strong> on your posts or profile to other classmates.
                          </p>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>

                {/* Section 3: LinkedIn Profile */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    LinkedIn Profile URL <span className="text-slate-400 font-normal">(Optional — for networking & alumni connections)</span>
                  </label>
                  <div className="relative">
                    <LinkedinIcon className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="url"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/yourprofile"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:focus:bg-slate-800 transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.005] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Verifying ID & Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account & Verify Email</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="mt-6 space-y-5">
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/60 dark:bg-blue-950/20 dark:border-blue-900/40 text-center">
                  <p className="text-xs text-blue-900 dark:text-blue-300">
                    We sent a 6-digit confirmation code to:
                  </p>
                  <p className="font-bold text-sm text-blue-700 dark:text-blue-400 mt-0.5">
                    {collegeEmail}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 text-center">
                    Enter 6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="••••••"
                    maxLength={6}
                    required
                    className="w-full text-center tracking-[0.5em] text-2xl font-mono font-bold rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white transition"
                  />
                  <p className="mt-1.5 text-[11px] text-slate-400 text-center">
                    Code expires in 10 minutes. Maximum 5 verification attempts.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={otp.length !== 6 || loading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <span>Complete Registration</span>
                  )}
                </button>

                <div className="flex items-center justify-between pt-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setStep("form")}
                    className="font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition"
                  >
                    ← Edit details
                  </button>

                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={cooldown > 0 || loading}
                    className="inline-flex items-center gap-1.5 font-semibold text-blue-600 hover:underline dark:text-blue-400 disabled:opacity-40 transition"
                  >
                    <RotateCw className="h-3 w-3" />
                    <span>
                      {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
                    </span>
                  </button>
                </div>
              </form>
            )}

            <p className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-5">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-bold text-blue-600 hover:underline dark:text-blue-400"
              >
                Sign in to your campus feed
              </Link>
            </p>
          </div>
        </div>
      </div>

      <SuccessModal
        isOpen={showSuccessModal}
        title="Email Verified Successfully!"
        message={`Welcome to CampusConnect${fullName ? `, ${fullName}` : ""}! Your college account (${collegeEmail}) is now verified and active.`}
        actionText="Enter Campus Feed"
        autoRedirectSeconds={3}
        onAction={() => {
          window.location.href = "/home";
        }}
      />
    </div>
  );
}
