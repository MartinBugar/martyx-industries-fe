import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registrationService } from '../../services/registrationService';
import './Registration.css';

interface RegistrationFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

const Registration: React.FC = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<RegistrationFormData>({
    email: '',
    password: '',
    confirmPassword: ''
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
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all required fields');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Password validation
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    // Password confirmation validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Process registration
    setIsProcessing(true);
    setError(null);
    
    try {
      const success = await registrationService.register(formData.email, formData.password);
      
      if (success) {
        // Redirect to home page after successful registration
        navigate('/');
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err) {
      setError('An error occurred during registration. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="registration-container">
      <div className="registration-form-container">
        <h2>Create an Account</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form className="registration-form" onSubmit={handleSubmit}>
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
              minLength={6}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="register-btn"
            disabled={isProcessing}
          >
            {isProcessing ? 'Creating Account...' : 'Register'}
          </button>
        </form>
        
        <div className="registration-footer">
          <p>Already have an account? <Link to="/login">Login here</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Registration;