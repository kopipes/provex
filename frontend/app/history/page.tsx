'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Sidebar } from '@/components/Sidebar';
import { StatusBadge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { claimsAPI } from '@/lib/api';
import type { Claim } from '@/lib/types';
import { Search, X, Eye } from 'lucide-react';
import { useNotification } from '@/components/Toast';

export default function HistoryPage() {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [filteredClaims, setFilteredClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);

  useEffect(() => {
    loadClaims();
  }, []);

  useEffect(() => {
    filterClaims();
  }, [searchQuery, claims, filter]);

  const loadClaims = async () => {
    try {
      setLoading(true);
      const response = await claimsAPI.list({ status: filter || undefined });
      setClaims(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load claims');
    } finally {
      setLoading(false);
    }
  };

  const filterClaims = () => {
    let result = claims;
    
    if (filter) {
      result = result.filter(c => c.status === filter);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.merchant_name.toLowerCase().includes(query) ||
          c.project_name?.toLowerCase().includes(query) ||
          c.category.toLowerCase().includes(query) ||
          c.description?.toLowerCase().includes(query)
      );
    }
    
    setFilteredClaims(result);
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
  };

  const handleSubmitClaim = async (claimId: number) => {
    try {
      await claimsAPI.submit(claimId);
      showToast('success', 'Klaim berhasil diajukan');
      loadClaims();
    } catch (err: any) {
      showToast('error', err.response?.data?.detail || 'Failed to submit claim');
    }
  };

  return (
    <div className="flex min-h-screen bg-bg-base">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 md:ml-[240px]">
        <div className="max-w-[1100px] mx-auto">
          <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <h1 className="text-[24px] font-display font-bold text-text-primary">Riwayat Klaim</h1>
              <p className="text-text-secondary text-sm mt-1">Lihat semua klaim Anda</p>
            </div>
            <Button onClick={() => window.location.href = '/claims/new'}>Klaim Baru</Button>
          </div>

          <div className="mb-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari merchant, project, kategori..."
                className="w-full pl-10 pr-4 py-2 bg-bg-surface border border-border-default rounded-radius-md text-sm"
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              {['', 'draft', 'submitted', 'approved', 'rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => handleFilterChange(status)}
                  className={`px-4 py-2 rounded-radius-md text-sm font-medium transition-colors ${
                    filter === status
                      ? 'bg-accent text-white'
                      : 'bg-bg-surface border border-border-default text-text-primary hover:border-accent/50'
                  }`}
                >
                  {status === '' ? 'Semua' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="bg-bg-surface border border-border-default rounded-radius-lg p-8 text-center">
              <p className="text-text-secondary">Memuat klaim...</p>
            </div>
          ) : error ? (
            <div className="bg-bg-surface border border-border-default rounded-radius-lg p-8 text-center">
              <p className="text-danger">{error}</p>
              <Button onClick={loadClaims} className="mt-4">Coba Lagi</Button>
            </div>
          ) : filteredClaims.length === 0 ? (
            <div className="bg-bg-surface border border-border-default rounded-radius-lg p-8 text-center">
              <p className="text-text-secondary">
                {searchQuery ? 'Tidak ada klaim ditemukan' : 'Tidak ada klaim'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredClaims.map((claim) => (
                <div key={claim.id} className="bg-bg-surface border border-border-default rounded-radius-lg p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-text-primary">{claim.merchant_name}</h3>
                      <p className="text-text-secondary text-sm mt-1">
                        {claim.project_name || `Project #${claim.project_id}`}
                      </p>
                    </div>
                    <StatusBadge status={claim.status} />
                  </div>

                  <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
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
                      <span className="text-text-muted">Status</span>
                      <p className="font-medium text-text-primary capitalize">{claim.status}</p>
                    </div>
                  </div>

                  {claim.notes && (
                    <div className="mt-4 p-3 bg-bg-subtle rounded-radius-md">
                      <p className="text-sm text-text-secondary">
                        <span className="font-medium">Catatan: </span>{claim.notes}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-border-default flex justify-between items-center">
                    <span className="text-sm text-text-muted">{formatDate(claim.created_at)}</span>
                    <div className="flex gap-2">
                      {claim.status === 'draft' && (
                        <Button variant="secondary" size="sm" onClick={() => handleSubmitClaim(claim.id)}>
                          Ajukan
                        </Button>
                      )}
                      <Button variant="secondary" size="sm" onClick={() => setSelectedClaim(claim)}>
                        <Eye className="w-4 h-4 mr-1" />Detail
                      </Button>
                    </div>
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
                    {selectedClaim.project_name || `Project #${selectedClaim.project_id}`}
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