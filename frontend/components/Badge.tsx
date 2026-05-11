'use client';

import { clsx } from 'clsx';
import type { ClaimStatus } from '@/lib/types';

interface BadgeProps {
  variant: 'draft' | 'submitted' | 'revision' | 'approved' | 'rejected' | 'pending' | 'active' | 'inactive';
  children: React.ReactNode;
  className?: string;
}

const variantClasses = {
  draft: 'bg-neutral-subtle text-neutral-text',
  submitted: 'bg-accent-subtle text-accent-text',
  revision: 'bg-warning-subtle text-warning-text',
  approved: 'bg-success-subtle text-success-text',
  rejected: 'bg-danger-subtle text-danger-text',
  pending: 'bg-warning-subtle text-warning-text',
  active: 'bg-success-subtle text-success-text',
  inactive: 'bg-neutral-subtle text-neutral-text',
};

export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-medium whitespace-nowrap',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

interface StatusBadgeProps {
  status: ClaimStatus | 'pending' | 'active' | 'inactive' | 'archived';
  className?: string;
}

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Diajukan',
  revision: 'Perlu Revisi',
  approved: 'Disetujui',
  rejected: 'Ditolak',
  pending: 'Pending',
  active: 'Aktif',
  inactive: 'Nonaktif',
  archived: 'Diarsipkan',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge variant={status as BadgeProps['variant']} className={className}>
      {statusLabels[status] || status}
    </Badge>
  );
}