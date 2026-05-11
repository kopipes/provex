import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth';
import { NotificationProvider } from '@/components/Toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'ReimburseEasy',
  description: 'Aplikasi Manajemen Reimbursement Berbasis Project',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <AuthProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}