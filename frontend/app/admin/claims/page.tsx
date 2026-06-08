'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Sidebar } from '@/components/Sidebar';
import { StatusBadge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { claimsAPI, analyticsAPI, projectsAPI } from '@/lib/api';
import type { Claim, Project } from '@/lib/types';
import { Search, Eye, X, Edit2, Trash2 } from 'lucide-react';
import { useNotification } from '@/components/Toast';

export default function AdminClaimsPage() {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState<number | undefined>();
  const [periodFilter, setPeriodFilter] = useState('all');
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [actionClaim, setActionClaim] = useState<Claim | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'revision' | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredClaims, setFilteredClaims] = useState<Claim[]>([]);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [editingClaim, setEditingClaim] = useState<Claim | null>(null);
  const [editFormData, setEditFormData] = useState({
    merchant_name: '',
    transaction_date: '',
    amount: '',
    category: '',
    description: '',
    receipt_number: '',
  });
  const [deletingClaim, setDeletingClaim] = useState<Claim | null>(null);

  useEffect(() => {
    loadData();
  }, [filter, projectFilter, exportStartDate, exportEndDate]);

  useEffect(() => {
    filterClaims();
  }, [searchQuery, claims]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params: any = { status: filter || undefined, project_id: projectFilter };
      
      // Add date range filter if both dates are set
      if (exportStartDate && exportEndDate) {
        params.start_date = exportStartDate;
        params.end_date = exportEndDate;
      }
      
      console.log('Loading claims with params:', params);
      console.log('Date range:', exportStartDate, 'to', exportEndDate);
      
      const [claimsRes, projectsRes] = await Promise.all([
        claimsAPI.list(params),
        projectsAPI.list()
      ]);
      console.log('API Response:', claimsRes.data.length, 'claims');
      setClaims(claimsRes.data);
      setProjects(projectsRes.data);
    } catch (err: any) {
      console.error('API Error:', err);
      setError(err.response?.data?.detail || 'Failed to load claims');
    } finally {
      setLoading(false);
    }
  };

  const filterClaims = () => {
    if (searchQuery.trim() === '') {
      setFilteredClaims(claims);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredClaims(
        claims.filter(
          (c) =>
            c.merchant_name.toLowerCase().includes(query) ||
            c.user_name?.toLowerCase().includes(query) ||
            c.project_name?.toLowerCase().includes(query) ||
            c.category.toLowerCase().includes(query) ||
            c.description?.toLowerCase().includes(query)
        )
      );
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
      showToast('success', 'Export berhasil');
    } catch (err) {
      showToast('error', 'Gagal export data');
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
      showToast('success', 'Status klaim berhasil diupdate');
      setActionClaim(null);
      setActionType(null);
      setNotes('');
      loadData();
    } catch (err: any) {
      showToast('error', err.response?.data?.detail || 'Failed to update claim');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (claim: Claim) => {
    setEditingClaim(claim);
    setEditFormData({
      merchant_name: claim.merchant_name,
      transaction_date: claim.transaction_date,
      amount: claim.amount.toString(),
      category: claim.category,
      description: claim.description || '',
      receipt_number: claim.receipt_number || '',
    });
  };

  const handleEditClaim = async () => {
    if (!editingClaim) return;
    
    setSubmitting(true);
    try {
      await claimsAPI.update(editingClaim.id, {
        merchant_name: editFormData.merchant_name,
        transaction_date: editFormData.transaction_date,
        amount: parseFloat(editFormData.amount),
        category: editFormData.category as any,
        description: editFormData.description || undefined,
        receipt_number: editFormData.receipt_number || undefined,
      });
      showToast('success', 'Klaim berhasil diupdate');
      setEditingClaim(null);
      loadData();
    } catch (err: any) {
      showToast('error', err.response?.data?.detail || 'Failed to update claim');
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (claim: Claim) => {
    setDeletingClaim(claim);
  };

  const handleDeleteClaim = async () => {
    if (!deletingClaim) return;
    
    setSubmitting(true);
    try {
      await claimsAPI.delete(deletingClaim.id);
      showToast('success', 'Klaim berhasil dihapus');
      setDeletingClaim(null);
      loadData();
    } catch (err: any) {
      showToast('error', err.response?.data?.detail || 'Failed to delete claim');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-bg-base">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 md:ml-[240px]">
        <div className="max-w-[1200px] mx-auto">
          <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <h1 className="text-xl md:text-[24px] font-display font-bold text-text-primary">Semua Klaim</h1>
              <p className="text-text-secondary text-sm mt-1">Review dan kelola semua klaim</p>
            </div>
            <Button variant="secondary" onClick={handleExport} className="w-full sm:w-auto">
              Export CSV
            </Button>
          </div>

          <div className="mb-4 md:mb-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari merchant, user, project, kategori..."
                className="w-full pl-10 pr-4 py-2 bg-bg-surface border border-border-default rounded-radius-md text-sm"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
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
                />
                <span className="text-text-muted">-</span>
                <input
                  type="date"
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                  className="px-4 py-2 bg-bg-surface border border-border-default rounded-radius-md text-sm"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="bg-bg-surface border border-border-default rounded-radius-lg p-8 text-center">
              <p className="text-text-secondary">Memuat klaim...</p>
            </div>
          ) : error ? (
            <div className="bg-bg-surface border border-border-default rounded-radius-lg p-8 text-center">
              <p className="text-danger">{error}</p>
              <Button onClick={loadData} className="mt-4">Coba Lagi</Button>
            </div>
          ) : filteredClaims.length === 0 ? (
            <div className="bg-bg-surface border border-border-default rounded-radius-lg p-8 text-center">
              <p className="text-text-secondary">Tidak ada klaim ditemukan</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredClaims.map((claim) => (
                <div key={claim.id} className="bg-bg-surface border border-border-default rounded-radius-lg p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-text-primary">{claim.merchant_name}</h3>
                      <p className="text-text-secondary text-sm mt-1">
                        {claim.user_name} • {claim.project_name || `Project #${claim.project_id}`}
                      </p>
                    </div>
                    <StatusBadge status={claim.status} />
                  </div>

                  <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 text-sm">
                    <div>
                      <span className="text-text-muted">Jumlah</span>
                      <p className="font-medium text-text-primary">{formatCurrency(claim.amount)}</p>
                    </div>
                    <div>
                      <span className="text-text-muted">Kategori</span>
                      <p className="font-medium text-text-primary">{claim.category}</p>
                    </div>
                    <div>
                      <span className="text-text-muted">Tanggal</span>
                      <p className="font-medium text-text-primary">{formatDate(claim.transaction_date)}</p>
                    </div>
                    <div>
                      <span className="text-text-muted">Reviewer</span>
                      <p className="font-medium text-text-primary">{claim.reviewer_name || '-'}</p>
                    </div>
                    <div>
                      <span className="text-text-muted">Dibuat</span>
                      <p className="font-medium text-text-primary">{formatDate(claim.created_at)}</p>
                    </div>
                  </div>

                  {claim.notes && (
                    <div className="mt-4 p-3 bg-bg-subtle rounded-radius-md">
                      <p className="text-sm text-text-secondary">
                        <span className="font-medium">Catatan: </span>{claim.notes}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-border-default flex flex-wrap justify-end gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setSelectedClaim(claim)}>
                      <Eye className="w-4 h-4 mr-1" />Detail
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => openEditModal(claim)}>
                      <Edit2 className="w-4 h-4 mr-1" />Edit
                    </Button>
                    <Button variant="secondary" size="sm" className="text-danger" onClick={() => openDeleteModal(claim)}>
                      <Trash2 className="w-4 h-4 mr-1" />Hapus
                    </Button>
                    {claim.status === 'submitted' && (
                      <>
                        <Button variant="secondary" size="sm" onClick={() => { setActionClaim(claim); setActionType('revision'); }}>
                          Minta Revisi
                        </Button>
                        <Button variant="secondary" size="sm" className="text-danger" onClick={() => { setActionClaim(claim); setActionType('reject'); }}>
                          Tolak
                        </Button>
                        <Button size="sm" onClick={() => { setActionClaim(claim); setActionType('approve'); }}>
                          Approve
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

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
                {selectedClaim.updated_at && selectedClaim.updated_at !== selectedClaim.created_at && (
                  <> • Diupdate: {formatDate(selectedClaim.updated_at)}</>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {actionClaim && actionType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-surface rounded-radius-lg p-6 w-full max-w-[500px]">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              {actionType === 'approve' ? 'Approve Klaim' : actionType === 'reject' ? 'Tolak Klaim' : 'Minta Revisi Klaim'}
            </h2>
            <div className="mb-4 p-4 bg-bg-subtle rounded-radius-md">
              <p className="font-medium">{actionClaim.merchant_name}</p>
              <p className="text-text-secondary">{formatCurrency(actionClaim.amount)}</p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-text-primary mb-2">Catatan (Opsional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 bg-bg-surface border border-border-default rounded-radius-md resize-none"
                placeholder="Tambahkan catatan..."
              />
            </div>
            <div className="flex justify-end gap-4">
              <Button variant="secondary" onClick={() => { setActionClaim(null); setActionType(null); setNotes(''); }}>
                Batal
              </Button>
              <Button onClick={handleAction} isLoading={submitting} className={actionType === 'reject' ? '!bg-danger hover:!bg-danger/90' : ''}>
                {actionType === 'approve' ? 'Approve' : actionType === 'reject' ? 'Tolak' : 'Minta Revisi'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {editingClaim && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-surface rounded-radius-lg p-6 w-full max-w-[500px]">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Edit Klaim</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Nama Merchant</label>
                <input
                  type="text"
                  value={editFormData.merchant_name}
                  onChange={(e) => setEditFormData({ ...editFormData, merchant_name: e.target.value })}
                  className="w-full px-4 py-2 bg-bg-surface border border-border-default rounded-radius-md"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={editFormData.transaction_date}
                    onChange={(e) => setEditFormData({ ...editFormData, transaction_date: e.target.value })}
                    className="w-full px-4 py-2 bg-bg-surface border border-border-default rounded-radius-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Jumlah</label>
                  <input
                    type="number"
                    value={editFormData.amount}
                    onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                    className="w-full px-4 py-2 bg-bg-surface border border-border-default rounded-radius-md"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Kategori</label>
                <select
                  value={editFormData.category}
                  onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                  className="w-full px-4 py-2 bg-bg-surface border border-border-default rounded-radius-md"
                >
                  <option value="Makanan">Makanan</option>
                  <option value="Transport">Transport</option>
                  <option value="Akomodasi">Akomodasi</option>
                  <option value="Lain-lain">Lain-lain</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Deskripsi</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 bg-bg-surface border border-border-default rounded-radius-md resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">No. Kwitansi</label>
                <input
                  type="text"
                  value={editFormData.receipt_number}
                  onChange={(e) => setEditFormData({ ...editFormData, receipt_number: e.target.value })}
                  className="w-full px-4 py-2 bg-bg-surface border border-border-default rounded-radius-md"
                />
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <Button variant="secondary" onClick={() => setEditingClaim(null)}>
                Batal
              </Button>
              <Button onClick={handleEditClaim} isLoading={submitting}>
                Simpan
              </Button>
            </div>
          </div>
        </div>
      )}

      {deletingClaim && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-surface rounded-radius-lg p-6 w-full max-w-[400px]">
            <h2 className="text-lg font-semibold text-text-primary mb-2">Hapus Klaim?</h2>
            <p className="text-text-secondary mb-4">
              Apakah Anda yakin ingin menghapus klaim <strong>{deletingClaim.merchant_name}</strong>?
            </p>
            <div className="flex justify-end gap-4">
              <Button variant="secondary" onClick={() => setDeletingClaim(null)}>
                Batal
              </Button>
              <Button onClick={handleDeleteClaim} isLoading={submitting} className="!bg-danger hover:!bg-danger/90">
                Hapus
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
