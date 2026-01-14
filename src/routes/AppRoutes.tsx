import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner/LoadingSpinner';
import PageTransition from '../components/PageTransition/PageTransition';

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

// Payment success/cancel screens
const StripeSuccess = React.lazy(() => import('../pages/Payments/StripeSuccess'));
const StripeCancel = React.lazy(() => import('../pages/Payments/StripeCancel'));

// Error pages
const NotFound = React.lazy(() => import('../pages/NotFound/NotFound'));

// Shared configuration page
const Share = React.lazy(() => import('../pages/Share/Share'));

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
      <PageTransition>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/account" element={<UserAccount />} />

          {/* Referral Program - Redirect to account with referrals tab */}
          <Route path="/referrals" element={<Navigate to="/account?tab=referrals" replace />} />

          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/panel" element={<AdminDashboard />} />

          {/* Payment Success/Cancel Routes */}
          <Route path="/stripe/success" element={<StripeSuccess />} />
          <Route path="/payment/cancelled" element={<StripeCancel />} />

          {/* Shared Configuration */}
          <Route path="/share/:shareToken" element={<Share />} />

          {/* 404 - Catch all unmatched routes */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </PageTransition>
    </Suspense>
  );
};

export default AppRoutes;
