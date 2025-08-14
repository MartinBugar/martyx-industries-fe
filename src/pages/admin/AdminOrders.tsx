import React from 'react';
import AdminLayout from './AdminLayout';

const AdminOrders: React.FC = () => {
  return (
    <AdminLayout title="Orders">
      <div>
        <p>Orders management placeholder.</p>
        <ul>
          <li>View and manage customer orders here.</li>
          <li>Integrate with your backend API to list and update orders.</li>
        </ul>
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
