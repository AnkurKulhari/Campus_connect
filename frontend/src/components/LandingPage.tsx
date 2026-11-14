"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  GraduationCap,
  Users,
  MessageSquare,
  Sparkles,
  Lock,
  ArrowRight,
  CheckCircle2,
  School,
  Flame,
  FileText,
  Briefcase,
  KeyRound,
  ShieldAlert,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

export function LandingPage() {
  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 overflow-x-hidden selection:bg-blue-600 selection:text-white">
      {/* Background Decorative Campus Glows (Deep Navy & Campus Blue - No Purple Slop) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] rounded-full bg-blue-600/10 dark:bg-blue-600/15 blur-[120px]" />
        <div className="absolute top-20 right-1/4 w-[400px] h-[400px] rounded-full bg-sky-500/10 dark:bg-sky-500/10 blur-[100px]" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 px-4 sm:px-6 max-w-6xl mx-auto text-center">
        {/* Campus Exclusive Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-50/80 px-3.5 py-1.5 text-xs font-bold text-blue-700 backdrop-blur-md dark:border-blue-500/20 dark:bg-blue-950/50 dark:text-blue-300 shadow-2xs mb-6 sm:mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <School className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          <span>Inderprastha Engineering College Exclusive</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-[1.15] sm:leading-[1.12]">
          The Private Social Network for{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-500 dark:from-blue-400 dark:to-sky-300">
            IPEC Students & Alumni
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-5 sm:mt-6 text-sm sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
          Connect exclusively with verified batchmates, access semester notes, get placement referrals from senior alumni, and discuss campus life — with zero outsiders.
        </p>

        {/* Primary Call to Action Buttons */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto">
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-7 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 active:scale-[0.98] transition min-h-[48px]"
          >
            <span>Sign In to Campus</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 px-7 py-3.5 text-sm font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-[0.98] transition min-h-[48px] shadow-xs"
          >
            <span>Register with Roll No.</span>
          </Link>
        </div>

        {/* Trust & Assurance Bar */}
        <div className="mt-12 sm:mt-16 pt-8 border-t border-slate-200/80 dark:border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 text-left">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-white/60 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 shadow-2xs">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">AKTU Roll No.</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Verified enrollment</div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-white/60 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 shadow-2xs">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">Alumni Circle</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Mentors & referrals</div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-white/60 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 shadow-2xs">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">Direct Messaging</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Private campus DMs</div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-white/60 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 shadow-2xs">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">No Outsiders</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Strict @ipec.org.in wall</div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive App Mockup Showcase */}
      <section className="px-4 sm:px-6 max-w-5xl mx-auto pb-16 sm:pb-24">
        <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131B2E] p-4 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-black/40">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Live Campus Environment</span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                Designed specifically for IPEC student life
              </h2>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              <span>Explore full experience</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Sample Timeline Preview Card */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Timeline Mock */}
            <div className="md:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-extrabold text-sm shadow-xs">
                  P
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">Priya Sharma</span>
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-[10px] text-slate-400">@priya_sharma</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                    <span className="rounded-full bg-blue-100 dark:bg-blue-950 px-2 py-0.2 text-blue-700 dark:text-blue-300 font-semibold">
                      3rd Year • CSE
                    </span>
                    <span>Just now</span>
                  </div>
                </div>
              </div>

              <p className="mt-3 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
                Excited to announce our team won 1st place at HackIPEC 2026! Huge thanks to our 4th year seniors for mentoring us on system architecture. 🎉
              </p>

              <div className="mt-3 flex items-center gap-2">
                <span className="rounded-lg bg-blue-50 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                  #Hackathon
                </span>
                <span className="rounded-lg bg-blue-50 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                  #Placements2026
                </span>
              </div>
            </div>

            {/* Alumni Mentorship Mock */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-4 sm:p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                  <GraduationCap className="h-4 w-4" />
                  <span>Alumni Spotlight</span>
                </div>
                <div className="font-bold text-xs text-slate-900 dark:text-white">Ankur Kulhari</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Software Engineer @ Tech</div>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                  "Open to reviewing resumes and providing referrals for 2026 batch CSE & IT students."
                </p>
              </div>

              <Link
                href="/login"
                className="mt-4 w-full text-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 shadow-xs transition"
              >
                Connect in Alumni Circle
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Deep Dive (Anti-Slop Grid) */}
      <section className="px-4 sm:px-6 max-w-6xl mx-auto pb-16 sm:pb-24">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">
            Why CampusConnect
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Built from the ground up for our college campus
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131B2E] p-6 sm:p-7 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mb-5">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">
                Roll Number & ID Card OCR
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                Every account requires an authentic 13-digit AKTU roll number matching IPEC code <code className="font-mono text-blue-600 dark:text-blue-400">0030</code>, combined with automated OCR card scanning to eliminate fake accounts.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              <span>Zero external spam or impersonation</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131B2E] p-6 sm:p-7 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mb-5">
                <GraduationCap className="h-6 w-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">
                Alumni Circle & Mentorship
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                Bridge the gap between current students and graduated seniors. Get direct career advice, off-campus drive referrals, and interview preparation tips from those who walked the halls before you.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <Briefcase className="h-4 w-4" />
              <span>Direct career referrals</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131B2E] p-6 sm:p-7 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 mb-5">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">
                Fast, Safe Direct Messaging
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                Real-time 1-on-1 private messaging with clustered bubbles, auto-expanding multi-line text input, unsend safety dialogs, and real-time audio notifications across desktop and mobile.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-[11px] font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
              <Lock className="h-4 w-4" />
              <span>End-to-end user isolation</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Verification Onboarding Section */}
      <section className="px-4 sm:px-6 max-w-5xl mx-auto pb-16 sm:pb-24">
        <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131B2E] p-6 sm:p-10 shadow-xs">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Verification Protocol
            </span>
            <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              How students get inside the campus wall
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="flex flex-col items-center text-center p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-extrabold text-sm text-white mb-4 shadow-sm">
                1
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                Enter IPEC Roll Number
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Provide your official 13-digit university roll number (<code className="font-mono text-xs">...0030...</code>).
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-extrabold text-sm text-white mb-4 shadow-sm">
                2
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                Upload College ID Card
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Our automated OCR engine verifies your name and student card securely in temporary memory.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-extrabold text-sm text-white mb-4 shadow-sm">
                3
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                Verify Email OTP
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Confirm your 6-digit one-time code sent to your official college inbox to unlock the timeline.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action Section */}
      <section className="px-4 sm:px-6 max-w-4xl mx-auto pb-20 text-center">
        <div className="rounded-3xl bg-gradient-to-b from-blue-600 to-blue-700 p-8 sm:p-12 text-white shadow-xl shadow-blue-600/20">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Ready to connect with your campus?
          </h2>
          <p className="mt-3 text-xs sm:text-base text-blue-100 max-w-lg mx-auto leading-relaxed font-normal">
            Join hundreds of verified IPEC batchmates, professors, and alumni already sharing notes, placement tips, and campus news.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-sm mx-auto">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-white text-blue-600 px-7 py-3.5 text-sm font-extrabold shadow-md hover:bg-blue-50 active:scale-[0.98] transition min-h-[48px]"
            >
              <span>Sign In with College Email</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-white/30 bg-blue-700/60 px-6 py-3.5 text-sm font-bold text-white hover:bg-blue-700 transition min-h-[48px]"
            >
              <span>Create Account</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 py-10 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs">
              C
            </div>
            <span className="font-bold text-slate-900 dark:text-slate-200">CampusConnect</span>
            <span>• Inderprastha Engineering College</span>
          </div>

          <div className="flex items-center gap-5 font-medium">
            <Link href="/login" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
              Sign In
            </Link>
            <Link href="/register" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
              Register
            </Link>
            <Link href="/forgot-password" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
              Password Reset
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
