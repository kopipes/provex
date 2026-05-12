'use client';

import { useAuth } from '@/lib/auth';
import { Sidebar } from '@/components/Sidebar';
import { StatusBadge } from '@/components/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { analyticsAPI } from '@/lib/api';
import { useEffect, useState } from 'react';
import { FolderOpen, Search, Calendar } from 'lucide-react';
import Link from 'next/link';
import type { ClaimStatus, ProjectStatus } from '@/lib/types';

interface ProjectSummary {
  id: number;
  name: string;
  status: ProjectStatus;
  claim_count: number;
  total_amount: number;
}

interface RecentClaim {
  id: number;
  merchant_name: string;
  amount: number;
  status: ClaimStatus;
  created_at: string;
  project_name?: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [recentClaims, setRecentClaims] = useState<RecentClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const response = await analyticsAPI.getDashboard() as any;
      let projectList = response.data.projects || [];
      let claimList = response.data.recent_claims || [];
      
      // Client-side filtering for search (applies to both projects and claims)
      if (searchQuery) {
        projectList = projectList.filter((p: any) => 
          p.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        claimList = claimList.filter((c: any) => 
          c.merchant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.project_name && c.project_name.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }
      
      // Client-side filtering for date range
      if (dateRange.start) {
        claimList = claimList.filter((c: any) => 
          c.created_at >= dateRange.start
        );
      }
      if (dateRange.end) {
        claimList = claimList.filter((c: any) => 
          c.created_at <= dateRange.end + 'T23:59:59'
        );
      }
      
      setProjects(projectList);
      setRecentClaims(claimList);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchDashboard();
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const clearFilters = () => {
    setSearchQuery('');
    setDateRange({ start: '', end: '' });
  };

  const hasFilters = searchQuery || dateRange.start || dateRange.end;

  return (
    <div className="flex min-h-screen bg-bg-base">
      <Sidebar />
      <main className="flex-1 p-8 md:ml-[240px]">
        <div className="max-w-[1100px] mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-[24px] font-display font-bold text-text-primary">
              Dashboard
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              Selamat datang, {user?.name}
            </p>
          </div>

          {/* Filters */}
          <div className="bg-bg-surface border border-border-default rounded-radius-lg p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Cari nama project..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-bg-muted border border-border-default rounded-radius-md text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
                />
              </div>
              
              {/* Date Range */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-text-muted" />
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="px-3 py-2 bg-bg-muted border border-border-default rounded-radius-md text-sm text-text-primary focus:outline-none focus:border-accent"
                />
                <span className="text-text-muted">-</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="px-3 py-2 bg-bg-muted border border-border-default rounded-radius-md text-sm text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
              
              {/* Clear filters */}
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm text-accent hover:bg-accent-subtle rounded-radius-md transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
            </div>
          ) : projects.length === 0 ? (
            <div className="bg-bg-surface border border-border-default rounded-radius-lg p-8 text-center">
              <FolderOpen className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-secondary">
                {hasFilters ? 'Tidak ada project yang sesuai filter.' : 'Belum ada project yang diikuti.'}
              </p>
              <p className="text-text-muted text-sm mt-2">
                {hasFilters ? 'Coba ubah filter pencarian.' : 'Hubungi manager untuk ditambahkan ke project.'}
              </p>
            </div>
          ) : (
            <>
              {/* Projects Grid */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-text-primary mb-4">
                  Project Saya <span className="text-sm font-normal text-text-muted">({projects.length})</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="bg-bg-surface border border-border-default rounded-radius-lg p-5 hover:border-accent transition-colors group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <FolderOpen className="w-5 h-5 text-accent" />
                          <h3 className="font-semibold text-text-primary group-hover:text-accent transition-colors">
                            {project.name}
                          </h3>
                        </div>
                        <StatusBadge status={project.status} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-text-secondary">Total Klaim</span>
                          <span className="font-medium text-text-primary">{project.claim_count}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-text-secondary">Total Amount</span>
                          <span className="font-medium text-text-primary">{formatCurrency(project.total_amount)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Recent Claims */}
              {recentClaims.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-text-primary mb-4">Klaim Terbaru</h2>
                  <div className="bg-bg-surface border border-border-default rounded-radius-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-bg-muted border-b border-border-default">
                        <tr>
                          <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">Merchant</th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">Project</th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">Amount</th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">Status</th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">Tanggal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-default">
                        {recentClaims.map((claim) => (
                          <tr key={claim.id} className="hover:bg-bg-muted/50">
                            <td className="px-4 py-3 text-sm text-text-primary">{claim.merchant_name}</td>
                            <td className="px-4 py-3 text-sm text-text-secondary">{claim.project_name || '-'}</td>
                            <td className="px-4 py-3 text-sm font-medium text-text-primary">{formatCurrency(claim.amount)}</td>
                            <td className="px-4 py-3"><StatusBadge status={claim.status} /></td>
                            <td className="px-4 py-3 text-sm text-text-secondary">{formatDate(claim.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}