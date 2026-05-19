'use client';

import { useEffect, useRef, useState, createContext, useContext, ReactNode, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  type: ToastType;
  message: string;
  onClose: () => void;
  duration?: number;
}

export function Toast({ type, message, onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-success" />,
    error: <AlertCircle className="w-5 h-5 text-danger" />,
    info: <Info className="w-5 h-5 text-accent" />,
  };

  const bgColors = {
    success: 'bg-success/10 border-success/30',
    error: 'bg-danger/10 border-danger/30',
    info: 'bg-accent/10 border-accent/30',
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className={`flex items-start gap-3 p-4 rounded-radius-lg border ${bgColors[type]} shadow-lg max-w-[400px] bg-bg-surface`}>
        {icons[type]}
        <p className="flex-1 text-sm text-text-primary">{message}</p>
        <button
          onClick={onClose}
          className="text-text-muted hover:text-text-primary transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'default';
  onConfirm: () => void;
  onCancel?: () => void;
}

export function ConfirmModal({
  title,
  message,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmOptions & { isLoading?: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-surface rounded-radius-lg p-6 w-full max-w-[400px] shadow-xl">
        <h2 className="text-lg font-semibold text-text-primary mb-2">{title}</h2>
        <p className="text-sm text-text-secondary mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={variant === 'danger'}
            className={`px-4 py-2 text-sm font-medium rounded-radius-md transition-colors ${
              variant === 'danger'
                ? 'bg-danger text-white hover:bg-danger/90'
                : variant === 'warning'
                ? 'bg-warning text-white hover:bg-warning/90'
                : 'bg-accent text-white hover:bg-accent/90'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

interface NotificationContextType {
  showToast: (type: ToastType, message: string) => void;
  showConfirm: (options: ConfirmOptions) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);
  const [confirmOptions, setConfirmOptions] = useState<ConfirmOptions | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const onConfirmRef = useRef<(() => void | Promise<void>) | null>(null);

  const showToast = useCallback((type: ToastType, message: string) => {
    setToast({ type, message });
  }, []);

  const showConfirm = useCallback((options: ConfirmOptions) => {
    onConfirmRef.current = options.onConfirm;
    setConfirmOptions(options);
  }, []);

  const handleConfirm = async () => {
    if (onConfirmRef.current) {
      setConfirmLoading(true);
      try {
        await onConfirmRef.current();
      } finally {
        setConfirmLoading(false);
        setConfirmOptions(null);
      }
    }
  };

  const handleCancel = () => {
    if (confirmOptions?.onCancel) {
      confirmOptions.onCancel();
    }
    setConfirmOptions(null);
  };

  return (
    <NotificationContext.Provider value={{ showToast, showConfirm }}>
      {children}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
      {confirmOptions && (
        <ConfirmModal
          title={confirmOptions.title}
          message={confirmOptions.message}
          confirmText={confirmOptions.confirmText}
          cancelText={confirmOptions.cancelText}
          variant={confirmOptions.variant}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          isLoading={confirmLoading}
        />
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}