'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Users, Search, Trash2, UserPlus, GraduationCap, BookOpen, Loader2, UserCheck, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/apiClient';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  
  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createRole, setCreateRole] = useState<'student' | 'teacher'>('student');
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  
  // Action states
  const [deleting, setDeleting] = useState('');
  const [toggling, setToggling] = useState('');

  const { toast } = useToast();

  // Fetch users
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page: page.toString(),
        limit: '20'
      };
      
      if (roleFilter !== 'all') params.role = roleFilter;
      if (search) params.search = search;

      const data = await api.get('/admin/users', params);

      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load users',
        variant: 'destructive'
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [roleFilter, page, search, toast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Create user
  const handleCreateUser = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      toast({
        title: 'Validation Error',
        description: 'All fields are required',
        variant: 'destructive'
      });
      return;
    }

    setCreating(true);
    try {
      await api.post('/admin/users', {
        ...formData,
        role: createRole
      });

      toast({
        title: 'Success',
        description: `${createRole === 'student' ? 'Student' : 'Teacher'} account created successfully`
      });

      setCreateModalOpen(false);
      setFormData({ name: '', email: '', password: '' });
      loadUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create user',
        variant: 'destructive'
      });
    } finally {
      setCreating(false);
    }
  };

  // Toggle user active status
  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    setToggling(userId);
    try {
      await api.patch(`/admin/users/${userId}`, {
        isActive: !currentStatus
      });

      toast({
        title: 'Success',
        description: `User ${!currentStatus ? 'activated' : 'suspended'} successfully`
      });

      loadUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user status',
        variant: 'destructive'
      });
    } finally {
      setToggling('');
    }
  };

  // Delete user
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return;
    }

    setDeleting(userId);
    try {
      await api.delete(`/admin/users/${userId}`);

      toast({
        title: 'Success',
        description: 'User deleted successfully'
      });

      loadUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user',
        variant: 'destructive'
      });
    } finally {
      setDeleting('');
    }
  };

  const roleColors: Record<string, string> = {
    student: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    teacher: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  };

  return (
    <DashboardLayout requiredRole="admin">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage all users in the institution</p>
        </div>

        {/* Add User Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="cursor-pointer transition-all hover:shadow-md border-2 hover:border-primary/50" onClick={() => { setCreateRole('student'); setCreateModalOpen(true); }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Add New Student
                </CardTitle>
                <CardDescription>Create a new student account for the institution</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full" size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Create Student Account
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition-all hover:shadow-md border-2 hover:border-primary/50" onClick={() => { setCreateRole('teacher'); setCreateModalOpen(true); }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-green-600 dark:text-green-400" />
                  Add New Teacher
                </CardTitle>
                <CardDescription>Create a new teacher account for the institution</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full" size="sm" variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                Create Teacher Account
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={v => { setRoleFilter(v); setPage(1); }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="student">Students</SelectItem>
              <SelectItem value="teacher">Teachers</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users ({total})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14" />)}
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No users found.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground uppercase border-b">
                  <div className="col-span-3">Name</div>
                  <div className="col-span-3">Email</div>
                  <div className="col-span-2">Role</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-1">Joined</div>
                  <div className="col-span-1 text-right">Actions</div>
                </div>
                {users.map(user => (
                  <div key={user.id} className="grid grid-cols-12 gap-4 px-4 py-3 items-center rounded-lg border hover:bg-muted/50">
                    <div className="col-span-3 font-medium truncate">{user.name}</div>
                    <div className="col-span-3 text-sm text-muted-foreground truncate">{user.email}</div>
                    <div className="col-span-2">
                      <Badge className={`text-xs ${roleColors[user.role] || ''}`}>
                        {user.role}
                      </Badge>
                    </div>
                    <div className="col-span-2 flex items-center gap-2">
                      <Switch
                        checked={user.isActive}
                        onCheckedChange={() => handleToggleStatus(user.id, user.isActive)}
                        disabled={toggling === user.id}
                      />
                      <span className={`text-xs ${user.isActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {user.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </div>
                    <div className="col-span-1 text-xs text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString('en-GB')}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        disabled={deleting === user.id}
                      >
                        {deleting === user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {total > 20 && (
              <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">Page {page} of {Math.ceil(total / 20)}</span>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total}>
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create User Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {createRole === 'student' ? 'Create Student Account' : 'Create Teacher Account'}
            </DialogTitle>
            <DialogDescription>
              Add a new {createRole} to the institution. They can log in immediately after creation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@example.com"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter a secure password"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser} disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Create User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
