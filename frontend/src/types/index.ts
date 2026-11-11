export interface User {
  id: number;
  full_name: string;
  username: string;
  college_email: string;
  is_verified: boolean;
  created_at: string;
}

export interface UserProfile {
  id: number;
  username: string;
  full_name: string;
  bio: string | null;
  profile_picture: string | null;
  followers_count: number;
  following_count: number;
  posts_count: number;
  is_following: boolean;
  is_self: boolean;
  created_at?: string;
}

export interface PostMedia {
  id: number;
  cloudinary_url: string;
  media_type: string;
  order: number;
}

export interface PostAuthor {
  username: string;
  full_name: string;
  profile_picture: string | null;
}

export interface Post {
  id: number;
  content: string | null;
  media: PostMedia[];
  author: PostAuthor;
  like_count: number;
  comment_count: number;
  is_liked_by_me: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaginatedPosts {
  posts: Post[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

export interface CommentAuthor {
  username: string;
  full_name: string;
  profile_picture: string | null;
}

export interface Comment {
  id: number;
  content: string;
  author: CommentAuthor;
  post_id: number;
  created_at: string;
  updated_at: string;
}

export interface PaginatedComments {
  comments: Comment[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

export interface FollowUser {
  id: number;
  username: string;
  full_name: string;
  profile_picture: string | null;
  bio: string | null;
  is_following: boolean;
  is_self: boolean;
}

export interface PaginatedFollowUsers {
  users: FollowUser[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

export interface NotificationSender {
  username: string;
  full_name: string;
  profile_picture: string | null;
}

export interface Notification {
  id: number;
  type: "like" | "comment" | "follow";
  sender: NotificationSender;
  post_id: number | null;
  comment_id: number | null;
  message: string | null;
  is_read: boolean;
  created_at: string;
}

export interface PaginatedNotifications {
  notifications: Notification[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
}
