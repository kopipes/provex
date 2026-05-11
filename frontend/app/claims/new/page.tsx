'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { uploadAPI, projectsAPI, claimsAPI } from '@/lib/api';
import type { Project, ClaimCategory } from '@/lib/types';

const CATEGORIES: ClaimCategory[] = ['Makanan', 'Transport', 'Akomodasi', 'Lain-lain'];

export default function NewClaimPage() {
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  const [formData, setFormData] = useState({
    project_id: '',
    merchant_name: '',
    transaction_date: '',
    amount: '',
    category: '' as ClaimCategory | '',
    description: '',
    receipt_number: '',
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await projectsAPI.list();
      setProjects(response.data);
    } catch (err) {
      console.error('Failed to load projects');
    } finally {
      setLoadingProjects(false);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.project_id) newErrors.project_id = 'Pilih project';
    if (!formData.merchant_name) newErrors.merchant_name = 'Nama merchant wajib diisi';
    if (!formData.transaction_date) newErrors.transaction_date = 'Tanggal transaksi wajib diisi';
    if (!formData.amount) newErrors.amount = 'Jumlah wajib diisi';
    else if (parseFloat(formData.amount) <= 0) newErrors.amount = 'Jumlah harus lebih dari 0';
    if (!formData.category) newErrors.category = 'Pilih kategori';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    
    if (!validate()) return;
    
    setLoading(true);
    try {
      await claimsAPI.create({
        project_id: parseInt(formData.project_id),
        merchant_name: formData.merchant_name,
        transaction_date: formData.transaction_date,
        amount: parseFloat(formData.amount),
        category: formData.category as ClaimCategory,
        description: formData.description || undefined,
        receipt_number: formData.receipt_number || undefined,
        receipt_image_path: uploadedPath || undefined,
      });
      router.push('/history');
    } catch (err: any) {
      setSubmitError(err.response?.data?.detail || 'Gagal membuat klaim');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="flex min-h-screen bg-bg-base">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-[700px] mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-[24px] font-display font-bold text-text-primary">
              Klaim Baru
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              Ajukan klaim reimbursement Anda
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-bg-surface border border-border-default rounded-radius-lg p-6 space-y-6">
            {submitError && (
              <div className="p-4 bg-danger/10 border border-danger/20 rounded-radius-md">
                <p className="text-danger text-sm">{submitError}</p>
              </div>
            )}

            {/* Project Selection */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Project
              </label>
              <select
                value={formData.project_id}
                onChange={(e) => handleChange('project_id', e.target.value)}
                className="w-full px-4 py-2.5 bg-bg-surface border border-border-default rounded-radius-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
              >
                <option value="">Pilih Project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              {errors.project_id && (
                <p className="text-danger text-sm mt-1">{errors.project_id}</p>
              )}
            </div>

            {/* Merchant Name */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Nama Merchant / Toko
              </label>
              <Input
                placeholder="Contoh: Warung Mang Sule"
                value={formData.merchant_name}
                onChange={(e) => handleChange('merchant_name', e.target.value)}
                error={errors.merchant_name}
              />
            </div>

            {/* Transaction Date & Amount */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Tanggal Transaksi
                </label>
                <input
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) => handleChange('transaction_date', e.target.value)}
                  className="w-full px-4 py-2.5 bg-bg-surface border border-border-default rounded-radius-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                />
                {errors.transaction_date && (
                  <p className="text-danger text-sm mt-1">{errors.transaction_date}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Jumlah (Rp)
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.amount}
                  onChange={(e) => handleChange('amount', e.target.value)}
                  error={errors.amount}
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Kategori
              </label>
              <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleChange('category', cat)}
                    className={`px-4 py-3 rounded-radius-md border text-sm font-medium transition-colors ${
                      formData.category === cat
                        ? 'bg-accent text-white border-accent'
                        : 'bg-bg-surface border-border-default text-text-primary hover:border-accent/50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              {errors.category && (
                <p className="text-danger text-sm mt-1">{errors.category}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Deskripsi (Opsional)
              </label>
              <textarea
                placeholder="Tambahkan deskripsi jika diperlukan..."
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 bg-bg-surface border border-border-default rounded-radius-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent resize-none"
              />
            </div>

            {/* Receipt Number */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Nomor Struk / Kwitansi (Opsional)
              </label>
              <Input
                placeholder="Contoh: STR-2025-001"
                value={formData.receipt_number}
                onChange={(e) => handleChange('receipt_number', e.target.value)}
              />
            </div>

            {/* Receipt Image Upload */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Foto Struk / Kwitansi (Opsional)
              </label>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  
                  setReceiptFile(file);
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setReceiptPreview(reader.result as string);
                  };
                  reader.readAsDataURL(file);
                  
                  // Upload file
                  setUploadingFile(true);
                  try {
                    const response = await uploadAPI.uploadReceipt(file);
                    setUploadedPath(response.data.path);
                  } catch (err) {
                    console.error('Upload failed:', err);
                    alert('Gagal upload file');
                    setReceiptFile(null);
                    setReceiptPreview(null);
                  } finally {
                    setUploadingFile(false);
                  }
                }}
                className="hidden"
              />
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-radius-lg p-6 text-center cursor-pointer transition-colors ${
                  receiptPreview 
                    ? 'border-accent bg-accent/5' 
                    : 'border-border-default hover:border-accent/50'
                }`}
              >
                {uploadingFile ? (
                  <div className="text-text-secondary">
                    <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-2" />
                    <p>Mengupload...</p>
                  </div>
                ) : receiptPreview ? (
                  <div>
                    <img 
                      src={receiptPreview} 
                      alt="Receipt preview" 
                      className="max-h-40 mx-auto rounded-radius-md mb-2"
                    />
                    <p className="text-sm text-text-secondary">
                      {receiptFile?.name}
                    </p>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setReceiptFile(null);
                        setReceiptPreview(null);
                        setUploadedPath(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="mt-2 text-sm text-danger hover:underline"
                    >
                      Hapus
                    </button>
                  </div>
                ) : (
                  <div className="text-text-secondary">
                    <div className="w-12 h-12 bg-bg-subtle rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="font-medium text-text-primary">Klik untuk upload foto</p>
                    <p className="text-sm mt-1">PNG, JPG, atau JPEG (maks. 5MB)</p>
                  </div>
                )}
              </div>
              {uploadedPath && (
                <p className="text-sm text-success mt-2">✓ Foto berhasil diupload</p>
              )}
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-4 pt-4 border-t border-border-default">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
              >
                Batal
              </Button>
              <Button type="submit" isLoading={loading}>
                Ajukan Klaim
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}