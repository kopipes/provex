'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Sidebar } from '@/components/Sidebar';
import { StatusBadge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { ReceiptViewer } from '@/components/ReceiptViewer';
import { formatCurrency, formatDate } from '@/lib/utils';
import { projectsAPI, claimsAPI, usersAPI } from '@/lib/api';
import type { Project, Claim, ProjectMember, User } from '@/lib/types';
import { Eye, X, UserPlus, Trash2 } from 'lucide-react';

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
  const [categoryFilter, setCategoryFilter] = useState('');
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberBusy, setMemberBusy] = useState(false);
  const [memberError, setMemberError] = useState('');

  const canManageMembers = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projectRes, claimsRes, membersRes] = await Promise.all([
        projectsAPI.get(projectId),
        claimsAPI.list({ project_id: projectId }),
        projectsAPI.getMembers(projectId),
      ]);
      setProject(projectRes.data);
      setClaims(claimsRes.data);
      setMembers(membersRes.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const openMemberModal = async () => {
    setShowMemberModal(true);
    setMemberError('');
    setMemberSearch('');
    if (allUsers.length === 0) {
      try {
        const res = await usersAPI.list();
        setAllUsers(res.data);
      } catch {
        setMemberError('Gagal memuat daftar pengguna');
      }
    }
  };

  const handleAddMember = async (userId: number) => {
    setMemberBusy(true);
    setMemberError('');
    try {
      await projectsAPI.addMember(projectId, userId);
      const [membersRes, projectRes] = await Promise.all([
        projectsAPI.getMembers(projectId),
        projectsAPI.get(projectId),
      ]);
      setMembers(membersRes.data);
      setProject(projectRes.data);
      setMemberSearch('');
    } catch (err: any) {
      setMemberError(err.response?.data?.detail || 'Gagal menambah anggota');
    } finally {
      setMemberBusy(false);
    }
  };

  const handleRemoveMember = async (userId: number, name: string) => {
    if (!confirm(`Hapus ${name} dari anggota project ini?`)) return;
    setMemberBusy(true);
    setMemberError('');
    try {
      await projectsAPI.removeMember(projectId, userId);
      const [membersRes, projectRes] = await Promise.all([
        projectsAPI.getMembers(projectId),
        projectsAPI.get(projectId),
      ]);
      setMembers(membersRes.data);
      setProject(projectRes.data);
    } catch (err: any) {
      setMemberError(err.response?.data?.detail || 'Gagal menghapus anggota');
    } finally {
      setMemberBusy(false);
    }
  };

  // Users eligible to be added (not already members), filtered by search
  const memberIds = new Set(members.map((m) => m.user_id));
  const availableUsers = allUsers
    .filter((u) => !memberIds.has(u.id))
    .filter((u) => {
      const q = memberSearch.toLowerCase();
      return (
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.department || '').toLowerCase().includes(q)
      );
    });

  // Distinct categories present in this project's claims
  const claimCategories = Array.from(new Set(claims.map((c) => c.category).filter(Boolean))).sort();

  const visibleClaims = categoryFilter
    ? claims.filter((c) => c.category === categoryFilter)
    : claims;

  const visibleTotal = visibleClaims.reduce((sum, c) => sum + (c.amount || 0), 0);

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
              <p className="text-sm text-text-muted">Budget Kategori</p>
              <p className="text-lg font-semibold text-text-primary">
                {(() => {
                  const list = project.category_budgets || [];
                  if (list.length === 0) return 'Tanpa Limit';
                  const total = list.reduce((s, b) => s + (b.budget_amount || 0), 0);
                  return `${list.length} kategori • ${formatCurrency(total)}`;
                })()}
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

          {/* Members */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
              <h2 className="text-lg font-semibold text-text-primary">
                Anggota Project
                <span className="text-text-muted font-normal text-sm ml-2">({members.length} orang)</span>
              </h2>
              {canManageMembers && (
                <Button size="sm" onClick={openMemberModal}>
                  <span className="inline-flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4" />
                    Tambah Anggota
                  </span>
                </Button>
              )}
            </div>

            <div className="bg-bg-surface border border-border-default rounded-radius-lg overflow-hidden">
              {members.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-text-secondary text-sm">Belum ada anggota di project ini</p>
                  {!canManageMembers && (
                    <p className="text-text-muted text-xs mt-1">
                      Hubungi admin atau manager untuk menambahkan Anda sebagai anggota.
                    </p>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-border-default">
                  {members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="font-medium text-text-primary text-sm truncate">{m.user_name}</p>
                        <p className="text-xs text-text-secondary truncate">
                          {m.user_email}
                          {m.department && <> · {m.department}</>}
                        </p>
                      </div>
                      {canManageMembers && (
                        <button
                          onClick={() => handleRemoveMember(m.user_id, m.user_name)}
                          disabled={memberBusy}
                          className="p-2 text-danger hover:bg-danger/10 rounded-radius-md disabled:opacity-50"
                          title="Hapus anggota"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Claims List */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
              <h2 className="text-lg font-semibold text-text-primary">Riwayat Klaim</h2>
              <div className="flex items-center gap-3">
                {claimCategories.length > 0 && (
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 bg-bg-surface border border-border-default rounded-radius-md text-sm"
                  >
                    <option value="">Semua Kategori</option>
                    {claimCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                )}
                <Button onClick={() => router.push('/claims/new')} size="sm">
                  Klaim Baru
                </Button>
              </div>
            </div>

            {claims.length === 0 ? (
              <div className="bg-bg-surface border border-border-default rounded-radius-lg p-8 text-center">
                <p className="text-text-secondary">Belum ada klaim untuk project ini</p>
              </div>
            ) : (
              <div className="bg-bg-surface border border-border-default rounded-radius-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-bg-subtle text-text-muted">
                        <th className="text-left font-medium px-4 py-3">Merchant</th>
                        <th className="text-left font-medium px-4 py-3">Kategori</th>
                        <th className="text-left font-medium px-4 py-3">Tanggal</th>
                        <th className="text-right font-medium px-4 py-3">Jumlah</th>
                        <th className="text-left font-medium px-4 py-3">Status</th>
                        <th className="text-right font-medium px-4 py-3">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleClaims.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">
                            Tidak ada klaim untuk kategori ini
                          </td>
                        </tr>
                      ) : (
                        visibleClaims.map((claim) => (
                          <tr key={claim.id} className="border-t border-border-default">
                            <td className="px-4 py-3">
                              <p className="font-medium text-text-primary">{claim.merchant_name}</p>
                              <p className="text-xs text-text-secondary mt-0.5">{claim.user_name}</p>
                            </td>
                            <td className="px-4 py-3 text-text-primary">{claim.category}</td>
                            <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                              {formatDate(claim.transaction_date)}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-text-primary whitespace-nowrap">
                              {formatCurrency(claim.amount)}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={claim.status} />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setSelectedClaim(claim)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-border-default bg-bg-subtle">
                        <td colSpan={3} className="px-4 py-3 font-semibold text-text-primary">
                          Total {categoryFilter ? `(${categoryFilter})` : ''} • {visibleClaims.length} klaim
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-text-primary whitespace-nowrap">
                          {formatCurrency(visibleTotal)}
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-surface rounded-radius-lg w-full max-w-[480px] max-h-[85vh] flex flex-col">
            <div className="border-b border-border-default p-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-text-primary">Tambah Anggota</h2>
              <button
                onClick={() => setShowMemberModal(false)}
                className="text-text-muted hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-border-default">
              <input
                type="text"
                placeholder="Cari nama, email, atau departemen..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full px-3 py-2 bg-bg-muted border border-border-default rounded-radius-md text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
              />
            </div>

            {memberError && (
              <p className="px-4 pt-3 text-danger text-sm">{memberError}</p>
            )}

            <div className="flex-1 overflow-y-auto divide-y divide-border-default">
              {availableUsers.length === 0 ? (
                <p className="p-6 text-center text-text-secondary text-sm">
                  {memberSearch ? 'Tidak ada pengguna yang cocok' : 'Semua pengguna sudah menjadi anggota'}
                </p>
              ) : (
                availableUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="font-medium text-text-primary text-sm truncate">{u.name}</p>
                      <p className="text-xs text-text-secondary truncate">
                        {u.email}
                        {u.department && <> · {u.department}</>}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleAddMember(u.id)}
                      disabled={memberBusy}
                    >
                      Tambah
                    </Button>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-border-default p-4 flex justify-end">
              <Button variant="secondary" onClick={() => setShowMemberModal(false)}>
                Selesai
              </Button>
            </div>
          </div>
        </div>
      )}

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
                  <ReceiptViewer path={selectedClaim.receipt_image_path} />
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