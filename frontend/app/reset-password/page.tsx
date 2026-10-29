'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { ArrowLeft } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pre-fill the code when arriving from a Notiv action link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('token');
    if (fromUrl) {
      setToken(fromUrl);
      window.history.replaceState({}, '', '/reset-password');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Password tidak cocok');
      return;
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authAPI.resetPassword(token.trim(), password);
      setSuccess(res.data.message || 'Password berhasil diubah.');
      setTimeout(() => router.push('/'), 1800);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Gagal mengubah password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-display font-bold text-text-primary">Reset Password</h1>
          <p className="text-text-secondary text-sm mt-1">
            Masukkan kode reset yang dikirim melalui Notiv
          </p>
        </div>

        <div className="bg-bg-surface border border-border-default rounded-radius-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Kode Reset"
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Tempel kode dari notifikasi"
              required
            />

            <Input
              label="Password Baru"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              required
            />

            <Input
              label="Konfirmasi Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi password baru"
              required
            />

            {success && (
              <p className="text-sm text-success bg-success/10 py-2 px-3 rounded">
                {success}
              </p>
            )}

            {error && (
              <p className="text-sm text-danger text-center">{error}</p>
            )}

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Simpan Password Baru
            </Button>
          </form>

          <a
            href="/forgot-password"
            className="block text-center text-sm text-accent hover:underline mt-4"
          >
            Minta kode reset baru
          </a>
        </div>

        <p className="text-center mt-6">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke halaman masuk
          </a>
        </p>
      </div>
    </div>
  );
}
