import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import './Login.css';

interface LoginFormData {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear error when user starts typing again
    if (error) setError(null);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Process login
    setIsProcessing(true);
    setError(null);
    
    try {
      const success = await login(formData.email, formData.password);
      
      if (success) {
        // Redirect to home page after successful login
        navigate('/');
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('An error occurred during login. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="login-container">
      <div className="login-form-container">
        <h2>Login to Your Account</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="login-btn"
            disabled={isProcessing}
          >
            {isProcessing ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="login-footer">
          <p>Don't have an account? <Link to="/register">Register here</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;