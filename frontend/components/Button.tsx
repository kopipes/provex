'use client';

import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  size?: 'sm' | 'md';
  isLoading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-body font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-accent text-white hover:bg-accent-hover active:scale-[0.98]',
    secondary: 'bg-bg-subtle text-text-primary border border-border-default hover:bg-border-default active:scale-[0.98]',
    destructive: 'bg-danger-subtle text-danger-text hover:bg-danger/10 active:scale-[0.98]',
    ghost: 'bg-transparent text-text-secondary hover:bg-bg-subtle active:scale-[0.98]',
  };
  
  const sizeClasses = {
    sm: 'h-[30px] px-3 text-[13px] rounded-radius-md',
    md: 'h-[36px] px-4 text-[14px] rounded-radius-md',
  };

  return (
    <button
      className={clsx(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.196a8 8 0 010-11.313V0C10.373 8 17 8 17 8h-4z" />
          </svg>
          Processing...
        </>
      ) : (
        children
      )}
    </button>
  );
}