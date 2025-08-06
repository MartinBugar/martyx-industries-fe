import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import './Header.css';

interface HeaderProps {
  cartItems: number;
  onCartClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ cartItems, onCartClick }) => {
  const {isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      // You could add additional actions after successful logout if needed
    } catch (error) {
      console.error('Error during logout:', error);
      // You could show an error message to the user if needed
    }
  };

  return (
    <header className="shop-header">
      <div className="logo">
        <Link to="/" className="logo-link">
          <h1>Martyx Industries</h1>
        </Link>
      </div>
      
      <nav className="main-nav">
        <ul className="nav-links">
          <li>
            <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/products" className={({ isActive }) => isActive ? 'active' : ''}>
              Products
            </NavLink>
          </li>
          <li>
            <NavLink to="/about" className={({ isActive }) => isActive ? 'active' : ''}>
              About
            </NavLink>
          </li>
          <li>
            <NavLink to="/cart" className={({ isActive }) => isActive ? 'active' : ''}>
              Cart
            </NavLink>
          </li>
        </ul>
      </nav>
      
      <div className="header-actions">
        {isAuthenticated ? (
          <div className="user-menu">
            <NavLink to="/account" className={({ isActive }) => `account-icon ${isActive ? 'active' : ''}`} title="My Account">
            </NavLink>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        ) : (
          <div className="auth-links">
            <NavLink to="/login" className={({ isActive }) => isActive ? 'active' : ''}>
              Login
            </NavLink>
            <NavLink to="/register" className={({ isActive }) => isActive ? 'active' : ''}>
              Register
            </NavLink>
          </div>
        )}
        
        <div className="cart-icon" onClick={onCartClick}>
          {cartItems > 0 && <span className="cart-count">{cartItems}</span>}
        </div>
      </div>
    </header>
  );
};

export default Header;