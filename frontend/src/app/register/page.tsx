"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
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
} from "lucide-react";
import { LinkedinIcon } from "@/components/icons/LinkedinIcon";
import { SuccessModal } from "@/components/SuccessModal";

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

export default function RegisterPage() {
  const [step, setStep] = useState<"form" | "otp">("form");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [collegeEmail, setCollegeEmail] = useState("");
  const [password, setPassword] = useState("");

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

  const handleIdCardSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    if (file.size > 10 * 1024 * 1024) {
      setError("ID card image must be smaller than 10MB.");
      return;
    }
    setIdCardFile(file);
    setIdCardPreview(URL.createObjectURL(file));
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
      setError("College email must end with @ipec.org.in (e.g. 210030010001@ipec.org.in)");
      setLoading(false);
      return;
    }

    const localPart = email.split("@")[0];
    if (!/^\d+$/.test(localPart)) {
      setError("College email must start with your numeric roll number (e.g. 210030010001@ipec.org.in)");
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

    try {
      let uploadedIdCardUrl: string | undefined = undefined;
      // 1. Upload ID card if provided
      if (idCardFile) {
        const uploadRes = await api.auth.uploadIdCard(idCardFile);
        uploadedIdCardUrl = uploadRes.id_card_url;
      }

      const isAlumni = year.startsWith("Alumni");

      const res = await api.auth.register({
        full_name: fullName.trim(),
        username: username.trim(),
        college_email: collegeEmail.trim(),
        password,
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
      await api.auth.verifyEmail({
        college_email: collegeEmail.trim(),
        otp: otp.trim(),
      });
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
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4 py-8">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/20">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {step === "form" ? "Join CampusConnect" : "Verify College Email"}
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {step === "form"
              ? "Exclusively for Inderprastha Engineering College students & alumni"
              : `We sent a 6-digit code to ${collegeEmail}`}
          </p>
        </div>

        {error && (
          <div className="mt-5 rounded-lg bg-red-50 p-3 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </div>
        )}

        {successMsg && !error && (
          <div className="mt-5 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-xs text-green-700 dark:bg-green-950/40 dark:text-green-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {step === "form" ? (
          <form onSubmit={handleRegister} className="mt-6 space-y-4">
            {/* Account Credentials */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ankur Kumar"
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. ankur_k"
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  College Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={collegeEmail}
                  onChange={handleEmailChange}
                  placeholder="2300300100032@ipec.org.in"
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Must end with @ipec.org.in
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 chars"
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Academic Standing */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5 mb-2">
                <GraduationCap className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Academic Standing
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Course <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {COURSE_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Branch <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {BRANCH_OPTIONS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Year / Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {YEAR_OPTIONS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* University Roll Number & Student ID Verification */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5 mb-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Student Verification
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  13-Digit University Roll Number
                </label>
                <input
                  type="text"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="e.g. 2300300100032"
                  maxLength={13}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-mono text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Your official 13-digit AKTU roll number printed on your college ID enables instant automated badge verification.
                </p>
              </div>

              {/* College ID Card Upload */}
              <div className="mt-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  College ID Card Photo
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleIdCardSelect}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />

                {idCardPreview ? (
                  <div className="relative mt-1 aspect-video w-full max-w-xs rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <Image
                      src={idCardPreview}
                      alt="College ID Preview"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeIdCard}
                      className="absolute top-2 right-2 rounded-full bg-black/70 p-1.5 text-white hover:bg-black transition"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-4 text-xs font-medium text-slate-600 dark:text-slate-400 hover:border-blue-500 hover:text-blue-600 transition bg-slate-50/50 dark:bg-slate-800/30"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Upload College ID Card (JPEG, PNG, max 10MB)</span>
                  </button>
                )}
                <p className="mt-1 text-[11px] text-slate-400">
                  Used exclusively to verify your student standing. Special cases (lateral entry, branch change) are verified manually.
                </p>
              </div>
            </div>

            {/* Year-Back Declaration & Warning */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 dark:border-amber-900/40 dark:bg-amber-950/20">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isYearBack}
                  onChange={(e) => setIsYearBack(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-amber-300 text-blue-600 focus:ring-blue-500 dark:border-amber-800"
                />
                <div>
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    I have an Academic Year-Back / Extended Course
                  </span>
                  <div className="mt-1 flex items-start gap-1.5 text-[11px] text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <span>
                      <strong>Important Notice:</strong> If you have an academic year back and do not select this option, your student access will automatically expire based on your original batch timeline. Selecting this ensures your account remains active for your full extended course duration. We send a standing re-verification every 6 months to keep your account active.
                    </span>
                  </div>
                </div>
              </label>
            </div>

            {/* LinkedIn URL (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                LinkedIn Profile URL <span className="text-slate-400 font-normal">(Optional — for networking)</span>
              </label>
              <div className="relative">
                <LinkedinIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Submitting & Sending OTP...</span>
                </>
              ) : (
                <>
                  <span>Create Account & Verify</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                maxLength={6}
                required
                className="w-full text-center tracking-widest text-lg font-mono rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <p className="mt-1 text-[11px] text-slate-400 text-center">
                OTP expires in 10 minutes. Max 5 attempts.
              </p>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={otp.length !== 6 || loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Complete Registration</span>
              )}
            </button>

            <div className="flex items-center justify-between pt-2 text-xs">
              <button
                type="button"
                onClick={() => setStep("form")}
                className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              >
                ← Edit details
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || loading}
                className="inline-flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400 disabled:opacity-40"
              >
                <RotateCw className="h-3 w-3" />
                <span>
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
                </span>
              </button>
            </div>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-slate-500">
          Already verified?{" "}
          <a
            href="/login"
            className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
          >
            Sign in
          </a>
        </p>
      </div>

      <SuccessModal
        isOpen={showSuccessModal}
        title="Email Verified Successfully!"
        message={`Welcome to CampusConnect${fullName ? `, ${fullName}` : ""}! Your college account (${collegeEmail}) is now verified and active.`}
        actionText="Proceed to Sign In"
        autoRedirectSeconds={4}
        onAction={() => {
          window.location.href = "/login";
        }}
      />
    </div>
  );
}
