import axios from 'axios';
import type {
  User, Project, Claim, ProjectMember, Token, AIConfig,
  AnalyticsOverview, ProjectBreakdown, TopSubmitter,
  DashboardSummary, AuditLog
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post<Token>('/auth/login', { email, password }),
  register: (data: { name: string; email: string; password: string; department?: string }) =>
    api.post<User>('/auth/register', data),
  getMe: () => api.get<User>('/auth/me'),
};

// Users API
export const usersAPI = {
  list: () => api.get<User[]>('/users'),
  get: (id: number) => api.get<User>(`/users/${id}`),
  create: (data: { name: string; email: string; password: string; department?: string; role?: string }) =>
    api.post<User>('/users', data),
  update: (id: number, data: { name?: string; department?: string }) =>
    api.put<User>(`/users/${id}`, data),
  updateStatus: (id: number, status: string) =>
    api.patch<User>(`/users/${id}/status`, { status }),
  updateRole: (id: number, role: string) =>
    api.patch<User>(`/users/${id}/role`, { role }),
  updatePassword: (id: number, password: string) =>
    api.post(`/users/${id}/password`, { password }),
  delete: (id: number) => api.delete(`/users/${id}`),
};

// Projects API
export const projectsAPI = {
  list: (params?: { status?: string; search?: string }) =>
    api.get<Project[]>('/projects', { params }),
  get: (id: number) => api.get<Project>(`/projects/${id}`),
  create: (data: {
    name: string;
    description?: string;
    start_date: string;
    end_date?: string;
    budget_limit?: number | null;
  }) => api.post<Project>('/projects', data),
  update: (id: number, data: {
    name?: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    budget_limit?: number | null;
    status?: string;
  }) => api.put<Project>(`/projects/${id}`, data),
  delete: (id: number) => api.delete(`/projects/${id}`),
  getMembers: (id: number) => api.get<ProjectMember[]>(`/projects/${id}/members`),
  addMember: (id: number, user_id: number) =>
    api.post<ProjectMember>(`/projects/${id}/members`, { user_id }),
  removeMember: (id: number, user_id: number) =>
    api.delete(`/projects/${id}/members/${user_id}`),
  getMyClaims: (id: number) => api.get<Claim[]>(`/projects/${id}/my-claims`),
};

// Claims API
export const claimsAPI = {
  list: (params?: {
    project_id?: number;
    status?: string;
    user_id?: number;
    start_date?: string;
    end_date?: string;
    category?: string;
  }) => api.get<Claim[]>('/claims', { params }),
  get: (id: number) => api.get<Claim>(`/claims/${id}`),
  create: (data: {
    project_id: number;
    merchant_name: string;
    transaction_date: string;
    amount: number;
    category: string;
    description?: string;
    receipt_number?: string;
    receipt_image_path?: string;
  }) => api.post<Claim>('/claims', data),
  update: (id: number, data: {
    merchant_name?: string;
    transaction_date?: string;
    amount?: number;
    category?: string;
    description?: string;
    receipt_number?: string;
  }) => api.put<Claim>(`/claims/${id}`, data),
  updateStatus: (id: number, data: { status: string; notes?: string }) =>
    api.patch<Claim>(`/claims/${id}/status`, data),
  submit: (id: number) => api.post<Claim>(`/claims/${id}/submit`),
};

// Analytics API
export const analyticsAPI = {
  getOverview: (params?: { period?: string; project_id?: number }) =>
    api.get<AnalyticsOverview>('/analytics/overview', { params }),
  getProjectBreakdown: (params?: { period?: string }) =>
    api.get<ProjectBreakdown[]>('/analytics/by-project', { params }),
  getTopSubmitters: (params?: { period?: string; limit?: number }) =>
    api.get<TopSubmitter[]>('/analytics/top-submitters', { params }),
  getAuditLogs: (params?: { limit?: number }) =>
    api.get<AuditLog[]>('/analytics/audit-logs', { params }),
  getDashboard: () => api.get<DashboardSummary>('/analytics/dashboard'),
  exportCSV: (params?: { period?: string; project_id?: string; status?: string }) =>
    api.get('/analytics/export/csv', { params, responseType: 'blob' }),
};

// AI Config API
export const aiConfigAPI = {
  get: () => api.get<AIConfig>('/ai-config'),
  update: (data: { base_url?: string; model_name?: string; api_key?: string; ocr_enabled?: boolean }) =>
    api.put<AIConfig>('/ai-config', data),
  test: () => api.post<{ success: boolean; message: string; latency_ms?: number }>('/ai-config/test'),
  extract: (image_base64: string) =>
    api.post<{ success: boolean; data?: any; error?: string }>('/ai-config/extract', null, {
      params: { image_base64 },
    }),
  getOcrSetting: () => api.get<{ ocr_enabled: boolean }>('/ai-config/ocr-setting'),
};

// Upload API
export const uploadAPI = {
  uploadReceipt: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{ filename: string; path: string }>('/upload/receipt', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Database API
export const databaseAPI = {
  createBackup: () => api.post<{ success: boolean; message: string; filename: string }>('/database/backup'),
  listBackups: () => api.get<{ backups: Array<{ filename: string; size: number; created_at: string }> }>('/database/backups'),
  downloadBackup: (filename: string) =>
    api.get(`/database/backups/${filename}`, { responseType: 'blob' }),
  restoreBackup: (filename: string) => api.post<{ success: boolean; message: string }>(`/database/restore/${filename}`),
  deleteBackup: (filename: string) => api.delete(`/database/backups/${filename}`),
};

// Departments API
export const departmentsAPI = {
  list: () => api.get<import('./types').Department[]>('/departments'),
  get: (id: number) => api.get<import('./types').Department>(`/departments/${id}`),
  create: (data: { name: string; description?: string }) =>
    api.post<import('./types').Department>('/departments', data),
  update: (id: number, data: { name?: string; description?: string }) =>
    api.put<import('./types').Department>(`/departments/${id}`, data),
  delete: (id: number) => api.delete(`/departments/${id}`),
};

export default api;
