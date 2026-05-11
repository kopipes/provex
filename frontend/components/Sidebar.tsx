'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { useAuth } from '@/lib/auth';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FolderOpen,
  Receipt,
  History,
  Users,
  FileText,
  ScanLine,
  Activity,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [pathname, isMobile]);

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

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile menu button */}
      {isMobile && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="fixed top-4 left-4 z-50 p-2 bg-bg-inverse text-bg-inverse rounded-lg shadow-lg"
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      )}

      {/* Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'w-[240px] min-h-screen bg-bg-inverse text-bg-inverse flex flex-col fixed left-0 top-0 z-40 transition-transform duration-300 ease-in-out',
          isMobile ? 'pt-16' : '',
          isMobile && !isOpen ? '-translate-x-full' : 'translate-x-0'
        )}
      >
        {/* Header */}
        <div className="h-14 px-4 flex items-center border-b border-border-default">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-white">
              <Receipt className="w-4 h-4" />
            </div>
            <span className="font-display font-semibold text-lg text-bg-inverse">ReimburseEasy</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item, index) => {
            if ('separator' in item && item.separator) {
              return (
                <div key={`sep-${index}`} className="my-4">
                  <div className="border-t border-border-default" />
                </div>
              );
            }

            const Icon = item.icon!;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href!}
                onClick={() => isMobile && setIsOpen(false)}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-accent/20 text-accent'
                    : 'text-bg-inverse/70 hover:text-bg-inverse hover:bg-accent/10'
                )}
              >
                <Icon className="w-[18px] h-[18px]" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-border-default">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-sm font-medium text-white">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-bg-inverse">{user.name}</p>
              <p className="text-xs text-bg-inverse/50 capitalize">{user.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-accent/10 transition-colors text-bg-inverse"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}