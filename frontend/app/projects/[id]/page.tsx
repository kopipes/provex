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

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const projectId = parseInt(params.id as string);
  
  const [project, setProject] = useState<Project | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
                      <div className="text-right">
                        <p className="font-semibold text-text-primary">
                          {formatCurrency(claim.amount)}
                        </p>
                        <StatusBadge status={claim.status} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}