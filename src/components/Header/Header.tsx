import React from 'react';
import './Header.css';

interface HeaderProps {
  cartItems: number;
  onCartClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ cartItems, onCartClick }) => {
  return (
    <header className="shop-header">
      <div className="logo">
        <h1>Martyx Industries</h1>
      </div>
      <div className="cart-icon" onClick={onCartClick}>
        {cartItems > 0 && <span className="cart-count">{cartItems}</span>}
      </div>
    </header>
  );
};

export default Header;