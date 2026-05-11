'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Sidebar } from '@/components/Sidebar';
import { StatusBadge } from '@/components/Badge';
import { Button } from '@/components/Button';
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
      <main className="flex-1 w-full p-4 md:p-8 md:ml-[240px]">
        <div className="max-w-[1200px] mx-auto">
          <div className="mb-6 md:mb-8">
            <h1 className="text-xl md:text-[24px] font-display font-bold text-text-primary">
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
            <>
              {/* Desktop Table View - hidden on mobile */}
              <div className="hidden md:block bg-bg-surface border border-border-default rounded-radius-lg overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-bg-subtle">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-text-primary whitespace-nowrap">Nama</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-text-primary whitespace-nowrap">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-text-primary whitespace-nowrap">Dept</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-text-primary whitespace-nowrap">Role</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-text-primary whitespace-nowrap">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-text-primary whitespace-nowrap">Bergabung</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-text-primary whitespace-nowrap">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-bg-subtle/50">
                        <td className="px-4 py-3">
                          <span className="font-medium text-text-primary text-sm">{u.name}</span>
                        </td>
                        <td className="px-4 py-3 text-text-secondary text-sm max-w-[150px] truncate">{u.email}</td>
                        <td className="px-4 py-3 text-text-secondary text-sm">{u.department || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-radius-sm text-xs font-medium ${
                            u.role === 'admin' ? 'bg-accent/20 text-accent' :
                            u.role === 'manager' ? 'bg-warning/20 text-warning' :
                            'bg-bg-subtle text-text-secondary'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={u.status} />
                        </td>
                        <td className="px-4 py-3 text-text-secondary text-sm whitespace-nowrap">
                          {formatDate(u.created_at)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
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

              {/* Mobile Card View - shown on mobile */}
              <div className="md:hidden space-y-3">
                {users.map((u) => (
                  <div key={u.id} className="bg-bg-surface border border-border-default rounded-radius-lg p-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-text-primary truncate">{u.name}</h3>
                        <p className="text-xs text-text-secondary truncate">{u.email}</p>
                      </div>
                      <StatusBadge status={u.status} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div className="bg-bg-subtle rounded p-2">
                        <span className="text-text-muted block">Dept</span>
                        <span className="text-text-primary font-medium">{u.department || '-'}</span>
                      </div>
                      <div className="bg-bg-subtle rounded p-2">
                        <span className="text-text-muted block">Role</span>
                        <span className={`inline-block px-1.5 py-0.5 rounded-radius-sm text-xs font-medium ${
                          u.role === 'admin' ? 'bg-accent/20 text-accent' :
                          u.role === 'manager' ? 'bg-warning/20 text-warning' :
                          'bg-bg-surface text-text-secondary'
                        }`}>
                          {u.role}
                        </span>
                      </div>
                      <div className="bg-bg-subtle rounded p-2">
                        <span className="text-text-muted block">Bergabung</span>
                        <span className="text-text-primary font-medium">{formatDate(u.created_at)}</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleEditUser(u)}
                        className="flex-1"
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
                        className="flex-1"
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
                        className="flex-1"
                      >
                        Role
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {actionUser && actionType === 'status' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-bg-surface rounded-radius-lg p-6 w-full max-w-[400px] my-auto">
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
            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <Button variant="secondary" onClick={() => setActionUser(null)} className="w-full sm:w-auto">
                Batal
              </Button>
              <Button onClick={handleUpdateStatus} isLoading={submitting} className="w-full sm:w-auto">
                Simpan
              </Button>
            </div>
          </div>
        </div>
      )}

      {actionUser && actionType === 'role' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-bg-surface rounded-radius-lg p-6 w-full max-w-[400px] my-auto">
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
            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <Button variant="secondary" onClick={() => setActionUser(null)} className="w-full sm:w-auto">
                Batal
              </Button>
              <Button onClick={handleUpdateRole} isLoading={submitting} className="w-full sm:w-auto">
                Simpan
              </Button>
            </div>
          </div>
        </div>
      )}

      {actionUser && actionType === 'edit' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-bg-surface rounded-radius-lg p-6 w-full max-w-[400px] my-auto">
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
            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <Button variant="secondary" onClick={() => setActionUser(null)} className="w-full sm:w-auto">
                Batal
              </Button>
              <Button onClick={handleSaveEdit} isLoading={submitting} className="w-full sm:w-auto">
                Simpan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}