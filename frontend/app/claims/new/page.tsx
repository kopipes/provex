'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { uploadAPI, projectsAPI, claimsAPI, aiConfigAPI } from '@/lib/api';
import type { Project, ClaimCategory } from '@/lib/types';
import { Camera, Upload, Loader2 } from 'lucide-react';

const CATEGORIES: ClaimCategory[] = ['Makanan', 'Transport', 'Akomodasi', 'Lain-lain'];

export default function NewClaimPage() {
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [extractingData, setExtractingData] = useState(false);
  const [ocrEnabled, setOcrEnabled] = useState(true);
  
  // Step 1: Show upload screen first
  const [hasReceipt, setHasReceipt] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  
  // Step 2: Form data
  const [formData, setFormData] = useState({
    project_id: '',
    merchant_name: '',
    transaction_date: '',
    amount: '',
    category: '' as ClaimCategory | '',
    description: '',
    receipt_number: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    loadProjects();
    loadOcrSetting();
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

  const loadOcrSetting = async () => {
    try {
      const response = await aiConfigAPI.getOcrSetting();
      setOcrEnabled(response.data.ocr_enabled);
    } catch (err) {
      console.error('Failed to load OCR setting');
      setOcrEnabled(true); // Default to enabled
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

  const processFile = async (file: File) => {
    setReceiptFile(file);
    
    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setReceiptPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    // Upload file
    setUploadingFile(true);
    setExtractingData(ocrEnabled);
    try {
      // Upload first
      const uploadResponse = await uploadAPI.uploadReceipt(file);
      setUploadedPath(uploadResponse.data.path);
      
      // Only extract data if OCR is enabled
      if (ocrEnabled) {
        // Convert to base64 for OCR
        const base64 = await fileToBase64(file);
        
        // Try to extract data using AI
        try {
          console.log('Calling AI extract endpoint...');
          const response = await aiConfigAPI.extract(base64);
          console.log('AI response:', response.data);
          
          if (response.data.success && response.data.data) {
            const extracted = response.data.data;
            console.log('Extracted data:', extracted);
            
            // Update form data with extracted values
            setFormData(current => {
              const newData = { ...current };
              if (extracted.merchant_name) newData.merchant_name = extracted.merchant_name;
              if (extracted.transaction_date) newData.transaction_date = extracted.transaction_date;
              if (extracted.amount) newData.amount = extracted.amount.toString();
              if (extracted.total_amount && !newData.amount) newData.amount = extracted.total_amount.toString();
              if (extracted.category) {
                const matchedCat = CATEGORIES.find(c => 
                  c.toLowerCase() === extracted.category!.toLowerCase() ||
                  extracted.category!.toLowerCase().includes(c.toLowerCase())
                );
                if (matchedCat) newData.category = matchedCat;
              }
              if (extracted.description) newData.description = extracted.description;
              if (extracted.receipt_number) newData.receipt_number = extracted.receipt_number;
              return newData;
            });
          } else if (response.data.error) {
            console.log('AI extraction error:', response.data.error);
          }
        } catch (extractErr) {
          console.error('AI extraction failed:', extractErr);
        }
      }
      
      // Show form after everything is done
      setHasReceipt(true);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Gagal upload file');
      setReceiptFile(null);
      setReceiptPreview(null);
      setHasReceipt(false);
    } finally {
      setUploadingFile(false);
      setExtractingData(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Remove data URL prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleSkipReceipt = () => {
    setHasReceipt(true);
  };

  const handleRemoveReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    setUploadedPath(null);
    setHasReceipt(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  // If no receipt uploaded yet, show upload screen
  if (!hasReceipt) {
    return (
      <div className="flex min-h-screen bg-bg-base">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 md:ml-[240px]">
          <div className="max-w-lg mx-auto">
            <div className="mb-6 md:mb-8">
              <h1 className="text-xl md:text-2xl font-display font-bold text-text-primary">
                Klaim Baru
              </h1>
              <p className="text-text-secondary text-sm mt-1">
                Upload atau foto struk untuk auto-fill data
              </p>
            </div>

            <div className="bg-bg-surface border border-border-default rounded-radius-lg p-6">
              {/* Upload from gallery */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFile}
                className="w-full border-2 border-dashed border-border-default rounded-radius-lg p-8 text-center cursor-pointer hover:border-accent/50 transition-colors mb-4 disabled:opacity-50"
              >
                {uploadingFile ? (
                  <div className="text-text-secondary">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto mb-3 text-accent" />
                    <p className="font-medium">{extractingData ? 'Mengekstrak data...' : 'Mengupload...'}</p>
                    <p className="text-sm mt-1">Mohon tunggu...</p>
                  </div>
                ) : (
                  <div className="text-text-secondary">
                    <div className="w-16 h-16 bg-bg-subtle rounded-full flex items-center justify-center mx-auto mb-4">
                      <Upload className="w-8 h-8 text-accent" />
                    </div>
                    <p className="font-medium text-text-primary">Upload dari Galeri</p>
                    <p className="text-sm mt-1">Pilih foto struk atau kwitansi</p>
                    <p className="text-xs text-text-muted mt-2">PNG, JPG, atau JPEG (maks. 5MB)</p>
                  </div>
                )}
              </button>

              {/* Take photo with camera */}
              <input
                type="file"
                ref={cameraInputRef}
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => cameraInputRef.current?.click()}
                disabled={uploadingFile}
                className="w-full border-2 border-dashed border-border-default rounded-radius-lg p-8 text-center cursor-pointer hover:border-accent/50 transition-colors disabled:opacity-50"
              >
                <div className="text-text-secondary">
                  <div className="w-16 h-16 bg-bg-subtle rounded-full flex items-center justify-center mx-auto mb-4">
                    <Camera className="w-8 h-8 text-accent" />
                  </div>
                  <p className="font-medium text-text-primary">Ambil Foto</p>
                  <p className="text-sm mt-1">Gunakan kamera untuk foto struk</p>
                </div>
              </button>

              {/* Skip option */}
              <div className="mt-6 pt-6 border-t border-border-default text-center">
                <button
                  onClick={handleSkipReceipt}
                  className="text-sm text-text-secondary hover:text-accent transition-colors"
                >
                  Lewati dan isi manual →
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show form after receipt uploaded or skipped
  return (
    <div className="flex min-h-screen bg-bg-base">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 md:ml-[240px]">
        <div className="max-w-[700px] mx-auto">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <h1 className="text-xl md:text-2xl font-display font-bold text-text-primary">
              Klaim Baru
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              {receiptPreview ? 'Data struk telah di-extract. Lengkapi jika perlu.' : 'Ajukan klaim reimbursement Anda'}
            </p>
          </div>

          {/* Receipt Preview (if uploaded) */}
          {receiptPreview && (
            <div className="mb-6 bg-bg-surface border border-border-default rounded-radius-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-text-primary">Struk yang diupload</span>
                <button
                  onClick={handleRemoveReceipt}
                  className="text-sm text-danger hover:underline"
                >
                  Hapus
                </button>
              </div>
              <div className="flex items-center gap-4">
                <img 
                  src={receiptPreview} 
                  alt="Receipt" 
                  className="w-20 h-20 object-cover rounded-radius-md"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary truncate">{receiptFile?.name}</p>
                  {uploadedPath && (
                    <p className="text-xs text-success mt-1">✓ Foto berhasil diupload</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-bg-surface border border-border-default rounded-radius-lg p-4 md:p-6 space-y-5 md:space-y-6">
            {submitError && (
              <div className="p-4 bg-danger/10 border border-danger/20 rounded-radius-md">
                <p className="text-danger text-sm">{submitError}</p>
              </div>
            )}

            {/* Project Selection */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Project *
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
                Nama Merchant / Toko *
              </label>
              <Input
                placeholder="Contoh: Warung Mang Sule"
                value={formData.merchant_name}
                onChange={(e) => handleChange('merchant_name', e.target.value)}
                error={errors.merchant_name}
              />
            </div>

            {/* Transaction Date & Amount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Tanggal Transaksi *
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
                  Jumlah (Rp) *
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
                Kategori *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleChange('category', cat)}
                    className={`px-3 py-2 md:px-4 md:py-3 rounded-radius-md border text-sm font-medium transition-colors ${
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

            {/* Description / Items */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Deskripsi / Item (Opsional)
              </label>
              <textarea
                placeholder="Daftar item yang dibeli atau deskripsi transaksi..."
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

            {/* Submit */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border-default">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
                className="w-full sm:w-auto"
              >
                Batal
              </Button>
              <Button type="submit" isLoading={loading} className="w-full sm:w-auto">
                Ajukan Klaim
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}