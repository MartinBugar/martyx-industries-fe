import React, { useState, useEffect } from 'react';
import './DevelopmentGate.css';

interface DevelopmentGateProps {
  onAccess: () => void;
}

const DevelopmentGate: React.FC<DevelopmentGateProps> = ({ onAccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('dev-access');
    if (stored === 'granted') {
      setIsAuthenticated(true);
      onAccess();
    }
  }, [onAccess]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'demo') {
      sessionStorage.setItem('dev-access', 'granted');
      setIsAuthenticated(true);
      onAccess();
    } else {
      setError('Nesprávne heslo');
      setPassword('');
    }
  };

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="development-gate">
      <div className="gate-content">
        <div className="gate-header">
          <img
            src="/cassandra/Home-Cass.png"
            alt="Cassandra Home"
            className="cassandra-image"
          />
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
  );
};

export default DevelopmentGate;