'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] bg-bg-surface rounded-radius-lg border border-border-default p-8 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo.svg" alt="ProvEx" className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-[24px] font-display font-bold text-text-primary">ProvEx</h1>
          <p className="text-text-secondary text-sm mt-1">Masuk ke akun Anda</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@contoh.com"
            required
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          {error && (
            <p className="text-sm text-danger text-center">{error}</p>
          )}

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Masuk
          </Button>
        </form>

        {/* Register link */}
        <p className="text-center text-sm text-text-secondary mt-6">
          Belum punya akun?{' '}
          <a href="/register" className="text-accent hover:underline">
            Daftar di sini
          </a>
        </p>
      </div>
    </div>
  );
}