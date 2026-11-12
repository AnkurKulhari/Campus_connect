import {
  User,
  UserProfile,
  Post,
  PaginatedPosts,
  Comment,
  PaginatedComments,
  PaginatedFollowUsers,
  PaginatedNotifications,
  PaginatedAlumni,
  PaginatedUserSearch,
  Conversation,
  DirectMessage,
} from "@/types";

const RAW_API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_BASE = RAW_API_BASE.replace(/\/+$/, "");

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
    document.cookie = `cc_token=${encodeURIComponent(token)}; path=/; max-age=2592000; SameSite=Lax`;
  }
}

export function removeToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("cc_token");
    document.cookie = "cc_token=; path=/; max-age=0; SameSite=Lax";
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // If running on a deployed website (e.g. Vercel) but NEXT_PUBLIC_API_URL was not configured
  if (
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1" &&
    API_BASE.includes("localhost")
  ) {
    throw new ApiError(
      0,
      "Backend URL not configured: NEXT_PUBLIC_API_URL is missing in Vercel environment variables. Please add NEXT_PUBLIC_API_URL with your Railway backend URL (e.g. https://xxx.up.railway.app) in Vercel Settings -> Environment Variables and redeploy."
    );
  }

  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // If body is NOT FormData, set JSON content type
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (networkError: unknown) {
    console.error(`[API Network Error] calling ${API_BASE}${endpoint}:`, networkError);
    const msg = networkError instanceof Error ? networkError.message : "Network request failed";
    throw new ApiError(
      0,
      `Unable to reach backend at ${API_BASE} (${msg}). Please verify that Railway backend is running.`
    );
  }

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
      gender?: string;
      roll_number?: string;
      course?: string;
      branch?: string;
      year?: string;
      is_year_back?: boolean;
      is_alumni?: boolean;
      id_card_url?: string;
      linkedin_url?: string;
    }) => request<{ message: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

    uploadIdCard: (file: File, fullName?: string, rollNumber?: string) => {
      const formData = new FormData();
      formData.append("file", file);
      if (fullName) {
        formData.append("full_name", fullName);
      }
      if (rollNumber) {
        formData.append("roll_number", rollNumber);
      }
      return request<{ id_card_url: string }>("/auth/upload-id-card", {
        method: "POST",
        body: formData,
      });
    },

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

    uploadIdCard: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return request<UserProfile>("/users/me/id-card", {
        method: "POST",
        body: formData,
      });
    },

    updateMeProfile: (data: {
      full_name?: string | null;
      bio?: string | null;
      profile_picture?: string | null;
      course?: string | null;
      branch?: string | null;
      year?: string | null;
      is_year_back?: boolean | null;
      linkedin_url?: string | null;
    }) =>
      request<UserProfile>("/users/me", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    getAlumniCircle: (search = "", branch = "", page = 1, pageSize = 20) => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (branch && branch !== "All") params.append("branch", branch);
      params.append("page", page.toString());
      params.append("page_size", pageSize.toString());
      return request<PaginatedAlumni>(`/users/alumni/circle?${params.toString()}`);
    },

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

    search: (q = "", role = "all", branch = "All", page = 1, pageSize = 20) => {
      const params = new URLSearchParams();
      if (q) params.append("q", q);
      if (role && role !== "all") params.append("role", role);
      if (branch && branch !== "All") params.append("branch", branch);
      params.append("page", page.toString());
      params.append("page_size", pageSize.toString());
      return request<PaginatedUserSearch>(`/users/search?${params.toString()}`);
    },

    getSuggestions: (limit = 6) =>
      request<UserProfile[]>(`/users/suggestions?limit=${limit}`),
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

  messages: {
    getUnreadCount: () =>
      request<{ unread_count: number }>("/messages/unread-count"),

    getConversations: () =>
      request<Conversation[]>("/messages/conversations"),

    getMessages: (conversationId: number, limit = 100) =>
      request<DirectMessage[]>(`/messages/conversations/${conversationId}?limit=${limit}`),

    sendMessage: (conversationId: number, content: string) =>
      request<DirectMessage>(`/messages/conversations/${conversationId}`, {
        method: "POST",
        body: JSON.stringify({ content }),
      }),

    startConversation: (username: string, message?: string) =>
      request<Conversation>(`/messages/start/${username}`, {
        method: "POST",
        body: JSON.stringify({ message }),
      }),

    blockUser: (username: string) =>
      request<{ message: string }>(`/messages/block/${username}`, {
        method: "POST",
      }),

    unblockUser: (username: string) =>
      request<{ message: string }>(`/messages/block/${username}`, {
        method: "DELETE",
      }),
  },
};
