/**
 * Lazy imports for code splitting optimization
 * This file centralizes all lazy imports for better bundle optimization
 */

import { lazy } from 'react';

// Pages - lazy loaded for better performance
export const Home = lazy(() => import('../pages/Home/Home'));
export const Products = lazy(() => import('../pages/Products/Products'));
export const ProductDetail = lazy(() => import('../pages/ProductDetail/ProductDetail'));
export const About = lazy(() => import('../pages/About/About'));
export const Login = lazy(() => import('../pages/Login'));
export const Registration = lazy(() => import('../pages/Registration'));
export const ForgotPassword = lazy(() => import('../pages/ForgotPassword'));
export const ResetPassword = lazy(() => import('../pages/ResetPassword'));
export const ResetPasswordRedirect = lazy(() => import('../pages/ResetPasswordRedirect'));
export const Checkout = lazy(() => import('../pages/Checkout/Checkout'));
export const PayPalSuccess = lazy(() => import('../pages/Payments/PayPalSuccess'));
export const PayPalCancel = lazy(() => import('../pages/Payments/PayPalCancel'));
export const CartPage = lazy(() => import('../pages/CartPage/CartPage'));
export const UserAccount = lazy(() => import('../pages/UserAccount/UserAccount'));
export const CookiesPolicy = lazy(() => import('../pages/CookiesPolicy/CookiesPolicy'));
export const PrivacyPolicy = lazy(() => import('../pages/PrivacyPolicy/PrivacyPolicy'));
export const TermsOfService = lazy(() => import('../pages/TermsOfService/TermsOfService'));

// Admin Pages - lazy loaded for better bundle splitting
export const AdminLogin = lazy(() => import('../pages/admin/AdminLogin'));
export const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
export const AdminUsers = lazy(() => import('../pages/admin/AdminUsers'));
export const AdminUserDetail = lazy(() => import('../pages/admin/AdminUserDetail'));
export const AdminProducts = lazy(() => import('../pages/admin/AdminProducts'));
export const AdminProductDetail = lazy(() => import('../pages/admin/AdminProductDetail'));
export const AdminOrders = lazy(() => import('../pages/admin/AdminOrders'));

// Components - lazy loaded for non-critical features
export const EmailConfirmation = lazy(() => import('../components/EmailConfirmation/EmailConfirmation'));
export const ConstellationParticles = lazy(() => import('../components/effects/ConstellationParticles'));
