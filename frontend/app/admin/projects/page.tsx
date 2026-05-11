'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Sidebar } from '@/components/Sidebar';
import { StatusBadge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { formatCurrency, formatDate } from '@/lib/utils';
import { projectsAPI, usersAPI } from '@/lib/api';
import type { Project, User } from '@/lib/types';

export default function AdminProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    budget_limit: '',
    no_limit: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projectsRes, usersRes] = await Promise.all([
        projectsAPI.list(),
        usersAPI.list(),
      ]);
      setProjects(projectsRes.data);
      setUsers(usersRes.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Nama project wajib diisi';
    if (!formData.start_date) newErrors.start_date = 'Tanggal mulai wajib diisi';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setSubmitting(true);
    try {
      const data = {
        name: formData.name,
        description: formData.description || undefined,
        start_date: formData.start_date,
        end_date: formData.end_date || undefined,
        budget_limit: formData.no_limit ? null : (formData.budget_limit ? parseFloat(formData.budget_limit) : null),
      };
      
      if (editingProject) {
        await projectsAPI.update(editingProject.id, data);
      } else {
        await projectsAPI.create(data);
      }
      
      resetForm();
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to save project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      start_date: project.start_date,
      end_date: project.end_date || '',
      budget_limit: project.budget_limit?.toString() || '',
      no_limit: project.budget_limit === null,
    });
    setShowForm(true);
  };

  const handleDelete = async (projectId: number) => {
    if (!confirm('Hapus project ini?')) return;
    try {
      await projectsAPI.delete(projectId);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete project');
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingProject(null);
    setFormData({ name: '', description: '', start_date: '', end_date: '', budget_limit: '', no_limit: false });
    setErrors({});
  };

  return (
    <div className="flex min-h-screen bg-bg-base">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 md:ml-[240px]">
        <div className="max-w-[1200px] mx-auto">
          {/* Header */}
          <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-xl md:text-[24px] font-display font-bold text-text-primary">
                Manajemen Project
              </h1>
              <p className="text-text-secondary text-sm mt-1">
                Kelola semua project
              </p>
            </div>
            <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
              Project Baru
            </Button>
          </div>

          {/* Projects List */}
          {loading ? (
            <div className="bg-bg-surface border border-border-default rounded-radius-lg p-8 text-center">
              <p className="text-text-secondary">Memuat project...</p>
            </div>
          ) : error ? (
            <div className="bg-bg-surface border border-border-default rounded-radius-lg p-8 text-center">
              <p className="text-danger">{error}</p>
              <Button onClick={loadData} className="mt-4">
                Coba Lagi
              </Button>
            </div>
          ) : projects.length === 0 ? (
            <div className="bg-bg-surface border border-border-default rounded-radius-lg p-8 text-center">
              <p className="text-text-secondary">Tidak ada project ditemukan</p>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-bg-surface border border-border-default rounded-radius-lg p-4 md:p-6"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base md:text-lg font-medium text-text-primary truncate">
                        {project.name}
                      </h3>
                      <p className="text-text-secondary text-sm mt-1 line-clamp-2">
                        {project.description || 'Tidak ada deskripsi'}
                      </p>
                    </div>
                    <StatusBadge status={project.status} />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-sm">
                    <div>
                      <span className="text-text-muted">Anggaran</span>
                      <p className="font-medium text-text-primary">
                        {project.budget_limit === null ? 'Tanpa Limit' : project.budget_limit ? formatCurrency(project.budget_limit) : '-'}
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
                    <div>
                      <span className="text-text-muted">Periode</span>
                      <p className="font-medium text-text-primary text-xs md:text-sm">
                        {formatDate(project.start_date)} - {project.end_date ? formatDate(project.end_date) : '-'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border-default flex justify-end gap-2">
                    <Button variant="secondary" size="sm" onClick={() => handleEdit(project)}>
                      Edit
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="text-danger"
                      onClick={() => handleDelete(project.id)}
                    >
                      Hapus
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-surface rounded-radius-lg p-6 w-full max-w-[500px]">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              {editingProject ? 'Edit Project' : 'Project Baru'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Nama Project
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  error={errors.name}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Deskripsi
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-bg-surface border border-border-default rounded-radius-md resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-bg-surface border border-border-default rounded-radius-md"
                  />
                  {errors.start_date && (
                    <p className="text-danger text-sm mt-1">{errors.start_date}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Tanggal Selesai
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-bg-surface border border-border-default rounded-radius-md"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Budget Limit (Rp)
                </label>
                <div className="flex items-center gap-3 mb-2">
                  <input
                    type="checkbox"
                    id="no_limit"
                    checked={formData.no_limit}
                    onChange={(e) => setFormData(prev => ({ ...prev, no_limit: e.target.checked, budget_limit: e.target.checked ? '' : prev.budget_limit }))}
                    className="w-4 h-4 rounded border-border-default text-accent focus:ring-accent"
                  />
                  <label htmlFor="no_limit" className="text-sm text-text-secondary">
                    Tidak ada limit anggaran
                  </label>
                </div>
                <Input
                  type="number"
                  value={formData.budget_limit}
                  onChange={(e) => setFormData(prev => ({ ...prev, budget_limit: e.target.value, no_limit: false }))}
                  disabled={formData.no_limit}
                  placeholder={formData.no_limit ? 'Tidak ada limit' : 'Masukkan budget limit'}
                />
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="secondary" onClick={resetForm}>
                  Batal
                </Button>
                <Button type="submit" isLoading={submitting}>
                  Simpan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}