import React from 'react';
import { useLocation } from 'react-router-dom';
import LoginComponent from '../components/Login/Login';
import './Pages.css';
import '../components/Login/Login.css';

const Login: React.FC = () => {
  const location = useLocation();

  // Extract confirmation status from query or hash (in case some redirects put it there)
  const getConfirmation = (): 'success' | 'failed' | null => {
    const extract = (query: string | null) => {
      if (!query) return null;
      const params = new URLSearchParams(query);
      const raw =
        params.get('confirmation') ??
        params.get('status') ??
        params.get('confirm') ??
        params.get('confirmed');
      const v = raw ? raw.toLowerCase().trim() : null;
      if (!v) return null;
      if (['success', 'confirmed', 'true', 'ok', '200'].includes(v)) return 'success';
      if (['failed', 'error', 'false', '400', '401', '403', '404'].includes(v)) return 'failed';
      return null;
    };

    const fromSearch = extract(location.search);
    if (fromSearch) return fromSearch;

    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
      const qIndex = hash.indexOf('?');
      if (qIndex !== -1) {
        const hashQuery = hash.slice(qIndex);
        return extract(hashQuery);
      }
    }
    return null;
  };

  const confirmation = getConfirmation();

  return (
    <div className="page-container login-page">
      <LoginComponent confirmationStatus={confirmation} />
    </div>
  );
};

export default Login;