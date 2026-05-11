'use client';

import { useAuth } from '@/lib/auth';
import { Sidebar } from '@/components/Sidebar';
import { StatusBadge } from '@/components/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-bg-base">
      <Sidebar />
      <main className="flex-1 p-8 md:ml-[240px]">
        <div className="max-w-[1100px] mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-[24px] font-display font-bold text-text-primary">
              Dashboard
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              Selamat datang, {user?.name}
            </p>
          </div>

          {/* Placeholder content */}
          <div className="bg-bg-surface border border-border-default rounded-radius-lg p-8 text-center">
            <p className="text-text-secondary">
              Dashboard akan menampilkan project Anda dan klaim terbaru.
            </p>
            <p className="text-text-muted text-sm mt-2">
              Koneksikan ke backend untuk melihat data.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}