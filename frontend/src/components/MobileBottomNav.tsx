"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import {
  Compass,
  GraduationCap,
  MessageSquare,
  Bell,
  User as UserIcon,
} from "lucide-react";

function MobileBottomNavInner() {
  const { user } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [unreadMsgs, setUnreadMsgs] = useState<number>(0);
  const [unreadNotifs, setUnreadNotifs] = useState<number>(0);

  // Poll unread counts for messages and notifications
  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    const fetchCounts = async () => {
      try {
        const [msgRes, notifRes] = await Promise.allSettled([
          api.messages.getUnreadCount(),
          api.notifications.getUnreadCount(),
        ]);

        if (!isMounted) return;

        if (msgRes.status === "fulfilled") {
          setUnreadMsgs(msgRes.value.unread_count || 0);
        }
        if (notifRes.status === "fulfilled") {
          setUnreadNotifs(notifRes.value.unread_count || 0);
        }
      } catch {
        // Silently catch in polling loop
      }
    };

    fetchCounts();
    window.addEventListener("campusconnect-unread-update", fetchCounts);
    const interval = setInterval(fetchCounts, 45000);
    return () => {
      isMounted = false;
      window.removeEventListener("campusconnect-unread-update", fetchCounts);
      clearInterval(interval);
    };
  }, [user, pathname]);

  // If user is not logged in, do not render bottom nav
  if (!user) return null;

  // If user is on an active chat window on mobile (/messages with id or user param),
  // hide bottom nav so it doesn't obstruct the message input bar
  const isInsideActiveChat =
    pathname.startsWith("/messages") &&
    (searchParams.has("id") || searchParams.has("user"));

  if (isInsideActiveChat) return null;

  const navItems = [
    {
      label: "Feed",
      href: "/",
      icon: Compass,
      isActive: pathname === "/",
      badge: 0,
    },
    {
      label: "Alumni",
      href: "/alumni",
      icon: GraduationCap,
      isActive: pathname.startsWith("/alumni"),
      badge: 0,
    },
    {
      label: "Messages",
      href: "/messages",
      icon: MessageSquare,
      isActive: pathname.startsWith("/messages"),
      badge: unreadMsgs,
    },
    {
      label: "Alerts",
      href: "/notifications",
      icon: Bell,
      isActive: pathname.startsWith("/notifications"),
      badge: unreadNotifs,
    },
    {
      label: "Profile",
      href: `/profile/${user.username}`,
      icon: UserIcon,
      isActive: pathname.startsWith("/profile"),
      badge: 0,
      isAvatar: true,
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 shadow-lg px-2 pt-1.5 pb-[max(env(safe-area-inset-bottom),0.6rem)]"
    >
      <div className="mx-auto flex max-w-md items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`relative flex min-h-[44px] min-w-[56px] flex-col items-center justify-center rounded-2xl px-2 py-1 transition-all ${
                item.isActive
                  ? "text-blue-600 dark:text-blue-400 font-bold"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-medium"
              }`}
            >
              <div className="relative flex items-center justify-center">
                {item.isAvatar ? (
                  <div
                    className={`relative flex h-6 w-6 items-center justify-center rounded-full overflow-hidden text-[10px] font-bold text-white transition ring-2 ${
                      item.isActive
                        ? "ring-blue-600 dark:ring-blue-400 bg-blue-600"
                        : "ring-slate-300 dark:ring-slate-700 bg-blue-600"
                    }`}
                  >
                    {user.profile_picture ? (
                      <Image
                        src={user.profile_picture}
                        alt={user.username}
                        fill
                        sizes="24px"
                        className="object-cover"
                      />
                    ) : (
                      user.full_name.charAt(0).toUpperCase()
                    )}
                  </div>
                ) : (
                  <Icon
                    className={`h-5 w-5 transition-transform ${
                      item.isActive ? "scale-110" : ""
                    }`}
                  />
                )}

                {/* Badge Indicator */}
                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-extrabold text-white shadow-xs animate-in zoom-in-75">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>

              <span className="mt-1 text-[10px] leading-none tracking-tight">
                {item.label}
              </span>

              {/* Active pill dot indicator */}
              {item.isActive && (
                <span className="absolute bottom-0 h-1 w-5 rounded-full bg-blue-600 dark:bg-blue-400" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function MobileBottomNav() {
  return (
    <Suspense fallback={null}>
      <MobileBottomNavInner />
    </Suspense>
  );
}
