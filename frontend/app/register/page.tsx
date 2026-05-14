'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      await authAPI.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        department: formData.department || undefined,
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

          <Input
            label="Departemen"
            type="text"
            name="department"
            value={formData.department}
            onChange={handleChange}
            placeholder="Contoh: Engineering"
          />

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