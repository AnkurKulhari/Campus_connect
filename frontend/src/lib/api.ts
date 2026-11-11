import {
  User,
  UserProfile,
  Post,
  PaginatedPosts,
  Comment,
  PaginatedComments,
  PaginatedFollowUsers,
  PaginatedNotifications,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
    this.detail = detail;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("cc_token");
}

export function setToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("cc_token", token);
  }
}

export function removeToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("cc_token");
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // If body is NOT FormData, set JSON content type
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let detail = "Something went wrong.";
    try {
      const errorData = await response.json();
      if (typeof errorData.detail === "string") {
        detail = errorData.detail;
      } else if (Array.isArray(errorData.detail)) {
        detail = errorData.detail.map((e: { msg?: string }) => e.msg).join(", ");
      }
    } catch {
      detail = response.statusText;
    }

    if (response.status === 401 && typeof window !== "undefined") {
      removeToken();
    }

    throw new ApiError(response.status, detail);
  }

  return response.json();
}

export const api = {
  auth: {
    register: (data: {
      full_name: string;
      college_email: string;
      username: string;
      password: string;
    }) => request<{ message: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

    verifyEmail: (data: { college_email: string; otp: string }) =>
      request<{ message: string }>("/auth/verify-email", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    resendOtp: (college_email: string) =>
      request<{ message: string }>("/auth/resend-otp", {
        method: "POST",
        body: JSON.stringify({ college_email }),
      }),

    login: async (username: string, password: string) => {
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);

      return request<{ access_token: string; token_type: string }>("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });
    },

    getMe: () => request<User>("/auth/me"),

    forgotPassword: (college_email: string) =>
      request<{ message: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ college_email }),
      }),

    resetPassword: (data: { college_email: string; otp: string; new_password: string }) =>
      request<{ message: string }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    changePassword: (data: { current_password: string; new_password: string }) =>
      request<{ message: string }>("/auth/change-password", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  posts: {
    create: (content: string | null, files: File[] = []) => {
      const formData = new FormData();
      if (content) formData.append("content", content);
      files.forEach((file) => formData.append("files", file));

      return request<Post>("/posts/", {
        method: "POST",
        body: formData,
      });
    },

    getFeed: (page = 1, pageSize = 20) =>
      request<PaginatedPosts>(`/posts/feed?page=${page}&page_size=${pageSize}`),

    getFollowingFeed: (page = 1, pageSize = 20) =>
      request<PaginatedPosts>(`/posts/following?page=${page}&page_size=${pageSize}`),

    getUserPosts: (username: string, page = 1, pageSize = 20) =>
      request<PaginatedPosts>(
        `/posts/user/${username}?page=${page}&page_size=${pageSize}`
      ),

    getPost: (postId: number) => request<Post>(`/posts/${postId}`),

    updatePost: (postId: number, content: string | null) =>
      request<Post>(`/posts/${postId}`, {
        method: "PATCH",
        body: JSON.stringify({ content }),
      }),

    deletePost: (postId: number) =>
      request<{ message: string }>(`/posts/${postId}`, {
        method: "DELETE",
      }),

    reportPost: (postId: number, reason: string, details?: string) =>
      request<{ message: string; reported: boolean; is_quarantined: boolean }>(
        `/posts/${postId}/report`,
        {
          method: "POST",
          body: JSON.stringify({ reason, details: details || null }),
        }
      ),
  },

  likes: {
    toggle: (postId: number) =>
      request<{ message: string; liked: boolean; like_count: number }>(
        `/posts/${postId}/like`,
        { method: "POST" }
      ),
  },

  comments: {
    create: (postId: number, content: string) =>
      request<Comment>(`/posts/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content }),
      }),

    list: (postId: number, page = 1, pageSize = 20) =>
      request<PaginatedComments>(
        `/posts/${postId}/comments?page=${page}&page_size=${pageSize}`
      ),

    update: (commentId: number, content: string) =>
      request<Comment>(`/comments/${commentId}`, {
        method: "PATCH",
        body: JSON.stringify({ content }),
      }),

    delete: (commentId: number) =>
      request<{ message: string }>(`/comments/${commentId}`, {
        method: "DELETE",
      }),
  },

  users: {
    getMeProfile: () => request<UserProfile>("/users/me"),

    uploadAvatar: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return request<UserProfile>("/users/me/avatar", {
        method: "POST",
        body: formData,
      });
    },

    updateMeProfile: (data: {
      full_name?: string | null;
      bio?: string | null;
      profile_picture?: string | null;
    }) =>
      request<UserProfile>("/users/me", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    getProfile: (username: string) =>
      request<UserProfile>(`/users/${username}`),

    toggleFollow: (username: string) =>
      request<{ message: string; is_following: boolean; followers_count: number }>(
        `/users/${username}/follow`,
        { method: "POST" }
      ),

    getFollowers: (username: string, page = 1, pageSize = 20) =>
      request<PaginatedFollowUsers>(
        `/users/${username}/followers?page=${page}&page_size=${pageSize}`
      ),

    getFollowing: (username: string, page = 1, pageSize = 20) =>
      request<PaginatedFollowUsers>(
        `/users/${username}/following?page=${page}&page_size=${pageSize}`
      ),
  },

  notifications: {
    list: (page = 1, pageSize = 20) =>
      request<PaginatedNotifications>(
        `/notifications/?page=${page}&page_size=${pageSize}`
      ),

    getUnreadCount: () =>
      request<{ unread_count: number }>("/notifications/unread-count"),

    markRead: (notificationId: number) =>
      request<{ message: string }>(`/notifications/${notificationId}/read`, {
        method: "PATCH",
      }),

    markAllRead: () =>
      request<{ message: string }>("/notifications/read-all", {
        method: "PATCH",
      }),
  },
};
