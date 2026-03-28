import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Only redirect if not already on auth pages
        const currentPath = window.location.pathname;
        if (!currentPath.startsWith('/login') && !currentPath.startsWith('/register')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Typed API helpers
export const authApi = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  register: (data: { name: string; email: string; password: string }) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const usersApi = {
  list: (params?: Record<string, unknown>) => api.get('/users', { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  update: (id: string, data: object) => api.put(`/users/${id}`, data),
  ban: (id: string, reason?: string) => api.delete(`/users/${id}`, { data: { reason } }),
  setLevel: (id: string, level: string) => api.put(`/users/${id}/level`, { level }),
  getActivity: (id: string) => api.get(`/users/${id}/activity`),
};

export const contentApi = {
  list: (params?: Record<string, unknown>) => api.get('/content', { params }),
  getById: (id: string) => api.get(`/content/${id}`),
  create: (data: object) => api.post('/content', data),
  update: (id: string, data: object) => api.put(`/content/${id}`, data),
  remove: (id: string) => api.delete(`/content/${id}`),
  download: (id: string) => api.post(`/content/${id}/download`),
  upload: (formData: FormData) =>
    api.post('/content/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  uploadImage: (formData: FormData) =>
    api.post('/content/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getReviews: (id: string) => api.get(`/content/${id}/reviews`),
  createReview: (id: string, data: { rating: number; comment: string }) =>
    api.post(`/content/${id}/reviews`, data),
  deleteReview: (contentId: string, reviewId: string) =>
    api.delete(`/content/${contentId}/reviews/${reviewId}`),
};

export const categoriesApi = {
  list: () => api.get('/categories'),
  getBySlug: (slug: string) => api.get(`/categories/${slug}`),
  create: (data: object) => api.post('/categories', data),
  update: (id: string, data: object) => api.put(`/categories/${id}`, data),
  remove: (id: string) => api.delete(`/categories/${id}`),
};

export const subscriptionsApi = {
  plans: () => api.get('/subscriptions/plans'),
  my: () => api.get('/subscriptions/my'),
  checkout: (data: { plan: string; gateway?: string }) => api.post('/subscriptions/checkout', data),
  webhook: (data: Record<string, unknown>) => api.post('/subscriptions/webhook', data),
  activateManual: (data: { userId: string; plan: string; days?: number }) =>
    api.post('/subscriptions/activate-manual', data),
};

export const communityApi = {
  posts: (params?: Record<string, unknown>) => api.get('/community/posts', { params }),
  getPost: (id: string) => api.get(`/community/posts/${id}`),
  createPost: (data: { title: string; content: string; category?: string }) =>
    api.post('/community/posts', data),
  updatePost: (id: string, data: object) => api.put(`/community/posts/${id}`, data),
  deletePost: (id: string) => api.delete(`/community/posts/${id}`),
  likePost: (id: string) => api.post(`/community/posts/${id}/like`),
  pinPost: (id: string) => api.post(`/community/posts/${id}/pin`),
  getComments: (postId: string) => api.get(`/community/posts/${postId}/comments`),
  addComment: (postId: string, content: string) =>
    api.post(`/community/posts/${postId}/comments`, { content }),
  deleteComment: (id: string) => api.delete(`/community/comments/${id}`),
  likeComment: (id: string) => api.post(`/community/comments/${id}/like`),
};

export const dropsApi = {
  list: () => api.get('/drops'),
  getById: (id: string) => api.get(`/drops/${id}`),
  create: (data: object) => api.post('/drops', data),
  update: (id: string, data: object) => api.put(`/drops/${id}`, data),
  remove: (id: string) => api.delete(`/drops/${id}`),
};

export const adminApi = {
  dashboard: () => api.get('/admin/dashboard'),
  users: (params?: Record<string, unknown>) => api.get('/admin/users', { params }),
  subscriptions: (params?: Record<string, unknown>) => api.get('/admin/subscriptions', { params }),
  logs: (params?: Record<string, unknown>) => api.get('/admin/logs', { params }),
  revenue: () => api.get('/admin/revenue'),
};

export const notificationsApi = {
  list: () => api.get('/notifications'),
  markRead: (id: string) => api.post(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

export const favoritesApi = {
  ids: () => api.get('/users/me/favorites/ids'),
  list: () => api.get('/users/me/favorites'),
  add: (contentId: string) => api.post(`/users/me/favorites/${contentId}`),
  remove: (contentId: string) => api.delete(`/users/me/favorites/${contentId}`),
};

export const downloadsApi = {
  history: () => api.get('/users/me/downloads'),
};

export const profileApi = {
  update: (data: object) => api.put('/users/me/profile', data),
  publicProfile: (userId: string) => api.get(`/users/${userId}/public`),
};

export const adminExtApi = {
  sendNotification: (data: object) => api.post('/admin/notify', data),
  exportUsers: () => api.get('/admin/export/users', { responseType: 'blob' }),
  coupons: () => api.get('/admin/coupons'),
  createCoupon: (data: object) => api.post('/admin/coupons', data),
  deleteCoupon: (id: string) => api.delete(`/admin/coupons/${id}`),
  growth: () => api.get('/admin/stats/growth'),
};

export const searchApi = {
  search: (params: Record<string, unknown>) => api.get('/search', { params }),
};
