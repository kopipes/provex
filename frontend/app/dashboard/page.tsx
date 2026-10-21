'use client';

import { useAuth } from '@/lib/auth';
import { Sidebar } from '@/components/Sidebar';
import { StatusBadge } from '@/components/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { analyticsAPI } from '@/lib/api';
import { useEffect, useState } from 'react';
import { FolderOpen, Search, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import type { ClaimStatus, ProjectStatus, AttentionSummary } from '@/lib/types';

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
  const [attention, setAttention] = useState<AttentionSummary | null>(null);
  const [attentionDismissed, setAttentionDismissed] = useState(false);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const response = await analyticsAPI.getDashboard() as any;
      const projectList = response.data.projects || [];
      const claimList = response.data.recent_claims || [];
      
      setProjects(projectList);
      setRecentClaims(claimList);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttention = async () => {
    try {
      const res = await analyticsAPI.getAttention();
      setAttention(res.data);
    } catch (error) {
      console.error('Failed to fetch attention items:', error);
    }
  };

  const acknowledgeAttention = async () => {
    setAttentionDismissed(true);
    try {
      await analyticsAPI.markAttentionSeen();
    } catch (error) {
      console.error('Failed to mark attention as seen:', error);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchAttention();
  }, []);

  // Filter projects and claims based on search query
  const filteredProjects = projects.filter((p: any) => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredClaims = recentClaims.filter((c: any) => 
    c.merchant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.project_name && c.project_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const hasSearch = searchQuery.trim() !== '';

  return (
    <div className="flex min-h-screen bg-bg-base">
      <Sidebar />
      <main className="flex-1 p-4 sm:p-6 md:p-8 md:ml-[240px]">
        <div className="max-w-[1100px] mx-auto">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <h1 className="text-xl sm:text-[24px] font-display font-bold text-text-primary">
              Dashboard
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              Selamat datang, {user?.name}
            </p>
          </div>

          {/* Attention banner — rejected / revision claims */}
          {attention && attention.count > 0 && !attentionDismissed && (
            <div className="mb-4 sm:mb-6 border border-warning/40 bg-warning/10 rounded-radius-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary text-sm">
                    {attention.count} klaim perlu perhatian Anda
                  </p>
                  <p className="text-sm text-text-secondary mt-1">
                    {attention.revision_count > 0 && `${attention.revision_count} minta revisi`}
                    {attention.revision_count > 0 && attention.rejected_count > 0 && ', '}
                    {attention.rejected_count > 0 && `${attention.rejected_count} ditolak`}
                  </p>
                  <div className="mt-3 space-y-2">
                    {attention.items.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                        <div className="min-w-0">
                          <span className="font-medium text-text-primary">{item.merchant_name}</span>
                          <span className="text-text-muted"> · {item.project_name || '-'}</span>
                          {item.notes && (
                            <p className="text-xs text-text-secondary truncate">Catatan: {item.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <StatusBadge status={item.status} />
                          <span className="text-text-secondary">{formatCurrency(item.amount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href="/history"
                      className="px-3 py-1.5 bg-accent text-white text-sm rounded-radius-md hover:bg-accent/90"
                    >
                      Lihat Riwayat
                    </Link>
                    <button
                      onClick={acknowledgeAttention}
                      className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary"
                    >
                      Tandai sudah dibaca
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search Filter */}
          <div className="bg-bg-surface border border-border-default rounded-radius-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Cari project atau klaim..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-bg-muted border border-border-default rounded-radius-md text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
              />
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
                {hasSearch ? 'Tidak ada project yang sesuai filter.' : 'Belum ada project yang diikuti.'}
              </p>
              <p className="text-text-muted text-sm mt-2">
                {hasSearch ? 'Coba ubah filter pencarian.' : 'Hubungi manager untuk ditambahkan ke project.'}
              </p>
            </div>
          ) : (
            <>
              {/* Projects Grid */}
              <div className="mb-6 md:mb-8">
                <h2 className="text-base sm:text-lg font-semibold text-text-primary mb-3 sm:mb-4">
                  Project Saya <span className="text-sm font-normal text-text-muted">({filteredProjects.length})</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {filteredProjects.map((project) => (
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
              {filteredClaims.length > 0 && (
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-text-primary mb-3 sm:mb-4">Klaim Terbaru</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {filteredClaims.map((claim) => (
                      <div
                        key={claim.id}
                        className="bg-bg-surface border border-border-default rounded-radius-lg p-4 hover:border-accent transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-text-primary text-sm sm:text-base truncate pr-2">
                            {claim.merchant_name}
                          </h4>
                          <StatusBadge status={claim.status} />
                        </div>
                        <p className="text-xs sm:text-sm text-text-secondary mb-3">
                          {claim.project_name || '-'}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-sm sm:text-base font-semibold text-text-primary">
                            {formatCurrency(claim.amount)}
                          </span>
                          <span className="text-xs text-text-muted">
                            {formatDate(claim.created_at)}
                          </span>
                        </div>
                      </div>
                    ))}
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