'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Sidebar } from '@/components/Sidebar';
import { StatusBadge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { formatDate } from '@/lib/utils';
import { usersAPI } from '@/lib/api';
import type { User } from '@/lib/types';

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionUser, setActionUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<'status' | 'role' | 'edit' | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [newRole, setNewRole] = useState('');
  const [editName, setEditName] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.list();
      setUsers(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!actionUser) return;
    setSubmitting(true);
    try {
      await usersAPI.updateStatus(actionUser.id, newStatus);
      setActionUser(null);
      setActionType(null);
      loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!actionUser) return;
    setSubmitting(true);
    try {
      await usersAPI.updateRole(actionUser.id, newRole);
      setActionUser(null);
      setActionType(null);
      loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update role');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUser = (u: User) => {
    setActionUser(u);
    setActionType('edit');
    setEditName(u.name);
    setEditDepartment(u.department || '');
    setEditPassword('');
  };

  const handleSaveEdit = async () => {
    if (!actionUser) return;
    setSubmitting(true);
    try {
      await usersAPI.update(actionUser.id, { name: editName, department: editDepartment });
      if (editPassword) {
        await usersAPI.updatePassword(actionUser.id, editPassword);
      }
      setActionUser(null);
      setActionType(null);
      setEditPassword('');
      loadUsers();
      alert('User updated successfully');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-bg-base">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-[1200px] mx-auto">
          <div className="mb-8">
            <h1 className="text-[24px] font-display font-bold text-text-primary">
              Kelola Pengguna
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              Kelola user dan role pengguna
            </p>
          </div>

          {loading ? (
            <div className="bg-bg-surface border border-border-default rounded-radius-lg p-8 text-center">
              <p className="text-text-secondary">Memuat pengguna...</p>
            </div>
          ) : error ? (
            <div className="bg-bg-surface border border-border-default rounded-radius-lg p-8 text-center">
              <p className="text-danger">{error}</p>
              <Button onClick={loadUsers} className="mt-4">
                Coba Lagi
              </Button>
            </div>
          ) : (
            <div className="bg-bg-surface border border-border-default rounded-radius-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-bg-subtle">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-text-primary">Nama</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-text-primary">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-text-primary">Dept</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-text-primary">Role</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-text-primary">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-text-primary">Bergabung</th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-text-primary">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-bg-subtle/50">
                      <td className="px-6 py-4">
                        <span className="font-medium text-text-primary">{u.name}</span>
                      </td>
                      <td className="px-6 py-4 text-text-secondary">{u.email}</td>
                      <td className="px-6 py-4 text-text-secondary">{u.department || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-radius-sm text-xs font-medium ${
                          u.role === 'admin' ? 'bg-accent/20 text-accent' :
                          u.role === 'manager' ? 'bg-warning/20 text-warning' :
                          'bg-bg-subtle text-text-secondary'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={u.status} />
                      </td>
                      <td className="px-6 py-4 text-text-secondary text-sm">
                        {formatDate(u.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEditUser(u)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setActionUser(u);
                              setActionType('status');
                              setNewStatus(u.status);
                            }}
                          >
                            Status
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setActionUser(u);
                              setActionType('role');
                              setNewRole(u.role);
                            }}
                          >
                            Role
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {actionUser && actionType === 'status' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-surface rounded-radius-lg p-6 w-full max-w-[400px]">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Update Status User
            </h2>
            <div className="mb-6">
              <label className="block text-sm font-medium text-text-primary mb-2">Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-4 py-2.5 bg-bg-surface border border-border-default rounded-radius-md"
              >
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex justify-end gap-4">
              <Button variant="secondary" onClick={() => setActionUser(null)}>
                Batal
              </Button>
              <Button onClick={handleUpdateStatus} isLoading={submitting}>
                Simpan
              </Button>
            </div>
          </div>
        </div>
      )}

      {actionUser && actionType === 'role' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-surface rounded-radius-lg p-6 w-full max-w-[400px]">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Update Role User
            </h2>
            <div className="mb-6">
              <label className="block text-sm font-medium text-text-primary mb-2">Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-4 py-2.5 bg-bg-surface border border-border-default rounded-radius-md"
              >
                <option value="user">User</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex justify-end gap-4">
              <Button variant="secondary" onClick={() => setActionUser(null)}>
                Batal
              </Button>
              <Button onClick={handleUpdateRole} isLoading={submitting}>
                Simpan
              </Button>
            </div>
          </div>
        </div>
      )}

      {actionUser && actionType === 'edit' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-surface rounded-radius-lg p-6 w-full max-w-[400px]">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Edit User
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-primary mb-2">Nama</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-4 py-2.5 bg-bg-surface border border-border-default rounded-radius-md"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-primary mb-2">Email (tidak bisa diubah)</label>
              <input
                type="email"
                value={actionUser.email}
                disabled
                className="w-full px-4 py-2.5 bg-bg-subtle border border-border-default rounded-radius-md opacity-60"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-primary mb-2">Departemen</label>
              <input
                type="text"
                value={editDepartment}
                onChange={(e) => setEditDepartment(e.target.value)}
                placeholder="Departemen"
                className="w-full px-4 py-2.5 bg-bg-surface border border-border-default rounded-radius-md"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-text-primary mb-2">Password Baru (kosongkan jika tidak ingin mengubah)</label>
              <input
                type="password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full px-4 py-2.5 bg-bg-surface border border-border-default rounded-radius-md"
              />
            </div>
            <div className="flex justify-end gap-4">
              <Button variant="secondary" onClick={() => setActionUser(null)}>
                Batal
              </Button>
              <Button onClick={handleSaveEdit} isLoading={submitting}>
                Simpan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}