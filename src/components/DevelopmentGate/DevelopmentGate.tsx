import React, { useState, useEffect } from 'react';
import './DevelopmentGate.css';
import { devGateService } from '../../services/devGateService';
import { logInfo, logError } from '../../services/logger';

interface DevelopmentGateProps {
  onAccess: () => void;
}

const DevelopmentGate: React.FC<DevelopmentGateProps> = ({ onAccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkGateStatus = async () => {
      try {
        // Check if dev gate is enabled on backend
        const status = await devGateService.getStatus();

        if (!status.enabled) {
          // Gate is disabled, grant access immediately
          logInfo('🔓 Dev gate is disabled, granting access');
          setIsAuthenticated(true);
          onAccess();
          setIsLoading(false);
          return;
        }

        // Gate is enabled, check session storage
        const stored = sessionStorage.getItem('dev-access');
        if (stored === 'granted') {
          logInfo('✅ Dev gate session valid');
          setIsAuthenticated(true);
          onAccess();
        }
      } catch (error) {
        logError('❌ Failed to check dev gate status:', error);
        // On error, assume gate is disabled for better UX
        setIsAuthenticated(true);
        onAccess();
      } finally {
        setIsLoading(false);
      }
    };

    checkGateStatus();
  }, [onAccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      logInfo('🔐 Validating dev gate password...');
      const result = await devGateService.validatePassword(password);

      if (result.valid) {
        logInfo('✅ Dev gate password valid');
        sessionStorage.setItem('dev-access', 'granted');
        setIsAuthenticated(true);
        onAccess();
      } else {
        logError('❌ Invalid dev gate password');
        setError('Nesprávne heslo');
        setPassword('');
      }
    } catch (error) {
      logError('❌ Failed to validate dev gate password:', error);
      setError('Chyba pri overovaní hesla. Skúste znova.');
      setPassword('');
    }
  };

  if (isAuthenticated) {
    return null;
  }

  // Show loading state while checking gate status
  if (isLoading) {
    return (
      <div className="development-gate">
        <div className="gate-right" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="gate-content">
            <div className="gate-header">
              <h1>MARTYX INDUSTRIES</h1>
              <h2>Načítavam...</h2>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="development-gate">
      {/* Left side - Cassandra Image */}
      <div className="gate-left">
        <img
          src="/cassandra/Home-Cass.png"
          alt="Cassandra"
          className="gate-cassandra-image"
        />
      </div>

      {/* Right side - Access Form */}
      <div className="gate-right">
        <div className="gate-content">
          <div className="gate-header">
            <h1>MARTYX INDUSTRIES</h1>
            <h2>Vývojová verzia</h2>
          </div>

          <div className="gate-message">
            <p>
              Táto webová stránka je momentálne v procese vývoja.
              Pre prístup zadajte heslo.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="gate-form">
          <div className="input-group">
            <label htmlFor="password">Heslo:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Zadajte heslo"
              className={error ? 'error' : ''}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="access-button">
            Vstúpiť
          </button>
        </form>

        <div className="gate-footer">
          <p>© 2024 MARTYX INDUSTRIES</p>
        </div>
        </div>
      </div>
    </div>
  );
};

export default DevelopmentGate;