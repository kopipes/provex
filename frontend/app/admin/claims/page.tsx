'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Sidebar } from '@/components/Sidebar';
import { StatusBadge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { claimsAPI, analyticsAPI, projectsAPI } from '@/lib/api';
import type { Claim, Project } from '@/lib/types';

export default function AdminClaimsPage() {
  const { user } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState<number | undefined>();
  const [periodFilter, setPeriodFilter] = useState('monthly');
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [actionClaim, setActionClaim] = useState<Claim | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'revision' | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [filter, projectFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [claimsRes, projectsRes] = await Promise.all([
        claimsAPI.list({ status: filter || undefined, project_id: projectFilter }),
        projectsAPI.list()
      ]);
      setClaims(claimsRes.data);
      setProjects(projectsRes.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load claims');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const params: any = { period: periodFilter };
      if (projectFilter) params.project_id = projectFilter;
      if (filter) params.status = filter;
      if (exportStartDate && exportEndDate) {
        params.start_date = exportStartDate;
        params.end_date = exportEndDate;
      }
      const response = await analyticsAPI.exportCSV(params);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `claims_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export failed:', err);
      alert('Gagal export data');
    }
  };

  const handleAction = async () => {
    if (!actionClaim || !actionType) return;
    
    setSubmitting(true);
    try {
      const statusMap = {
        approve: 'approved',
        reject: 'rejected',
        revision: 'revision'
      };
      await claimsAPI.updateStatus(actionClaim.id, {
        status: statusMap[actionType],
        notes: notes || undefined
      });
      setActionClaim(null);
      setActionType(null);
      setNotes('');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update claim');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-bg-base">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 md:ml-[240px]">
        <div className="max-w-[1200px] mx-auto">
          {/* Header */}
          <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <h1 className="text-xl md:text-[24px] font-display font-bold text-text-primary">
                Semua Klaim
              </h1>
              <p className="text-text-secondary text-sm mt-1">
                Review dan kelola semua klaim
              </p>
            </div>
            <Button variant="secondary" onClick={handleExport} className="w-full sm:w-auto">
              Export CSV
            </Button>
          </div>

          {/* Filters */}
          <div className="mb-4 md:mb-6 flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 bg-bg-surface border border-border-default rounded-radius-md"
            >
              <option value="">Semua Status</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="revision">Revision</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={projectFilter || ''}
              onChange={(e) => setProjectFilter(e.target.value ? parseInt(e.target.value) : undefined)}
              className="px-4 py-2 bg-bg-surface border border-border-default rounded-radius-md"
            >
              <option value="">Semua Project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={exportStartDate}
                onChange={(e) => setExportStartDate(e.target.value)}
                className="px-4 py-2 bg-bg-surface border border-border-default rounded-radius-md text-sm"
                placeholder="Tanggal mulai"
              />
              <span className="text-text-muted">-</span>
              <input
                type="date"
                value={exportEndDate}
                onChange={(e) => setExportEndDate(e.target.value)}
                className="px-4 py-2 bg-bg-surface border border-border-default rounded-radius-md text-sm"
                placeholder="Tanggal akhir"
              />
            </div>
          </div>

          {/* Claims List */}
          {loading ? (
            <div className="bg-bg-surface border border-border-default rounded-radius-lg p-8 text-center">
              <p className="text-text-secondary">Memuat klaim...</p>
            </div>
          ) : error ? (
            <div className="bg-bg-surface border border-border-default rounded-radius-lg p-8 text-center">
              <p className="text-danger">{error}</p>
              <Button onClick={loadData} className="mt-4">
                Coba Lagi
              </Button>
            </div>
          ) : claims.length === 0 ? (
            <div className="bg-bg-surface border border-border-default rounded-radius-lg p-8 text-center">
              <p className="text-text-secondary">Tidak ada klaim ditemukan</p>
            </div>
          ) : (
            <div className="space-y-4">
              {claims.map((claim) => (
                <div
                  key={claim.id}
                  className="bg-bg-surface border border-border-default rounded-radius-lg p-6"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-text-primary">
                        {claim.merchant_name}
                      </h3>
                      <p className="text-text-secondary text-sm mt-1">
                        {claim.user_name} • {claim.project_name || `Project #${claim.project_id}`}
                      </p>
                    </div>
                    <StatusBadge status={claim.status} />
                  </div>

                  <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 text-sm">
                    <div>
                      <span className="text-text-muted">Jumlah</span>
                      <p className="font-medium text-text-primary">
                        {formatCurrency(claim.amount)}
                      </p>
                    </div>
                    <div>
                      <span className="text-text-muted">Kategori</span>
                      <p className="font-medium text-text-primary">{claim.category}</p>
                    </div>
                    <div>
                      <span className="text-text-muted">Tanggal</span>
                      <p className="font-medium text-text-primary">
                        {formatDate(claim.transaction_date)}
                      </p>
                    </div>
                    <div>
                      <span className="text-text-muted">Reviewer</span>
                      <p className="font-medium text-text-primary">
                        {claim.reviewer_name || '-'}
                      </p>
                    </div>
                    <div>
                      <span className="text-text-muted">Dibuat</span>
                      <p className="font-medium text-text-primary">
                        {formatDate(claim.created_at)}
                      </p>
                    </div>
                  </div>

                  {claim.notes && (
                    <div className="mt-4 p-3 bg-bg-subtle rounded-radius-md">
                      <p className="text-sm text-text-secondary">
                        <span className="font-medium">Catatan: </span>
                        {claim.notes}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-border-default flex flex-wrap justify-end gap-2">
                    {claim.status === 'submitted' && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setActionClaim(claim);
                            setActionType('revision');
                          }}
                        >
                          Minta Revisi
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="text-danger"
                          onClick={() => {
                            setActionClaim(claim);
                            setActionType('reject');
                          }}
                        >
                          Tolak
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setActionClaim(claim);
                            setActionType('approve');
                          }}
                        >
                          Approve
                        </Button>
                      </>
                    )}
                    <Button variant="secondary" size="sm">
                      Detail
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Action Modal */}
      {actionClaim && actionType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-surface rounded-radius-lg p-6 w-full max-w-[500px]">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              {actionType === 'approve' ? 'Approve Klaim' :
               actionType === 'reject' ? 'Tolak Klaim' :
               'Minta Revisi Klaim'}
            </h2>
            <div className="mb-4 p-4 bg-bg-subtle rounded-radius-md">
              <p className="font-medium">{actionClaim.merchant_name}</p>
              <p className="text-text-secondary">{formatCurrency(actionClaim.amount)}</p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Catatan (Opsional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 bg-bg-surface border border-border-default rounded-radius-md resize-none"
                placeholder="Tambahkan catatan..."
              />
            </div>
            <div className="flex justify-end gap-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setActionClaim(null);
                  setActionType(null);
                  setNotes('');
                }}
              >
                Batal
              </Button>
              <Button
                onClick={handleAction}
                isLoading={submitting}
                className={actionType === 'reject' ? '!bg-danger hover:!bg-danger/90' : ''}
              >
                {actionType === 'approve' ? 'Approve' :
                 actionType === 'reject' ? 'Tolak' : 'Minta Revisi'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}