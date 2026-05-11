'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Sidebar } from '@/components/Sidebar';
import { StatusBadge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { formatDate } from '@/lib/utils';
import { usersAPI, departmentsAPI } from '@/lib/api';
import type { User, Department } from '@/lib/types';
import { UserPlus, Search } from 'lucide-react';

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [deptLoading, setDeptLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionUser, setActionUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<'status' | 'role' | 'edit' | 'add' | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [newRole, setNewRole] = useState('');
  const [editName, setEditName] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Add user form state
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addDepartment, setAddDepartment] = useState('');
  const [addRole, setAddRole] = useState('user');

  useEffect(() => {
    loadUsers();
    loadDepartments();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(
          (u) =>
            u.name.toLowerCase().includes(query) ||
            u.email.toLowerCase().includes(query) ||
            (u.department && u.department.toLowerCase().includes(query))
        )
      );
    }
  }, [searchQuery, users]);

  const loadDepartments = async () => {
    setDeptLoading(true);
    try {
      const response = await departmentsAPI.list();
      setDepartments(response.data);
    } catch (err) {
      console.error('Failed to load departments:', err);
    } finally {
      setDeptLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.list();
      setUsers(response.data);
      setFilteredUsers(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!addName || !addEmail || !addPassword) {
      alert('Name, email, and password are required');
      return;
    }
    setSubmitting(true);
    try {
      await usersAPI.create({
        name: addName,
        email: addEmail,
        password: addPassword,
        department: addDepartment || undefined,
        role: addRole,
      });
      setActionUser(null);
      setActionType(null);
      resetAddForm();
      loadUsers();
      alert('User created successfully');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const resetAddForm = () => {
    setAddName('');
    setAddEmail('');
    setAddPassword('');
    setAddDepartment('');
    setAddRole('user');
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
      <main className="flex-1 p-4 md:p-8 md:ml-[240px]">
        <div className="max-w-[1200px] mx-auto">
          <div className="mb-6 md:mb-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
              <div>
                <h1 className="text-xl md:text-[24px] font-display font-bold text-text-primary">
                  Kelola Pengguna
                </h1>
                <p className="text-text-secondary text-sm mt-1">
                  Kelola user dan role pengguna
                </p>
              </div>
              <Button onClick={() => { setActionType('add'); setActionUser(null); }} className="w-full sm:w-auto">
                <UserPlus className="w-4 h-4 mr-2" />
                Tambah User
              </Button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama, email, atau departemen..."
                className="w-full pl-10 pr-4 py-2 bg-bg-surface border border-border-default rounded-radius-md text-sm"
              />
            </div>
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
          ) : filteredUsers.length === 0 ? (
            <div className="bg-bg-surface border border-border-default rounded-radius-lg p-8 text-center">
              <p className="text-text-secondary">
                {searchQuery ? 'Tidak ada pengguna ditemukan' : 'Belum ada pengguna'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((u) => (
                <div key={u.id} className="bg-bg-surface border border-border-default rounded-radius-lg p-4 md:p-5">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-accent rounded-full flex items-center justify-center text-white font-medium text-sm md:text-base">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-text-primary truncate">{u.name}</h3>
                        <p className="text-xs md:text-sm text-text-secondary truncate">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={u.status} />
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4 text-sm">
                    <div className="bg-bg-subtle rounded-lg p-3">
                      <span className="text-text-muted text-xs block">Departemen</span>
                      <span className="text-text-primary font-medium">{u.department || '-'}</span>
                    </div>
                    <div className="bg-bg-subtle rounded-lg p-3">
                      <span className="text-text-muted text-xs block">Role</span>
                      <span className={`inline-block px-2 py-0.5 rounded-radius-sm text-xs font-medium ${
                        u.role === 'admin' ? 'bg-accent/20 text-accent' :
                        u.role === 'manager' ? 'bg-warning/20 text-warning' :
                        'bg-bg-surface text-text-secondary'
                      }`}>
                        {u.role}
                      </span>
                    </div>
                    <div className="bg-bg-subtle rounded-lg p-3 col-span-2 md:col-span-1">
                      <span className="text-text-muted text-xs block">Bergabung</span>
                      <span className="text-text-primary font-medium">{formatDate(u.created_at)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-border-default">
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
          )}
        </div>
      </main>

      {/* Add User Modal */}
      {actionType === 'add' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-surface rounded-radius-lg p-6 w-full max-w-[400px]">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Tambah User Baru
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Nama</label>
                <Input
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="Nama lengkap"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Email</label>
                <Input
                  type="email"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Password</label>
                <Input
                  type="password"
                  value={addPassword}
                  onChange={(e) => setAddPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Departemen</label>
                <select
                  value={addDepartment}
                  onChange={(e) => setAddDepartment(e.target.value)}
                  className="w-full px-4 py-2.5 bg-bg-surface border border-border-default rounded-radius-md"
                >
                  <option value="">Pilih Departemen</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Role</label>
                <select
                  value={addRole}
                  onChange={(e) => setAddRole(e.target.value)}
                  className="w-full px-4 py-2.5 bg-bg-surface border border-border-default rounded-radius-md"
                >
                  <option value="user">User</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6">
              <Button variant="secondary" onClick={() => { setActionType(null); resetAddForm(); }} className="w-full sm:w-auto">
                Batal
              </Button>
              <Button onClick={handleAddUser} isLoading={submitting} className="w-full sm:w-auto">
                Simpan
              </Button>
            </div>
          </div>
        </div>
      )}

      {actionUser && actionType === 'status' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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
              <select
                value={editDepartment}
                onChange={(e) => setEditDepartment(e.target.value)}
                className="w-full px-4 py-2.5 bg-bg-surface border border-border-default rounded-radius-md"
              >
                <option value="">Pilih Departemen</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.name}>{dept.name}</option>
                ))}
              </select>
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