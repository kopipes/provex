'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Sidebar } from '@/components/Sidebar';
import { StatusBadge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { formatCurrency, formatDate } from '@/lib/utils';
import { projectsAPI } from '@/lib/api';
import type { Project } from '@/lib/types';

export default function ProjectsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await projectsAPI.list({ search: search || undefined });
      setProjects(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadProjects();
  };

  return (
    <div className="flex min-h-screen bg-bg-base">
      <Sidebar />
      <main className="flex-1 p-8 md:ml-[240px]">
        <div className="max-w-[1100px] mx-auto">
          {/* Header */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-[24px] font-display font-bold text-text-primary">
                Project
              </h1>
              <p className="text-text-secondary text-sm mt-1">
                Kelola project dan klaim Anda
              </p>
            </div>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="mb-6 flex gap-4">
            <div className="flex-1 max-w-[400px]">
              <Input
                placeholder="Cari project..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button type="submit" variant="secondary">
              Cari
            </Button>
          </form>

          {/* Projects List */}
          {loading ? (
            <div className="bg-bg-surface border border-border-default rounded-radius-lg p-8 text-center">
              <p className="text-text-secondary">Memuat project...</p>
            </div>
          ) : error ? (
            <div className="bg-bg-surface border border-border-default rounded-radius-lg p-8 text-center">
              <p className="text-danger">{error}</p>
              <Button onClick={loadProjects} className="mt-4">
                Coba Lagi
              </Button>
            </div>
          ) : projects.length === 0 ? (
            <div className="bg-bg-surface border border-border-default rounded-radius-lg p-8 text-center">
              <p className="text-text-secondary">Tidak ada project ditemukan</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-bg-surface border border-border-default rounded-radius-lg p-6 hover:border-accent/50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-text-primary">
                        {project.name}
                      </h3>
                      <p className="text-text-secondary text-sm mt-1">
                        {project.description || 'Tidak ada deskripsi'}
                      </p>
                    </div>
                    <StatusBadge status={project.status} />
                  </div>
                  
                  <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-text-muted">Anggaran</span>
                      <p className="font-medium text-text-primary">
                        {project.budget_limit ? formatCurrency(project.budget_limit) : '-'}
                      </p>
                    </div>
                    <div>
                      <span className="text-text-muted">Total Klaim</span>
                      <p className="font-medium text-text-primary">
                        {formatCurrency(project.total_claims)}
                      </p>
                    </div>
                    <div>
                      <span className="text-text-muted">Anggota</span>
                      <p className="font-medium text-text-primary">
                        {project.member_count} orang
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border-default flex justify-between items-center">
                    <span className="text-sm text-text-muted">
                      {formatDate(project.start_date)} - {project.end_date ? formatDate(project.end_date) : '-'}
                    </span>
                    <Button variant="secondary" size="sm" onClick={() => router.push(`/projects/${project.id}`)}>
                      Lihat Detail
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}