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
export const Contact = lazy(() => import('../pages/Contact/Contact'));
export const Login = lazy(() => import('../pages/Login'));
export const Registration = lazy(() => import('../pages/Registration'));
export const ForgotPassword = lazy(() => import('../pages/ForgotPassword'));
export const ResetPassword = lazy(() => import('../pages/ResetPassword'));
export const ResetPasswordRedirect = lazy(() => import('../pages/ResetPasswordRedirect'));
export const Checkout = lazy(() => import('../pages/Checkout/Checkout'));
export const StripeSuccess = lazy(() => import('../pages/Payments/StripeSuccess'));
export const StripeCancel = lazy(() => import('../pages/Payments/StripeCancel'));
export const CartPage = lazy(() => import('../pages/CartPage/CartPage'));
export const Wishlist = lazy(() => import('../pages/Wishlist/Wishlist'));
export const UserAccount = lazy(() => import('../pages/UserAccount/UserAccount'));
export const UserGallery = lazy(() => import('../pages/UserGallery/UserGallery'));
export const UserGalleryDetail = lazy(() => import('../pages/UserGallery/UserGalleryDetail'));
export const CookiesPolicy = lazy(() => import('../pages/CookiesPolicy/CookiesPolicy'));
export const PrivacyPolicy = lazy(() => import('../pages/PrivacyPolicy/PrivacyPolicy'));
export const TermsOfService = lazy(() => import('../pages/TermsOfService/TermsOfService'));
export const BuildDifficultyGuide = lazy(() => import('../pages/BuildDifficultyGuide/BuildDifficultyGuide'));

// Admin Pages - lazy loaded for better bundle splitting
export const AdminLogin = lazy(() => import('../pages/admin/AdminLogin'));
export const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
export const AdminUsers = lazy(() => import('../pages/admin/AdminUsers'));
export const AdminUserDetail = lazy(() => import('../pages/admin/AdminUserDetail'));
export const AdminProducts = lazy(() => import('../pages/admin/AdminProducts'));
export const AdminInventory = lazy(() => import('../pages/admin/AdminInventory'));
export const AdminProductDetail = lazy(() => import('../pages/admin/AdminProductDetail'));
export const AdminProductGallery = lazy(() => import('../pages/admin/AdminProductGallery'));
export const AdminProduct3DModel = lazy(() => import('../pages/admin/AdminProduct3DModel'));
export const AdminProductDigitalFile = lazy(() => import('../pages/admin/AdminProductDigitalFile'));
export const AdminVariantTabs = lazy(() => import('../pages/admin/AdminVariantTabs'));
export const AdminVariantTabForm = lazy(() => import('../pages/admin/AdminVariantTabForm'));
export const AdminMasterProductTabs = lazy(() => import('../pages/admin/AdminMasterProductTabs'));
export const AdminMasterProductTabForm = lazy(() => import('../pages/admin/AdminMasterProductTabForm'));
export const AdminProductAttachments = lazy(() => import('../pages/admin/AdminProductAttachments'));
export const AdminProductAttachmentForm = lazy(() => import('../pages/admin/AdminProductAttachmentForm'));
export const AdminOrders = lazy(() => import('../pages/admin/AdminOrders'));
export const AdminOrderDetail = lazy(() => import('../pages/admin/AdminOrderDetail'));
export const AdminGallery = lazy(() => import('../pages/admin/AdminGallery'));
export const AdminGalleryUserDetail = lazy(() => import('../pages/admin/AdminGalleryUserDetail'));
export const AdminCassandra = lazy(() => import('../pages/admin/AdminCassandra'));
export const AdminCassandraRanks = lazy(() => import('../pages/admin/AdminCassandraRanks'));
export const AdminCampaigns = lazy(() => import('../pages/admin/AdminCampaigns'));
export const AdminSegments = lazy(() => import('../pages/admin/AdminSegments'));
export const AdminAbandonedCarts = lazy(() => import('../pages/admin/AdminAbandonedCarts'));
export const AdminHomeSettings = lazy(() => import('../pages/admin/AdminHomeSettings'));
export const AdminCompanySettings = lazy(() => import('../pages/admin/AdminCompanySettings'));
export const AdminDiscounts = lazy(() => import('../pages/admin/AdminDiscounts'));
export const AdminReferralConfig = lazy(() => import('../pages/admin/AdminReferralConfig'));
export const AdminCreditUsageConfig = lazy(() => import('../pages/admin/AdminCreditUsageConfig'));
export const AdminEmailTemplates = lazy(() => import('../pages/admin/AdminEmailTemplates'));
export const AdminXpConfig = lazy(() => import('../pages/admin/AdminXpConfig'));
export const AdminInvoices = lazy(() => import('../pages/admin/AdminInvoices'));
export const AdminGiftTiers = lazy(() => import('../pages/admin/AdminGiftTiers'));
export const AdminShippingZones = lazy(() => import('../pages/admin/AdminShippingZones'));
export const AdminManualOrderCreate = lazy(() => import('../pages/admin/AdminManualOrderCreate'));
export const AdminManualOrderHistory = lazy(() => import('../pages/admin/AdminManualOrderHistory'));
export const AdminReviews = lazy(() => import('../pages/admin/AdminReviews'));

// Components - lazy loaded for non-critical features
export const EmailConfirmation = lazy(() => import('../components/EmailConfirmation/EmailConfirmation'));
export const ConstellationParticles = lazy(() => import('../components/effects/ConstellationParticles'));
