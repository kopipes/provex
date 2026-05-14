// Types for ReimburseEasy

export type UserRole = 'user' | 'manager' | 'admin';
export type UserStatus = 'pending' | 'active' | 'inactive';
export type ClaimStatus = 'draft' | 'submitted' | 'revision' | 'approved' | 'rejected';
export type ProjectStatus = 'active' | 'archived';

export interface Category {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  department?: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
}

export interface Department {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at?: string;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  budget_limit?: number | null;
  status: ProjectStatus;
  created_by?: number;
  created_at: string;
  member_count: number;
  total_claims: number;
}

export interface Claim {
  id: number;
  user_id: number;
  user_name?: string;
  project_id: number;
  project_name?: string;
  receipt_image_path?: string;
  merchant_name: string;
  transaction_date: string;
  amount: number;
  category: string;
  description?: string;
  receipt_number?: string;
  status: ClaimStatus;
  ai_extracted: boolean;
  notes?: string;
  reviewed_by?: number;
  reviewer_name?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  department?: string;
  assigned_at: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface AIConfig {
  base_url?: string;
  model_name?: string;
  has_api_key: boolean;
  ocr_enabled: boolean;
}

export interface AnalyticsOverview {
  total_claims: number;
  total_amount: number;
  approved_count: number;
  approved_amount: number;
  pending_count: number;
  pending_amount: number;
}

export interface ProjectBreakdown {
  project_id: number;
  project_name: string;
  total_claims: number;
  total_amount: number;
  approved_count: number;
  approved_amount: number;
}

export interface TopSubmitter {
  user_id: number;
  user_name: string;
  total_claims: number;
  total_amount: number;
}

export interface AuditLog {
  id: number;
  user_id: number;
  user_name?: string;
  action: string;
  target_type?: string;
  target_id?: number;
  details?: string;
  created_at: string;
}

export interface DashboardSummary {
  projects: {
    id: number;
    name: string;
    status: string;
    claim_count: number;
    total_amount: number;
  }[];
  recent_claims: {
    id: number;
    merchant_name: string;
    amount: number;
    status: string;
    created_at: string;
  }[];
}

export interface UserDashboard extends DashboardSummary {
  total_claims: number;
  total_amount: number;
  pending_claims: number;
  active_projects: number;
}