"use client";

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return "denied";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return "denied";
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

export function showBrowserNotification(title: string, options?: {
  body?: string;
  icon?: string;
  url?: string;
}): void {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== "granted") return;

  try {
    const notification = new Notification(title, {
      body: options?.body || "New update on CampusConnect",
      icon: options?.icon || "/apple-icon.png",
      badge: "/icon.svg",
    });

    notification.onclick = () => {
      window.focus();
      if (options?.url) {
        window.location.href = options.url;
      }
      notification.close();
    };
  } catch {
    // Ignore Notification construction errors in unsupported environments
  }
}
