'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isTokenExpired } from '@/lib/services/api';
import AdminLayout from '../components/AdminLayout';
import styles from './Dashboard.module.css';

// Mock data interfaces - replace with actual API calls
interface VisitorAnalytics {
  totalVisitors: number;
  uniqueVisitors: number;
  pageViews: number;
  bounceRate: number;
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'error';
  uptime: string;
  responseTime: number;
  errorRate: number;
}

interface RevenueSummary {
  totalRevenue: number;
  monthlyRevenue: number;
  orderCount: number;
  averageOrderValue: number;
}

interface KPICardProps {
  label: string;
  value: string | number;
  loading?: boolean;
  error?: string;
  accent?: 'blue' | 'green';
}

const KPICard: React.FC<KPICardProps> = ({ label, value, loading, error, accent = 'blue' }) => {
  return (
    <div className={`${styles.kpiCard} ${styles[`accent${accent.charAt(0).toUpperCase() + accent.slice(1)}`]}`}>
      <div className={styles.kpiLabel}>{label}</div>
      {loading ? (
        <div className={styles.kpiLoading}>Loading…</div>
      ) : error ? (
        <div className={styles.kpiError}>{error}</div>
      ) : (
        <div className={styles.kpiValue}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
      )}
    </div>
  );
};

interface SectionPillProps {
  label: string;
  color: 'blue' | 'green';
}

const SectionPill: React.FC<SectionPillProps> = ({ label, color }) => {
  return (
    <div className={styles.sectionHeader}>
      <div className={`${styles.sectionPill} ${styles[`pill${color.charAt(0).toUpperCase() + color.slice(1)}`]}`}>
        {label}
      </div>
      <div className={styles.sectionDivider}></div>
    </div>
  );
};

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [visitorData, setVisitorData] = useState<VisitorAnalytics | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueSummary | null>(null);
  const [activeSection, setActiveSection] = useState<'status' | 'visitors' | 'revenue'>('status');

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

    // Load dashboard data
    loadDashboardData();
  }, [router]);

  const loadDashboardData = async () => {
    try {
      // Mock data - replace with actual API calls
      await new Promise(resolve => setTimeout(resolve, 1000));

      setVisitorData({
        totalVisitors: 12543,
        uniqueVisitors: 8932,
        pageViews: 45621,
        bounceRate: 32.5
      });

      setSystemHealth({
        status: 'healthy',
        uptime: '99.9%',
        responseTime: 145,
        errorRate: 0.02
      });

      setRevenueData({
        totalRevenue: 45230,
        monthlyRevenue: 12450,
        orderCount: 234,
        averageOrderValue: 193.5
      });

      setLoading(false);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuthed');
    localStorage.removeItem('token');
    
    // Clear cookies
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'adminAuthed=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    router.push('/admin');
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading dashboard...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.dashboardContainer}>
        <div className={styles.dashboardHeader}>
          <h1>Admin Dashboard</h1>
          <div className={styles.headerActions}>
            <button onClick={loadDashboardData} className={styles.refreshButton}>
              Refresh Data
            </button>
            <button onClick={handleLogout} className={styles.logoutButton}>
              Logout
            </button>
          </div>
        </div>

        {/* Navigation Pills */}
        <div className={styles.sectionNav}>
          <button
            className={`${styles.navPill} ${activeSection === 'status' ? styles.active : ''}`}
            onClick={() => setActiveSection('status')}
          >
            System Status
          </button>
          <button
            className={`${styles.navPill} ${activeSection === 'visitors' ? styles.active : ''}`}
            onClick={() => setActiveSection('visitors')}
          >
            Visitor Analytics
          </button>
          <button
            className={`${styles.navPill} ${activeSection === 'revenue' ? styles.active : ''}`}
            onClick={() => setActiveSection('revenue')}
          >
            Revenue Analytics
          </button>
        </div>

        {/* System Status Section */}
        {activeSection === 'status' && (
          <div className={styles.section}>
            <SectionPill label="System Health" color="blue" />
            <div className={styles.kpiGrid}>
              <KPICard
                label="System Status"
                value={systemHealth?.status === 'healthy' ? 'Healthy' : 'Issues Detected'}
                accent="blue"
              />
              <KPICard
                label="Uptime"
                value={systemHealth?.uptime || 'N/A'}
                accent="green"
              />
              <KPICard
                label="Response Time"
                value={systemHealth?.responseTime ? `${systemHealth.responseTime}ms` : 'N/A'}
                accent="blue"
              />
              <KPICard
                label="Error Rate"
                value={systemHealth?.errorRate ? `${systemHealth.errorRate}%` : 'N/A'}
                accent="green"
              />
            </div>
          </div>
        )}

        {/* Visitor Analytics Section */}
        {activeSection === 'visitors' && (
          <div className={styles.section}>
            <SectionPill label="Visitor Analytics" color="green" />
            <div className={styles.kpiGrid}>
              <KPICard
                label="Total Visitors"
                value={visitorData?.totalVisitors || 0}
                accent="blue"
              />
              <KPICard
                label="Unique Visitors"
                value={visitorData?.uniqueVisitors || 0}
                accent="green"
              />
              <KPICard
                label="Page Views"
                value={visitorData?.pageViews || 0}
                accent="blue"
              />
              <KPICard
                label="Bounce Rate"
                value={visitorData?.bounceRate ? `${visitorData.bounceRate}%` : 'N/A'}
                accent="green"
              />
            </div>
          </div>
        )}

        {/* Revenue Analytics Section */}
        {activeSection === 'revenue' && (
          <div className={styles.section}>
            <SectionPill label="Revenue Analytics" color="blue" />
            <div className={styles.kpiGrid}>
              <KPICard
                label="Total Revenue"
                value={revenueData?.totalRevenue ? `€${revenueData.totalRevenue.toLocaleString()}` : 'N/A'}
                accent="green"
              />
              <KPICard
                label="Monthly Revenue"
                value={revenueData?.monthlyRevenue ? `€${revenueData.monthlyRevenue.toLocaleString()}` : 'N/A'}
                accent="blue"
              />
              <KPICard
                label="Order Count"
                value={revenueData?.orderCount || 0}
                accent="green"
              />
              <KPICard
                label="Avg. Order Value"
                value={revenueData?.averageOrderValue ? `€${revenueData.averageOrderValue}` : 'N/A'}
                accent="blue"
              />
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className={styles.quickActions}>
          <h3>Quick Actions</h3>
          <div className={styles.actionGrid}>
            <button className={styles.actionButton} onClick={() => router.push('/admin/users')}>
              Manage Users
            </button>
            <button className={styles.actionButton} onClick={() => router.push('/admin/products')}>
              Manage Products
            </button>
            <button className={styles.actionButton} onClick={() => router.push('/admin/orders')}>
              View Orders
            </button>
            <button className={styles.actionButton} onClick={loadDashboardData}>
              Refresh Analytics
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
