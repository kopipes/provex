'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/Button';
import { formatDate } from '@/lib/utils';
import { analyticsAPI } from '@/lib/api';
import type { AuditLog } from '@/lib/types';

export default function AuditLogPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await analyticsAPI.getAuditLogs({ limit: 100 });
      setLogs(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-bg-base">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-[1200px] mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-[24px] font-display font-bold text-text-primary">
              Audit Log
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              Riwayat aktivitas sistem
            </p>
          </div>

          {/* Logs List */}
          {loading ? (
            <div className="bg-bg-surface border border-border-default rounded-radius-lg p-8 text-center">
              <p className="text-text-secondary">Memuat log...</p>
            </div>
          ) : error ? (
            <div className="bg-bg-surface border border-border-default rounded-radius-lg p-8 text-center">
              <p className="text-danger">{error}</p>
              <Button onClick={loadLogs} className="mt-4">
                Coba Lagi
              </Button>
            </div>
          ) : logs.length === 0 ? (
            <div className="bg-bg-surface border border-border-default rounded-radius-lg p-8 text-center">
              <p className="text-text-secondary">Tidak ada log ditemukan</p>
            </div>
          ) : (
            <div className="bg-bg-surface border border-border-default rounded-radius-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-bg-subtle">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-text-primary">Waktu</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-text-primary">User</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-text-primary">Aksi</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-text-primary">Target</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-text-primary">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-bg-subtle/50">
                      <td className="px-6 py-4 text-text-secondary text-sm">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-text-primary">
                          {log.user_name || `User #${log.user_id}`}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-radius-sm text-xs font-medium bg-accent/20 text-accent">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-text-secondary">
                        {log.target_type ? (
                          <span>{log.target_type} #{log.target_id}</span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 text-text-secondary text-sm max-w-[300px] truncate">
                        {log.details || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}