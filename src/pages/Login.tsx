import React from 'react';
import { useLocation } from 'react-router-dom';
import LoginComponent from '../components/Login/Login';
import './Pages.css';

const Login: React.FC = () => {
  const location = useLocation();

  type Status = 'success' | 'failed' | null;

  // Compute initial confirmation once to avoid flicker on first paint
  const getInitialConfirmation = (): Status => {
    const extract = (query: string | null): Status => {
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

  const confirmation = React.useMemo<Status>(() => getInitialConfirmation(), []);

  // After reading the status, clean the URL so the param doesn't stick around
  React.useEffect(() => {
    const hasQuery = !!location.search;
    const hasHashQuery = typeof window !== 'undefined' && window.location.hash.includes('?');
    const hasStatus = confirmation !== null;
    if (!hasStatus) return;

    try {
      if (typeof window !== 'undefined' && (hasQuery || hasHashQuery)) {
        const fullHash = window.location.hash || '';
        const cleanHash = (() => {
          if (!fullHash) return '';
          const idx = fullHash.indexOf('?');
          return idx === -1 ? fullHash : fullHash.slice(0, idx);
        })();
        const newUrl = location.pathname + cleanHash;
        window.history.replaceState({}, '', newUrl);
      }
    } catch {/* no-op */}
  }, [confirmation, location.pathname, location.search]);

  return (
    <div className="login-page">
      <LoginComponent confirmationStatus={confirmation} />
    </div>
  );
};

export default Login;