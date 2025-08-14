import React from 'react';
import AdminLayout from './AdminLayout';

const AdminDashboard: React.FC = () => {
  return (
    <AdminLayout title="Dashboard">
      <div>
        <p>Welcome to the admin dashboard.</p>
        <ul>
          <li>Use the sidebar to navigate between sections.</li>
          <li>Users: manage application users.</li>
          <li>Products: manage products/catalog.</li>
          <li>Orders: review and manage orders.</li>
        </ul>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
