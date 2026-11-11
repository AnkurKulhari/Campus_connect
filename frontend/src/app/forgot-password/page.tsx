"use client";

import React, { useState } from "react";
import { api } from "@/lib/api";
import { GraduationCap, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "reset">("email");
  const [collegeEmail, setCollegeEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.auth.forgotPassword(collegeEmail.trim());
      setSuccessMsg(res.message);
      setStep("reset");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send reset code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.auth.resetPassword({
        college_email: collegeEmail.trim(),
        otp: otp.trim(),
        new_password: newPassword,
      });
      alert("Password has been reset successfully! You can now log in.");
      window.location.href = "/login";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Reset failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-md shadow-indigo-500/20">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {step === "email" ? "Reset Campus Password" : "Set New Password"}
          </h1>
          <p className="mt-1 text-xs text-zinc-500">
            {step === "email"
              ? "Enter your registered @ipec.org.in email"
              : `Enter the 6-digit OTP sent to ${collegeEmail}`}
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

        {step === "email" ? (
          <form onSubmit={handleRequestOtp} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                College Email
              </label>
              <input
                type="email"
                value={collegeEmail}
                onChange={(e) => setCollegeEmail(e.target.value)}
                placeholder="210030010001@ipec.org.in"
                required
                className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Sending reset code...</span>
                </>
              ) : (
                <>
                  <span>Send Reset OTP</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                6-Digit Reset Code
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                maxLength={6}
                required
                className="w-full text-center tracking-widest text-lg font-mono rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 chars, 1 uppercase, 1 number, 1 symbol"
                required
                className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={otp.length !== 6 || loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-zinc-500">
          Remember your password?{" "}
          <a
            href="/login"
            className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Back to login
          </a>
        </p>
      </div>
    </div>
  );
}
