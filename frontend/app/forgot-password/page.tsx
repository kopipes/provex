'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);
    try {
      const res = await authAPI.forgotPassword(email.trim());
      setMessage(res.data.message);
      if (!res.data.channel_enabled) {
        setError(
          'Layanan notifikasi belum dikonfigurasi di server. Hubungi administrator.'
        );
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Gagal memproses permintaan. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-display font-bold text-text-primary">Lupa Password</h1>
          <p className="text-text-secondary text-sm mt-1">
            Masukkan email akun Anda untuk menerima kode reset
          </p>
        </div>

        <div className="bg-bg-surface border border-border-default rounded-radius-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@contoh.com"
              required
            />

            {message && (
              <p className="text-sm text-success bg-success/10 py-2 px-3 rounded">
                {message}
              </p>
            )}

            {error && (
              <p className="text-sm text-danger text-center">{error}</p>
            )}

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Kirim Kode Reset
            </Button>
          </form>

          <a
            href="/reset-password"
            className="block text-center text-sm text-accent hover:underline mt-4"
          >
            Sudah punya kode reset? Masukkan di sini
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
