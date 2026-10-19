'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Sidebar } from '@/components/Sidebar';
import { StatusBadge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { projectsAPI, usersAPI, categoriesAPI } from '@/lib/api';
import type { Project, User, Category } from '@/lib/types';
import { Search } from 'lucide-react';
import { useNotification } from '@/components/Toast';

export default function AdminProjectsPage() {
  const { user } = useAuth();
  const { showConfirm, showToast } = useNotification();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
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
    status: 'active',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [searchQuery, projects]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projectsRes, usersRes, categoriesRes] = await Promise.all([
        projectsAPI.list(),
        usersAPI.list(),
        categoriesAPI.list(),
      ]);
      setProjects(projectsRes.data);
      setFilteredProjects(projectsRes.data);
      setUsers(usersRes.data);
      setCategories(categoriesRes.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filterProjects = () => {
    if (searchQuery.trim() === '') {
      setFilteredProjects(projects);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredProjects(
        projects.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            p.description?.toLowerCase().includes(query)
        )
      );
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Nama project wajib diisi';
    if (!formData.start_date) newErrors.start_date = 'Tanggal mulai wajib diisi';
    if (!formData.end_date) newErrors.end_date = 'Tanggal selesai wajib diisi';
    else if (formData.start_date && formData.end_date < formData.start_date) {
      newErrors.end_date = 'Tanggal selesai tidak boleh sebelum tanggal mulai';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setSubmitting(true);
    try {
      const data: any = {
        name: formData.name,
        description: formData.description || undefined,
        start_date: formData.start_date,
        end_date: formData.end_date,
        category_budgets: categories
          .filter((c) => categoryBudgets[c.name] && categoryBudgets[c.name].trim() !== '')
          .map((c) => ({ category: c.name, budget_amount: parseFloat(categoryBudgets[c.name]) }))
          .filter((b) => !isNaN(b.budget_amount) && b.budget_amount >= 0),
      };
      
      if (editingProject) {
        data.status = formData.status;
        await projectsAPI.update(editingProject.id, data);
        showToast('success', 'Project berhasil diupdate');
      } else {
        await projectsAPI.create(data);
        showToast('success', 'Project berhasil dibuat');
      }
      
      resetForm();
      loadData();
    } catch (err: any) {
      showToast('error', err.response?.data?.detail || 'Failed to save project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddNew = () => {
    setEditingProject(null);
    setFormData({
      name: '',
      description: '',
      start_date: '',
      end_date: '',
      status: 'active',
    });
    setErrors({});
    setCategoryBudgets({});
    setShowForm(true);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      start_date: project.start_date,
      end_date: project.end_date || '',
      status: project.status || 'active',
    });
    const budgets: Record<string, string> = {};
    (project.category_budgets || []).forEach((b) => {
      if (b.budget_amount != null) budgets[b.category] = String(b.budget_amount);
    });
    setCategoryBudgets(budgets);
    setErrors({});
    setShowForm(true);
  };

  const handleDelete = (project: Project) => {
    if ((project.claim_count ?? 0) > 0) {
      showToast('error', `Project masih memiliki ${project.claim_count} klaim. Hapus klaim draft/revision terlebih dahulu, atau arsipkan project ini.`);
      return;
    }
    showConfirm({
      title: 'Hapus Project',
      message: `Hapus project "${project.name}"? Project ini tidak memiliki klaim, jadi aman dihapus permanen.`,
      confirmText: 'Hapus',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await projectsAPI.delete(project.id);
          showToast('success', 'Project berhasil dihapus');
          loadData();
        } catch (err: any) {
          showToast('error', err.response?.data?.detail || 'Failed to delete project');
        }
      },
    });
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingProject(null);
    setFormData({ name: '', description: '', start_date: '', end_date: '', status: 'active' });
    setCategoryBudgets({});
    setErrors({});
  };

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex min-h-screen bg-bg-base">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 md:ml-[240px]">
        <div className="max-w-[1200px] mx-auto">
          <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-xl md:text-[24px] font-display font-bold text-text-primary">
                Manajemen Project
              </h1>
              <p className="text-text-secondary text-sm mt-1">
                Kelola semua project
              </p>
            </div>
            <Button onClick={handleAddNew} className="w-full sm:w-auto">
              Project Baru
            </Button>
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama atau deskripsi project..."
                className="w-full pl-10 pr-4 py-2 bg-bg-surface border border-border-default rounded-radius-md text-sm"
              />
            </div>
          </div>

          {loading ? (
            <div className="bg-bg-surface border border-border-default rounded-radius-lg p-8 text-center">
              <p className="text-text-secondary">Memuat project...</p>
            </div>
          ) : error ? (
            <div className="bg-bg-surface border border-border-default rounded-radius-lg p-8 text-center">
              <p className="text-danger">{error}</p>
              <Button onClick={loadData} className="mt-4">Coba Lagi</Button>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="bg-bg-surface border border-border-default rounded-radius-lg p-8 text-center">
              <p className="text-text-secondary">
                {searchQuery ? 'Tidak ada project ditemukan' : 'Tidak ada project'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProjects.map((project) => (
                <div key={project.id} className="bg-bg-surface border border-border-default rounded-radius-lg p-4 md:p-6">
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
                      <span className="text-text-muted">Budget Kategori</span>
                      <p className="font-medium text-text-primary">
                        {(() => {
                          const list = project.category_budgets || [];
                          if (list.length === 0) return 'Tanpa Limit';
                          const total = list.reduce((s, b) => s + (b.budget_amount || 0), 0);
                          return `${list.length} kategori • ${formatCurrency(total)}`;
                        })()}
                      </p>
                    </div>
                    <div>
                      <span className="text-text-muted">Total Klaim</span>
                      <p className="font-medium text-text-primary">{formatCurrency(project.total_claims)}</p>
                    </div>
                    <div>
                      <span className="text-text-muted">Anggota</span>
                      <p className="font-medium text-text-primary">{project.member_count} orang</p>
                    </div>
                    <div>
                      <span className="text-text-muted">Periode</span>
                      <p className="font-medium text-text-primary text-xs md:text-sm">
                        {formatDate(project.start_date)} - {project.end_date ? formatDate(project.end_date) : '-'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border-default flex flex-wrap justify-end items-center gap-2">
                    {(project.claim_count ?? 0) > 0 && (
                      <span className="text-xs text-text-muted mr-auto">
                        {project.claim_count} klaim — tidak dapat dihapus, gunakan Arsipkan
                      </span>
                    )}
                    <Button variant="secondary" size="sm" onClick={() => handleEdit(project)}>Edit</Button>
                    {(project.claim_count ?? 0) === 0 && (
                      <Button variant="secondary" size="sm" className="text-danger" onClick={() => handleDelete(project)}>Hapus</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-surface rounded-radius-lg p-6 w-full max-w-[500px] max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              {editingProject ? 'Edit Project' : 'Project Baru'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Nama Project *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  className={`w-full px-4 py-2.5 bg-bg-surface border rounded-radius-md ${errors.name ? 'border-danger' : 'border-border-default'}`}
                />
                {errors.name && <p className="text-danger text-sm mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Deskripsi</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-bg-surface border border-border-default rounded-radius-md resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Tanggal Mulai *</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => updateFormData('start_date', e.target.value)}
                    className={`w-full px-4 py-2.5 bg-bg-surface border rounded-radius-md ${errors.start_date ? 'border-danger' : 'border-border-default'}`}
                  />
                  {errors.start_date && <p className="text-danger text-sm mt-1">{errors.start_date}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Tanggal Selesai *</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    min={formData.start_date || undefined}
                    onChange={(e) => updateFormData('end_date', e.target.value)}
                    className={`w-full px-4 py-2.5 bg-bg-surface border rounded-radius-md ${errors.end_date ? 'border-danger' : 'border-border-default'}`}
                  />
                  {errors.end_date && <p className="text-danger text-sm mt-1">{errors.end_date}</p>}
                </div>
              </div>
              <div className="border-t border-border-default pt-4">
                <label className="block text-sm font-medium text-text-primary mb-1">Budget per Kategori</label>
                <p className="text-xs text-text-muted mb-3">
                  Kosongkan jika kategori tidak dibatasi. Klaim yang melebihi jatah kategori akan ditolak.
                </p>
                {categories.length === 0 ? (
                  <p className="text-sm text-text-muted">Belum ada kategori. Tambahkan di Pengaturan &gt; Kategori.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {categories.map((c) => (
                      <div key={c.id}>
                        <label className="block text-xs text-text-secondary mb-1">{c.name}</label>
                        <input
                          type="number"
                          min="0"
                          value={categoryBudgets[c.name] || ''}
                          onChange={(e) => setCategoryBudgets((prev) => ({ ...prev, [c.name]: e.target.value }))}
                          placeholder="Tanpa limit"
                          className="w-full px-3 py-2 bg-bg-surface border border-border-default rounded-radius-md"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {editingProject && (
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => updateFormData('status', e.target.value)}
                    className="w-full px-4 py-2.5 bg-bg-surface border border-border-default rounded-radius-md"
                  >
                    <option value="active">Aktif</option>
                    <option value="archived">Diarsipkan</option>
                  </select>
                </div>
              )}
              <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="secondary" onClick={resetForm}>Batal</Button>
                <Button type="submit" isLoading={submitting}>Simpan</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}