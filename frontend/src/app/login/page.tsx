"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { GraduationCap, Loader2, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {/* Brand */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-md shadow-indigo-500/20">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Welcome Back to Campus
          </h1>
          <p className="mt-1 text-xs text-zinc-500">
            Sign in with your roll number or college username
          </p>
        </div>

        {error && (
          <div className="mt-5 rounded-lg bg-red-50 p-3 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Username or College Email
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. 210030010001 or john_doe"
              required
              className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Password
              </label>
              <a
                href="/forgot-password"
                className="text-xs text-indigo-600 hover:underline dark:text-indigo-400"
              >
                Forgot password?
              </a>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 transition disabled:opacity-50"
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

        <p className="mt-6 text-center text-xs text-zinc-500">
          Not registered yet?{" "}
          <a
            href="/register"
            className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Create student account
          </a>
        </p>
      </div>
    </div>
  );
}
