'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { useAuth } from '@/lib/auth';
import {
  LayoutDashboard,
  FolderOpen,
  Receipt,
  History,
  Users,
  FileText,
  Settings,
  ScanLine,
  Activity,
  LogOut,
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!user) return null;

  const isManagerOrAdmin = user.role === 'manager' || user.role === 'admin';
  const isAdmin = user.role === 'admin';

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', show: true },
    { href: '/projects', icon: FolderOpen, label: 'Project', show: true },
    { href: '/claims/new', icon: Receipt, label: 'Klaim', show: true },
    { href: '/history', icon: History, label: 'Riwayat', show: true },
    { separator: true, show: isManagerOrAdmin },
    { href: '/admin/claims', icon: FileText, label: 'Semua Klaim', show: isManagerOrAdmin },
    { href: '/admin/users', icon: Users, label: 'Pengguna', show: isManagerOrAdmin },
    { separator: true, show: isAdmin },
    { href: '/admin/projects', icon: FolderOpen, label: 'Manajemen Project', show: isAdmin },
    { href: '/admin/settings/ai', icon: ScanLine, label: 'Pengaturan AI', show: isAdmin },
    { href: '/admin/audit-log', icon: Activity, label: 'Audit Log', show: isAdmin },
  ].filter((item) => item.show);

  return (
    <aside className="w-[240px] min-h-screen bg-bg-inverse text-white flex flex-col">
      {/* Header */}
      <div className="h-14 px-4 flex items-center border-b border-white/10">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <Receipt className="w-4 h-4" />
          </div>
          <span className="font-display font-semibold text-lg">ReimburseEasy</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item, index) => {
          if ('separator' in item && item.separator) {
            return (
              <div key={`sep-${index}`} className="my-4">
                <div className="border-t border-white/10" />
              </div>
            );
          }

          const Icon = item.icon!;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href!}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-accent/20 text-accent'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon className="w-[18px] h-[18px]" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-sm font-medium">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-white/50 capitalize">{user.role}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}