import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import './Header.css';

interface HeaderProps {
  cartItems: number;
  onCartClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ cartItems, onCartClick }) => {
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
        </ul>
      </nav>
      
      <div className="cart-icon" onClick={onCartClick}>
        {cartItems > 0 && <span className="cart-count">{cartItems}</span>}
      </div>
    </header>
  );
};

export default Header;