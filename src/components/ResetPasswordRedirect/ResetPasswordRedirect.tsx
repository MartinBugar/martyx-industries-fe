import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

/**
 * Component to handle redirects from backend reset-password endpoint to frontend reset-password page
 * This component is used when a user clicks on a reset password link in their email
 * The backend sends them to /api/auth/reset-password?token=xxx, which is redirected to this component
 * This component then redirects them to the frontend reset-password page with the token
 */
const ResetPasswordRedirect: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    // Extract token from URL
    const token = searchParams.get('token');
    
    if (token) {
      // Redirect to frontend reset-password page with token
      navigate(`/reset-password?token=${token}`, { replace: true });
    } else {
      // If no token is found, redirect to forgot-password page
      navigate('/forgot-password', { replace: true });
    }
  }, [navigate, searchParams]);
  
  // Show loading message while redirecting
  return (
    <div className="redirect-container">
      <h2>Redirecting...</h2>
      <p>Please wait while we redirect you to the password reset page.</p>
    </div>
  );
};

export default ResetPasswordRedirect;