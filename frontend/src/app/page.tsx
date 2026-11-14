"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LandingPage } from "@/components/LandingPage";
import { Loader2 } from "lucide-react";

export default function RootPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/home");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-xs border border-blue-200/50 dark:border-blue-800/40">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Loading CampusConnect...
        </p>
      </div>
    );
  }

  // If already logged in, show forwarding state while redirecting to /home
  if (user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-xs border border-blue-200/50 dark:border-blue-800/40">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Entering campus timeline...
        </p>
      </div>
    );
  }

  // Unauthenticated visitors see the public Landing Page
  return <LandingPage />;
}
