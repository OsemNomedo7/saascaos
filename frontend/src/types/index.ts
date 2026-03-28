export type UserRole = 'user' | 'admin';
export type UserLevel = 'iniciante' | 'intermediario' | 'avancado' | 'elite';
export type SubscriptionPlan = 'weekly' | 'monthly' | 'lifetime';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'pending';
export type ContentType = 'programa' | 'database' | 'material' | 'esquema' | 'video' | 'outro';
export type Gateway = 'stripe' | 'mercadopago' | 'manual';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  level: UserLevel;
  avatar: string | null;
  isActive: boolean;
  isBanned: boolean;
  banReason?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  bio?: string;
  bannerUrl?: string | null;
  xp?: number;
  socialLinks?: {
    twitter?: string;
    github?: string;
    instagram?: string;
    website?: string;
  };
  achievements?: string[];
}

export interface Subscription {
  _id: string;
  user: string | User;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: string | null;
  endDate: string | null;
  paymentId: string | null;
  gateway: Gateway;
  amount: number;
  currency: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  isActive: boolean;
  order: number;
  createdBy: string | User;
  createdAt: string;
}

export interface Content {
  _id: string;
  title: string;
  description: string;
  category: string | Category;
  type: ContentType;
  minLevel: UserLevel;
  fileUrl: string | null;
  fileKey: string | null;
  fileSize: number;
  mimeType: string | null;
  externalLink: string | null;
  tags: string[];
  views: number;
  downloads: number;
  createdBy: string | User;
  isActive: boolean;
  isDrop: boolean;
  dropExpiresAt: string | null;
  isFree: boolean;
  thumbnail: string | null;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  _id: string;
  content: string;
  user: string | User;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewStats {
  total: number;
  avgRating: number;
  distribution: { star: number; count: number }[];
}

export interface Post {
  _id: string;
  title: string;
  content: string;
  author: string | User;
  category: string | Category | null;
  likes: string[];
  isPinned: boolean;
  isActive: boolean;
  views: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  content: string;
  author: string | User;
  post: string;
  likes: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  content: string;
  author: string | User;
  room: string;
  type: 'text' | 'system';
  createdAt: string;
}

export interface Drop extends Content {
  isDrop: true;
  dropExpiresAt: string;
}

export interface Log {
  _id: string;
  user: string | User | null;
  action: 'login' | 'logout' | 'download' | 'access' | 'register' | 'ban' | 'unban' | 'upload' | 'delete' | 'subscribe';
  resourceId: string | null;
  resourceType: string | null;
  ip: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ApiResponse<T> {
  message?: string;
  data?: T;
}

export interface Plan {
  name: string;
  price: number;
  duration: number | null;
  currency: string;
}

export interface Plans {
  weekly: Plan;
  monthly: Plan;
  lifetime: Plan;
}

export interface Notification {
  _id: string;
  user: string;
  type: 'content' | 'drop' | 'system' | 'achievement' | 'subscription';
  title: string;
  message: string;
  isRead: boolean;
  link: string | null;
  relatedId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Favorite {
  _id: string;
  user: string;
  content: Content;
  createdAt: string;
}

export interface Coupon {
  _id: string;
  code: string;
  description: string;
  discountPercent: number;
  planRestriction: 'weekly' | 'monthly' | 'lifetime' | 'all';
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdBy: string | User;
  createdAt: string;
}
