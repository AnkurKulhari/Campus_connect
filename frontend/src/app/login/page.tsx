"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import {
  GraduationCap,
  Loader2,
  ArrowRight,
  Sparkles,
  Lock,
  User as UserIcon,
  ShieldCheck,
  Briefcase,
  AlertTriangle,
} from "lucide-react";

export default function LoginPage() {
  const { user, login, isLoading } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/home");
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await api.auth.login(username.trim(), password);
      await login(data.access_token);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8 sm:py-12 relative overflow-hidden">
      {/* Decorative ambient gradient blooms */}
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        {/* Left Column: Campus Life Showcase (Visible on Desktop) */}
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-between space-y-8 pr-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-3.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>IPEC Campus Exclusive</span>
            </div>

            <h1 className="mt-4 text-3xl xl:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              Welcome back to your campus community.
            </h1>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              Stay in touch with what is happening around IPEC—from hackathons, technical societies, and class notes to placement rounds and alumni referrals.
            </p>

            {/* Testimonial card */}
            <div className="mt-8 p-5 rounded-3xl border border-slate-200/80 bg-white/70 backdrop-blur-xs dark:border-slate-800 dark:bg-[#131B2E]/70 shadow-xs relative">
              <p className="text-xs text-slate-700 dark:text-slate-200 italic leading-relaxed">
                “CampusConnect keeps our entire college network connected in one verified space. Finding project partners and connecting with seniors for internship tips has never been this straightforward.”
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-xs">
                  IP
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">IPEC Student Circle</h4>
                  <p className="text-[10px] text-slate-400">Computer Science & Engineering</p>
                </div>
              </div>
            </div>

            {/* Key feature pills */}
            <div className="mt-6 flex items-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>Verified Students Only</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Briefcase className="h-4 w-4 text-blue-500" />
                <span>Alumni Mentorship</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Campus feed active • Verified IPEC students & graduates</span>
          </div>
        </div>

        {/* Right Column: Sign In Card */}
        <div className="col-span-12 lg:col-span-6">
          <div className="w-full max-w-md mx-auto rounded-3xl border border-slate-200/80 bg-white/95 dark:border-slate-800 dark:bg-[#131B2E]/95 p-7 sm:p-9 shadow-xl backdrop-blur-md">
            {/* Brand Logo & Heading */}
            <div className="text-center">
              <div className="mx-auto flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
                <GraduationCap className="h-7 w-7" />
              </div>
              <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Sign In to CampusConnect
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Enter your roll number or college username
              </p>
            </div>

            {error && (
              <div className="mt-5 rounded-2xl bg-rose-50 border border-rose-200/60 p-3.5 text-xs text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/40 dark:text-rose-300 flex items-start gap-2 animate-in fade-in">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Roll Number, Username, or College Email
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. 2100300100045 or jake_gyllenhaal"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:focus:bg-slate-800 transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:focus:bg-slate-800 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.005] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 border-t border-slate-100 dark:border-slate-800/80 pt-5 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Don&apos;t have an account yet?
              </p>
              <Link
                href="/register"
                className="mt-2 inline-flex items-center justify-center gap-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:border-blue-400 transition"
              >
                <span>Create your student account</span>
                <ArrowRight className="h-3.5 w-3.5 text-blue-500" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
