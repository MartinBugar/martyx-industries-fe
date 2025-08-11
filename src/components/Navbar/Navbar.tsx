import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import './Navbar.css';
import logoImg from '../../assets/logo/logo.png';

interface NavbarProps {
  cartItems: number;
  onCartClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ cartItems, onCartClick }) => {
  const { isAuthenticated, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleNavLinkClick = () => {
    closeMobileMenu();
  };

  // Body scroll lock, ESC key, and focus first link
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.classList.add('no-scroll');
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') closeMobileMenu();
      };
      window.addEventListener('keydown', onKeyDown);

      // Focus first link in the mobile panel
      const firstLink = panelRef.current?.querySelector<HTMLAnchorElement>('a, button');
      firstLink?.focus();

      return () => {
        window.removeEventListener('keydown', onKeyDown);
        document.body.classList.remove('no-scroll');
      };
    } else {
      document.body.classList.remove('no-scroll');
    }
  }, [isMobileMenuOpen]);

  const NavItems: React.FC<{ onClick?: () => void }> = ({ onClick }) => (
    <ul className="nav-links">
      <li>
        <NavLink to="/" onClick={onClick} className={({ isActive }) => isActive ? 'active' : ''}>
          Home
        </NavLink>
      </li>
      <li>
        <NavLink to="/products" onClick={onClick} className={({ isActive }) => isActive ? 'active' : ''}>
          Products
        </NavLink>
      </li>
      <li>
        <NavLink to="/about" onClick={onClick} className={({ isActive }) => isActive ? 'active' : ''}>
          About
        </NavLink>
      </li>
      <li>
        <NavLink to="/cart" onClick={onClick} className={({ isActive }) => isActive ? 'active' : ''}>
          Cart
        </NavLink>
      </li>
    </ul>
  );

  return (
    <header className={`shop-header ${isMobileMenuOpen ? 'menu-open' : ''}`}>
      <div className="logo">
        <Link to="/" className="logo-link" aria-label="Martyx Industries">
          <img src={logoImg} alt="Martyx Industries" className="logo-img" />
        </Link>
      </div>

      <button
        className={`menu-toggle${isMobileMenuOpen ? ' is-active' : ''}`}
        aria-label="Toggle navigation menu"
        aria-controls="mobile-navigation"
        aria-expanded={isMobileMenuOpen}
        onClick={() => setIsMobileMenuOpen(prev => !prev)}
      >
        <span className="bar"></span>
        <span className="bar"></span>
        <span className="bar"></span>
      </button>
      
      {/* Desktop navigation */}
      <nav id="primary-navigation" className="main-nav">
        <NavItems />
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
        
        <div className="cart-icon" onClick={onCartClick} role="button" aria-label="Open cart" tabIndex={0}>
          {cartItems > 0 && <span className="cart-count">{cartItems}</span>}
        </div>
      </div>

      {/* Mobile overlay menu */}
      <div
        className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`}
        onClick={closeMobileMenu}
        aria-hidden={!isMobileMenuOpen}
      >
        <div
          className="mobile-menu-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-navigation"
          onClick={(e) => e.stopPropagation()}
          ref={panelRef}
        >
          <div className="mobile-menu-header">
            <Link to="/" className="logo-link" onClick={closeMobileMenu} aria-label="Martyx Industries">
              <img src={logoImg} alt="Martyx Industries" className="logo-img" />
            </Link>
            <button className="mobile-close-btn" aria-label="Close menu" onClick={closeMobileMenu}>✕</button>
          </div>
          <nav id="mobile-navigation" className="mobile-nav">
            <NavItems onClick={handleNavLinkClick} />
          </nav>
          <div className="mobile-actions">
            {isAuthenticated ? (
              <>
                <NavLink to="/account" onClick={handleNavLinkClick} className={({ isActive }) => `mobile-account ${isActive ? 'active' : ''}`}>My Account</NavLink>
                <button className="logout-btn full" onClick={() => { handleLogout(); closeMobileMenu(); }}>Logout</button>
              </>
            ) : (
              <div className="mobile-auth">
                <NavLink to="/login" onClick={handleNavLinkClick} className={({ isActive }) => isActive ? 'active' : ''}>Login</NavLink>
                <NavLink to="/register" onClick={handleNavLinkClick} className={({ isActive }) => isActive ? 'active' : ''}>Register</NavLink>
              </div>
            )}
            <button className="mobile-cart-btn" onClick={() => { onCartClick(); closeMobileMenu(); }}>
              View Cart {cartItems > 0 ? `(${cartItems})` : ''}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
