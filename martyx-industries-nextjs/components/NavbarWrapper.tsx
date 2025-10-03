'use client';

import React from 'react';
import Navbar from './Navbar';
import { useCart } from '@/context/useCart';
import { useAuth } from '@/context/useAuth';

const NavbarWrapper: React.FC = () => {
  const { items } = useCart();
  const { user, logout } = useAuth();
  
  const cartCount = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <Navbar 
      cartCount={cartCount}
      user={user}
      onLogout={logout}
    />
  );
};

export default NavbarWrapper;
