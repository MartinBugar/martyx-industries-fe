import React from 'react';
import AdminLayout from './AdminLayout';

const AdminProducts: React.FC = () => {
  return (
    <AdminLayout title="Products">
      <div>
        <p>Product management placeholder.</p>
        <ul>
          <li>Add, edit, and remove products here.</li>
          <li>Integrate with your backend API to fetch and manage products.</li>
        </ul>
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
