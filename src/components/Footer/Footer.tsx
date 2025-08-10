import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-top">
          <div className="footer-section">
            <h3>About Us</h3>
            <ul className="footer-links">
              <li><Link to="/about">Our Story</Link></li>
              <li><Link to="/about">Team</Link></li>
              <li><Link to="/about">Careers</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>Customer Service</h3>
            <ul className="footer-links">
              <li><Link to="/about">Contact Us</Link></li>
              <li><Link to="/about">FAQ</Link></li>
              <li><Link to="/products">Shipping & Returns</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>Legal</h3>
            <ul className="footer-links">
              <li><Link to="/about">Terms of Service</Link></li>
              <li><Link to="/about">Privacy Policy</Link></li>
              <li><Link to="/about">Cookie Policy</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>Connect With Us</h3>
            <div className="social-links">
              <a href="#" aria-label="Facebook">📱</a>
              <a href="#" aria-label="Twitter">📲</a>
              <a href="#" aria-label="Instagram">📷</a>
              <a href="#" aria-label="LinkedIn">💼</a>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {currentYear} 3D Model Shop. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;