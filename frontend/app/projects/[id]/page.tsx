'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Sidebar } from '@/components/Sidebar';
import { StatusBadge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { projectsAPI, claimsAPI } from '@/lib/api';
import type { Project, Claim } from '@/lib/types';
import { Eye, X } from 'lucide-react';

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const projectId = parseInt(params.id as string);
  
  const [project, setProject] = useState<Project | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projectRes, claimsRes] = await Promise.all([
        projectsAPI.get(projectId),
        claimsAPI.list({ project_id: projectId })
      ]);
      setProject(projectRes.data);
      setClaims(claimsRes.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-bg-base">
        <Sidebar />
        <main className="flex-1 p-8 md:ml-[240px]">
          <div className="max-w-[1100px] mx-auto">
            <div className="bg-bg-surface border border-border-default rounded-radius-lg p-8 text-center">
              <p className="text-text-secondary">Memuat...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex min-h-screen bg-bg-base">
        <Sidebar />
        <main className="flex-1 p-8 md:ml-[240px]">
          <div className="max-w-[1100px] mx-auto">
            <div className="bg-bg-surface border border-border-default rounded-radius-lg p-8 text-center">
              <p className="text-danger">{error || 'Project not found'}</p>
              <Button onClick={() => router.push('/projects')} className="mt-4">
                Kembali ke Projects
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-bg-base">
      <Sidebar />
      <main className="flex-1 p-8 md:ml-[240px]">
        <div className="max-w-[1100px] mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link 
              href="/projects" 
              className="text-sm text-accent hover:underline mb-4 inline-block"
            >
              ← Kembali ke Projects
            </Link>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-[24px] font-display font-bold text-text-primary">
                  {project.name}
                </h1>
                <p className="text-text-secondary text-sm mt-1">
                  {project.description || 'Tidak ada deskripsi'}
                </p>
              </div>
              <StatusBadge status={project.status} />
            </div>
          </div>

          {/* Project Info */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-bg-surface border border-border-default rounded-radius-lg p-4">
              <p className="text-sm text-text-muted">Anggaran</p>
              <p className="text-lg font-semibold text-text-primary">
                {project.budget_limit ? formatCurrency(project.budget_limit) : 'Tanpa Limit'}
              </p>
            </div>
            <div className="bg-bg-surface border border-border-default rounded-radius-lg p-4">
              <p className="text-sm text-text-muted">Total Klaim</p>
              <p className="text-lg font-semibold text-text-primary">
                {formatCurrency(project.total_claims)}
              </p>
            </div>
            <div className="bg-bg-surface border border-border-default rounded-radius-lg p-4">
              <p className="text-sm text-text-muted">Anggota</p>
              <p className="text-lg font-semibold text-text-primary">
                {project.member_count} orang
              </p>
            </div>
            <div className="bg-bg-surface border border-border-default rounded-radius-lg p-4">
              <p className="text-sm text-text-muted">Periode</p>
              <p className="text-lg font-semibold text-text-primary">
                {formatDate(project.start_date)} - {project.end_date ? formatDate(project.end_date) : '-'}
              </p>
            </div>
          </div>

          {/* Claims List */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-text-primary">Riwayat Klaim</h2>
              <Button onClick={() => router.push('/claims/new')} size="sm">
                Klaim Baru
              </Button>
            </div>

            {claims.length === 0 ? (
              <div className="bg-bg-surface border border-border-default rounded-radius-lg p-8 text-center">
                <p className="text-text-secondary">Belum ada klaim untuk project ini</p>
              </div>
            ) : (
              <div className="space-y-4">
                {claims.map((claim) => (
                  <div
                    key={claim.id}
                    className="bg-bg-surface border border-border-default rounded-radius-lg p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-text-primary">
                          {claim.merchant_name}
                        </h3>
                        <p className="text-sm text-text-secondary mt-1">
                          {claim.user_name} • {formatDate(claim.transaction_date)}
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <p className="font-semibold text-text-primary">
                          {formatCurrency(claim.amount)}
                        </p>
                        <StatusBadge status={claim.status} />
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => setSelectedClaim(claim)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Claim Detail Modal */}
      {selectedClaim && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-surface rounded-radius-lg w-full max-w-[600px] max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-bg-surface border-b border-border-default p-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-text-primary">Detail Klaim</h2>
              <button onClick={() => setSelectedClaim(null)} className="text-text-muted hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-medium text-text-primary">{selectedClaim.merchant_name}</h3>
                  <p className="text-text-secondary text-sm mt-1">
                    {selectedClaim.user_name} • {selectedClaim.project_name || `Project #${selectedClaim.project_id}`}
                  </p>
                </div>
                <StatusBadge status={selectedClaim.status} />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-bg-subtle rounded-lg p-3">
                  <span className="text-text-muted text-xs block">Jumlah</span>
                  <span className="font-medium text-text-primary">{formatCurrency(selectedClaim.amount)}</span>
                </div>
                <div className="bg-bg-subtle rounded-lg p-3">
                  <span className="text-text-muted text-xs block">Kategori</span>
                  <span className="font-medium text-text-primary">{selectedClaim.category}</span>
                </div>
                <div className="bg-bg-subtle rounded-lg p-3">
                  <span className="text-text-muted text-xs block">Tanggal Transaksi</span>
                  <span className="font-medium text-text-primary">{formatDate(selectedClaim.transaction_date)}</span>
                </div>
                <div className="bg-bg-subtle rounded-lg p-3">
                  <span className="text-text-muted text-xs block">No. Kwitansi</span>
                  <span className="font-medium text-text-primary">{selectedClaim.receipt_number || '-'}</span>
                </div>
              </div>

              {selectedClaim.description && (
                <div>
                  <span className="text-text-muted text-sm block mb-1">Deskripsi</span>
                  <p className="text-text-primary bg-bg-subtle rounded-lg p-3">{selectedClaim.description}</p>
                </div>
              )}

              {selectedClaim.receipt_image_path && (
                <div>
                  <span className="text-text-muted text-sm block mb-2">Bukti Kwitansi</span>
                  <img
                    src={`http://localhost:8000${selectedClaim.receipt_image_path}`}
                    alt="Receipt"
                    className="max-w-full rounded-lg border border-border-default"
                  />
                </div>
              )}

              {selectedClaim.notes && (
                <div className="bg-warning/10 border border-warning/30 rounded-radius-md p-3">
                  <span className="text-warning text-sm font-medium block mb-1">Catatan</span>
                  <p className="text-text-primary">{selectedClaim.notes}</p>
                </div>
              )}

              {selectedClaim.reviewer_name && (
                <div className="bg-bg-subtle rounded-lg p-3">
                  <span className="text-text-muted text-xs block">Ditinjau oleh</span>
                  <span className="font-medium text-text-primary">{selectedClaim.reviewer_name}</span>
                  {selectedClaim.reviewed_at && (
                    <span className="text-text-secondary text-xs block">{formatDate(selectedClaim.reviewed_at)}</span>
                  )}
                </div>
              )}

              <div className="text-xs text-text-muted text-center pt-4 border-t border-border-default">
                Dibuat: {formatDate(selectedClaim.created_at)}
                {selectedClaim.updated_at !== selectedClaim.created_at && (
                  <> • Diupdate: {formatDate(selectedClaim.updated_at)}</>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}