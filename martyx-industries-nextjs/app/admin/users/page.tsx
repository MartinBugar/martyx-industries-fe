'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isTokenExpired } from '@/lib/services/api';
import AdminLayout from '../components/AdminLayout';
import styles from './Users.module.css';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

export default function AdminUsers() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'user' | 'admin'>('all');

  // Check admin authentication
  useEffect(() => {
    const hasWindow = typeof window !== 'undefined';
    const adminFlag = hasWindow && window.localStorage.getItem('adminAuthed') === 'true';
    const token = hasWindow ? window.localStorage.getItem('token') : null;
    const validToken = !!token && !isTokenExpired(token);

    if (!adminFlag || !validToken) {
      router.replace('/admin');
      return;
    }

    loadUsers();
  }, [router]);

  const loadUsers = async () => {
    try {
      // Mock data - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockUsers: User[] = [
        {
          id: '1',
          email: 'john.doe@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'user',
          createdAt: '2024-01-15T10:30:00Z',
          lastLogin: '2024-01-20T14:22:00Z',
          isActive: true
        },
        {
          id: '2',
          email: 'admin@martyx-industries.com',
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin',
          createdAt: '2023-12-01T09:00:00Z',
          lastLogin: '2024-01-21T08:15:00Z',
          isActive: true
        },
        {
          id: '3',
          email: 'jane.smith@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          role: 'user',
          createdAt: '2024-01-10T16:45:00Z',
          lastLogin: '2024-01-19T11:30:00Z',
          isActive: false
        }
      ];

      setUsers(mockUsers);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load users:', error);
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleUserStatus = async (userId: string) => {
    // Mock toggle - replace with actual API call
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, isActive: !user.isActive }
        : user
    ));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading users...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.usersContainer}>
        <div className={styles.usersHeader}>
          <h1>User Management</h1>
          <div className={styles.headerActions}>
            <button className={styles.refreshButton} onClick={loadUsers}>
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filtersContainer}>
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          
          <div className={styles.filterContainer}>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as 'all' | 'user' | 'admin')}
              className={styles.filterSelect}
            >
              <option value="all">All Roles</option>
              <option value="user">Users</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className={styles.tableContainer}>
          <table className={styles.usersTable}>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th>Last Login</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className={!user.isActive ? styles.inactiveRow : ''}>
                  <td>
                    <div className={styles.userInfo}>
                      <div className={styles.userAvatar}>
                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                      </div>
                      <div>
                        <div className={styles.userName}>
                          {user.firstName} {user.lastName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`${styles.roleBadge} ${styles[user.role]}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>{user.lastLogin ? formatDate(user.lastLogin) : 'Never'}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${user.isActive ? styles.active : styles.inactive}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        onClick={() => toggleUserStatus(user.id)}
                        className={`${styles.actionButton} ${user.isActive ? styles.deactivate : styles.activate}`}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className={styles.emptyState}>
              <p>No users found matching your criteria.</p>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className={styles.summaryStats}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{users.length}</div>
            <div className={styles.statLabel}>Total Users</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{users.filter(u => u.isActive).length}</div>
            <div className={styles.statLabel}>Active Users</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{users.filter(u => u.role === 'admin').length}</div>
            <div className={styles.statLabel}>Administrators</div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
