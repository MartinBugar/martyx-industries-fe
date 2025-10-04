import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner/LoadingSpinner';

// Lazy load hlavných stránok
const Home = React.lazy(() => import('../pages/Home/Home'));
const Products = React.lazy(() => import('../pages/Products/Products'));
const ProductDetail = React.lazy(() => import('../pages/ProductDetail/ProductDetail'));
const About = React.lazy(() => import('../pages/About/About'));
const Contact = React.lazy(() => import('../pages/Contact/Contact'));
const Wishlist = React.lazy(() => import('../pages/Wishlist/Wishlist'));
const CartPage = React.lazy(() => import('../pages/CartPage/CartPage'));
const UserAccount = React.lazy(() => import('../pages/UserAccount/UserAccount'));

// Admin stránky (môžu byť v separátnom bundle)
const AdminLogin = React.lazy(() => import('../pages/admin/AdminLogin'));
const AdminDashboard = React.lazy(() => import('../pages/admin/AdminDashboard'));

// Loading component s vašimi farbami
const PageLoader: React.FC = () => (
  <div style={{
    minHeight: '60vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--background)'
  }}>
    <LoadingSpinner size="large" />
  </div>
);

const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/account" element={<UserAccount />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/panel" element={<AdminDashboard />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
