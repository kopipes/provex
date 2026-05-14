'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, departmentsAPI } from '@/lib/api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';

interface Department {
  id: number;
  name: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department_id: '',
  });
  const [error, setError] = useState('');

  // Fetch departments on mount
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await departmentsAPI.listPublic();
        setDepartments(res.data);
      } catch (err) {
        console.error('Failed to fetch departments:', err);
      } finally {
        setDepartmentsLoading(false);
      }
    };
    fetchDepartments();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Password tidak cocok');
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    setIsLoading(true);

    try {
      // Find department name from selected ID
      const selectedDept = departments.find(d => d.id === Number(formData.department_id));
      
      await authAPI.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        department: selectedDept?.name || undefined,
      });
      
      // Redirect to login with success message
      router.push('/?registered=true');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registrasi gagal. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] bg-bg-surface rounded-radius-lg border border-border-default p-8 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="ProvEx" className="w-48 h-auto mx-auto mb-4" />
          <p className="text-text-secondary text-sm mt-1">Daftar akun baru</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Nama Lengkap"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Masukkan nama lengkap"
            required
          />

          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="email@contoh.com"
            required
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-primary">
              Departemen
            </label>
            {departmentsLoading ? (
              <select
                className="w-full px-3 py-2 bg-bg-surface border border-border-default rounded-radius-md text-text-secondary"
                disabled
              >
                <option>Memuat...</option>
              </select>
            ) : departments.length > 0 ? (
              <select
                name="department_id"
                value={formData.department_id}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-bg-surface border border-border-default rounded-radius-md text-text-primary"
              >
                <option value="">Pilih departemen</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                type="text"
                name="department"
                value={formData.department_id}
                onChange={handleChange}
                placeholder="Contoh: Engineering"
              />
            )}
          </div>

          <Input
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Minimal 6 karakter"
            required
          />

          <Input
            label="Konfirmasi Password"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Masukkan password lagi"
            required
          />

          {error && (
            <p className="text-sm text-danger text-center">{error}</p>
          )}

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Daftar
          </Button>
        </form>

        {/* Login link */}
        <p className="text-center text-sm text-text-secondary mt-6">
          Sudah punya akun?{' '}
          <a href="/" className="text-accent hover:underline">
            Masuk di sini
          </a>
        </p>

        {/* Info */}
        <p className="text-center text-xs text-text-secondary mt-4">
          Setelah mendaftar, akun Anda akan aktif setelah disetujui oleh administrator.
        </p>
      </div>
    </div>
  );
}