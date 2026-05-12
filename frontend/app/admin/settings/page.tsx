'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { aiConfigAPI, databaseAPI, departmentsAPI } from '@/lib/api';
import { Database, Download, Upload, Trash2, Plus, TestTube, Save, AlertTriangle, Building2, Edit2, X } from 'lucide-react';
import type { Department } from '@/lib/types';
import { useNotification } from '@/components/Toast';

interface Backup {
  filename: string;
  size: number;
  created_at: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { showToast, showConfirm } = useNotification();
  const [activeTab, setActiveTab] = useState<'ai' | 'database' | 'departments'>('database');

  const [aiConfig, setAiConfig] = useState({ base_url: '', model_name: '', api_key: '', ocr_enabled: true });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSaving, setAiSaving] = useState(false);
  const [aiTesting, setAiTesting] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{ success: boolean; message: string; latency_ms?: number } | null>(null);

  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptLoading, setDeptLoading] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptName, setDeptName] = useState('');
  const [deptDesc, setDeptDesc] = useState('');
  const [deptSaving, setDeptSaving] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadBackups();
      loadAIConfig();
      loadDepartments();
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'departments') loadDepartments();
  }, [activeTab]);

  const loadAIConfig = async () => {
    setAiLoading(true);
    try {
      const res = await aiConfigAPI.get();
      setAiConfig({ 
        base_url: res.data.base_url || '', 
        model_name: res.data.model_name || '', 
        api_key: res.data.has_api_key ? '********' : '',
        ocr_enabled: res.data.ocr_enabled ?? true
      });
    } catch (err) { console.error('Failed to load AI config:', err); }
    finally { setAiLoading(false); }
  };

  const handleSaveAIConfig = async () => {
    setAiSaving(true);
    try {
      const data: any = {};
      if (aiConfig.base_url) data.base_url = aiConfig.base_url;
      if (aiConfig.model_name) data.model_name = aiConfig.model_name;
      if (aiConfig.api_key && !aiConfig.api_key.includes('*')) data.api_key = aiConfig.api_key;
      data.ocr_enabled = aiConfig.ocr_enabled;
      await aiConfigAPI.update(data);
      showToast('success', 'AI configuration saved successfully');
      loadAIConfig();
    } catch (err: any) { showToast('error', err.response?.data?.detail || 'Failed to save AI config'); }
    finally { setAiSaving(false); }
  };

  const handleTestAI = async () => {
    setAiTesting(true);
    setAiTestResult(null);
    try {
      const result = await aiConfigAPI.test();
      setAiTestResult(result.data);
    } catch (err: any) { setAiTestResult({ success: false, message: err.response?.data?.detail || 'Connection test failed' }); }
    finally { setAiTesting(false); }
  };

  const loadBackups = async () => {
    setLoading(true);
    try { const res = await databaseAPI.listBackups(); setBackups(res.data.backups); }
    catch (err) { console.error('Failed to load backups:', err); }
    finally { setLoading(false); }
  };

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const res = await databaseAPI.createBackup();
      showToast('success', `Backup created: ${res.data.filename}`);
      loadBackups();
    } catch (err: any) { showToast('error', err.response?.data?.detail || 'Failed to create backup'); }
    finally { setCreating(false); }
  };

  const handleDownloadBackup = async (filename: string) => {
    try {
      const res = await databaseAPI.downloadBackup(filename);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) { showToast('error', 'Failed to download backup'); }
  };

  const handleRestoreBackup = (filename: string) => {
    showConfirm({
      title: 'Restore Database',
      message: `Restore from backup "${filename}"? Current database will be backed up first.`,
      confirmText: 'Restore', variant: 'warning',
      onConfirm: async () => {
        setRestoring(filename);
        try {
          await databaseAPI.restoreBackup(filename);
          showToast('success', 'Database restored successfully');
          window.location.reload();
        } catch (err: any) { showToast('error', err.response?.data?.detail || 'Failed to restore backup'); }
        finally { setRestoring(null); }
      },
    });
  };

  const handleDeleteBackup = (filename: string) => {
    showConfirm({
      title: 'Delete Backup', message: `Delete backup "${filename}"?`,
      confirmText: 'Delete', variant: 'danger',
      onConfirm: async () => {
        setDeleting(filename);
        try {
          await databaseAPI.deleteBackup(filename);
          showToast('success', 'Backup deleted successfully');
          loadBackups();
        } catch (err: any) { showToast('error', err.response?.data?.detail || 'Failed to delete backup'); }
        finally { setDeleting(null); }
      },
    });
  };

  const loadDepartments = async () => {
    setDeptLoading(true);
    try { const res = await departmentsAPI.list(); setDepartments(res.data); }
    catch (err) { console.error('Failed to load departments:', err); }
    finally { setDeptLoading(false); }
  };

  const handleAddDepartment = async () => {
    if (!deptName.trim()) { showToast('error', 'Nama departemen diperlukan'); return; }
    setDeptSaving(true);
    try {
      await departmentsAPI.create({ name: deptName.trim(), description: deptDesc.trim() || undefined });
      resetDeptForm();
      loadDepartments();
      showToast('success', 'Departemen berhasil ditambahkan');
    } catch (err: any) { showToast('error', err.response?.data?.detail || 'Failed to create department'); }
    finally { setDeptSaving(false); }
  };

  const handleEditDepartment = (dept: Department) => {
    setEditingDept(dept);
    setDeptName(dept.name);
    setDeptDesc(dept.description || '');
  };

  const handleUpdateDepartment = async () => {
    if (!editingDept || !deptName.trim()) { showToast('error', 'Nama departemen diperlukan'); return; }
    setDeptSaving(true);
    try {
      await departmentsAPI.update(editingDept.id, { name: deptName.trim(), description: deptDesc.trim() || undefined });
      resetDeptForm();
      loadDepartments();
      showToast('success', 'Departemen berhasil diupdate');
    } catch (err: any) { showToast('error', err.response?.data?.detail || 'Failed to update department'); }
    finally { setDeptSaving(false); }
  };

  const handleDeleteDepartment = (dept: Department) => {
    showConfirm({
      title: 'Delete Department', message: `Hapus departemen "${dept.name}"?`,
      confirmText: 'Delete', variant: 'danger',
      onConfirm: async () => {
        try {
          await departmentsAPI.delete(dept.id);
          loadDepartments();
          showToast('success', 'Departemen berhasil dihapus');
        } catch (err: any) { showToast('error', err.response?.data?.detail || 'Failed to delete department'); }
      },
    });
  };

  const resetDeptForm = () => { setEditingDept(null); setDeptName(''); setDeptDesc(''); };

  const formatFileSize = (bytes: number) => bytes < 1024 ? bytes + ' B' : bytes < 1024 * 1024 ? (bytes / 1024).toFixed(1) + ' KB' : (bytes / (1024 * 1024)).toFixed(1) + ' MB';

  const formatDate = (isoString: string) => new Date(isoString).toLocaleString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex min-h-screen bg-bg-base">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 md:ml-[240px]">
        <div className="max-w-[900px] mx-auto">
          <div className="mb-6 md:mb-8">
            <h1 className="text-xl md:text-[24px] font-display font-bold text-text-primary">Pengaturan</h1>
            <p className="text-text-secondary text-sm mt-1">Kelola konfigurasi sistem</p>
          </div>

          <div className="flex gap-2 mb-6 border-b border-border-default">
            <button onClick={() => setActiveTab('database')} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'database' ? 'text-accent border-b-2 border-accent' : 'text-text-secondary hover:text-text-primary'}`}>
              <Database className="w-4 h-4 inline mr-2" />Database
            </button>
            <button onClick={() => setActiveTab('departments')} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'departments' ? 'text-accent border-b-2 border-accent' : 'text-text-secondary hover:text-text-primary'}`}>
              <Building2 className="w-4 h-4 inline mr-2" />Departemen
            </button>
            <button onClick={() => setActiveTab('ai')} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'ai' ? 'text-accent border-b-2 border-accent' : 'text-text-secondary hover:text-text-primary'}`}>
              <TestTube className="w-4 h-4 inline mr-2" />AI Config
            </button>
          </div>

          {activeTab === 'database' && (
            <div className="space-y-6">
              <div className="bg-bg-surface border border-border-default rounded-radius-lg p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div>
                    <h3 className="font-medium text-text-primary">Backup Database</h3>
                    <p className="text-sm text-text-secondary mt-1">Buat backup database saat ini</p>
                  </div>
                  <Button onClick={handleCreateBackup} isLoading={creating}><Plus className="w-4 h-4 mr-2" />Buat Backup</Button>
                </div>
              </div>

              <div className="bg-bg-surface border border-border-default rounded-radius-lg p-6">
                <h3 className="font-medium text-text-primary mb-4">Daftar Backup</h3>
                {loading ? <p className="text-text-secondary text-center py-4">Memuat...</p>
                 : backups.length === 0 ? <p className="text-text-secondary text-center py-4">Belum ada backup</p>
                 : <div className="space-y-3">
                  {backups.map((backup) => (
                    <div key={backup.filename} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-4 bg-bg-subtle rounded-radius-md">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-text-primary truncate">{backup.filename}</p>
                        <p className="text-xs text-text-secondary mt-1">{formatDate(backup.created_at)} • {formatFileSize(backup.size)}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={() => handleDownloadBackup(backup.filename)}><Download className="w-4 h-4" /></Button>
                        <Button variant="secondary" size="sm" onClick={() => handleRestoreBackup(backup.filename)} disabled={restoring === backup.filename}>
                          {restoring === backup.filename ? 'Memuat...' : <><Upload className="w-4 h-4 mr-1" />Restore</>}
                        </Button>
                        <Button variant="secondary" size="sm" className="text-danger" onClick={() => handleDeleteBackup(backup.filename)} disabled={deleting === backup.filename}>
                          {deleting === backup.filename ? '...' : <Trash2 className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>}
              </div>

              <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/30 rounded-radius-md">
                <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-warning">Perhatian</p>
                  <p className="text-text-secondary mt-1">Restore database akan mengganti semua data saat ini. Backup otomatis akan dibuat sebelum restore dilakukan.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'departments' && (
            <div className="space-y-6">
              <div className="bg-bg-surface border border-border-default rounded-radius-lg p-6">
                <h3 className="font-medium text-text-primary mb-4">{editingDept ? 'Edit Departemen' : 'Tambah Departemen Baru'}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Nama Departemen *</label>
                    <Input value={deptName} onChange={(e) => setDeptName(e.target.value)} placeholder="Contoh: Engineering, Marketing, HR" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Deskripsi</label>
                    <textarea value={deptDesc} onChange={(e) => setDeptDesc(e.target.value)} placeholder="Deskripsi departemen (opsional)" rows={2} className="w-full px-4 py-2.5 bg-bg-surface border border-border-default rounded-radius-md text-sm resize-none" />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={editingDept ? handleUpdateDepartment : handleAddDepartment} isLoading={deptSaving}>
                      <Save className="w-4 h-4 mr-2" />{editingDept ? 'Simpan Perubahan' : 'Tambah'}
                    </Button>
                    {editingDept && <Button variant="secondary" onClick={resetDeptForm}><X className="w-4 h-4 mr-2" />Batal</Button>}
                  </div>
                </div>
              </div>

              <div className="bg-bg-surface border border-border-default rounded-radius-lg p-6">
                <h3 className="font-medium text-text-primary mb-4">Daftar Departemen</h3>
                {deptLoading ? <p className="text-text-secondary text-center py-4">Memuat...</p>
                 : departments.length === 0 ? <p className="text-text-secondary text-center py-4">Belum ada departemen</p>
                 : <div className="space-y-3">
                  {departments.map((dept) => (
                    <div key={dept.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-4 bg-bg-subtle rounded-radius-md">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-text-primary">{dept.name}</p>
                        <p className="text-xs text-text-secondary mt-1">{dept.description || 'Tidak ada deskripsi'}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={() => handleEditDepartment(dept)}><Edit2 className="w-4 h-4" /></Button>
                        <Button variant="secondary" size="sm" className="text-danger" onClick={() => handleDeleteDepartment(dept)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>}
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="bg-bg-surface border border-border-default rounded-radius-lg p-6">
              {aiLoading ? <p className="text-text-secondary text-center py-4">Memuat...</p>
               : <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-text-primary mb-1">Konfigurasi AI</h3>
                  <p className="text-sm text-text-secondary">Atur koneksi ke AI service untuk ekstraksi kwitansi</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Base URL</label>
                  <Input value={aiConfig.base_url} onChange={(e) => setAiConfig({ ...aiConfig, base_url: e.target.value })} placeholder="https://api.example.com/v1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Model Name</label>
                  <Input value={aiConfig.model_name} onChange={(e) => setAiConfig({ ...aiConfig, model_name: e.target.value })} placeholder="gpt-4o-mini" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">API Key</label>
                  <Input type="password" value={aiConfig.api_key} onChange={(e) => setAiConfig({ ...aiConfig, api_key: e.target.value })} placeholder="Kosongkan jika tidak ingin mengubah" />
                </div>
                <div className="p-4 bg-bg-subtle rounded-radius-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-4">
                      <label className="block text-sm font-medium text-text-primary mb-1">Receipt OCR (Auto-fill)</label>
                      <p className="text-text-muted text-xs">Jika aktif, data struk akan di-extract otomatis untuk pre-fill form. Jika nonaktif, receipt hanya diupload tanpa OCR.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAiConfig({ ...aiConfig, ocr_enabled: !aiConfig.ocr_enabled })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${aiConfig.ocr_enabled ? 'bg-accent' : 'bg-border-default'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${aiConfig.ocr_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
                {aiTestResult && (
                  <div className={`p-4 rounded-radius-md ${aiTestResult.success ? 'bg-success/10 border border-success/30' : 'bg-danger/10 border border-danger/30'}`}>
                    <p className={`font-medium ${aiTestResult.success ? 'text-success' : 'text-danger'}`}>{aiTestResult.success ? 'Connection Successful' : 'Connection Failed'}</p>
                    <p className="text-sm text-text-secondary mt-1">{aiTestResult.message}{aiTestResult.latency_ms && ` (${aiTestResult.latency_ms}ms)`}</p>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button variant="secondary" onClick={handleTestAI} isLoading={aiTesting}><TestTube className="w-4 h-4 mr-2" />Test Connection</Button>
                  <Button onClick={handleSaveAIConfig} isLoading={aiSaving}><Save className="w-4 h-4 mr-2" />Simpan</Button>
                </div>
              </div>}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}