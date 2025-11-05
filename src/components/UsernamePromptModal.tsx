import React, { useState } from 'react';
import { profileService } from '../services/profileService';
import './UsernamePromptModal.css';

interface UsernamePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Modal that prompts user to set their username before posting reviews or uploading photos to public gallery.
 *
 * User flow:
 * - When user tries to write review/upload photo without username
 * - Modal appears with friendly message
 * - User can set username now or skip (auto-generated later)
 */
const UsernamePromptModal: React.FC<UsernamePromptModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await profileService.setUsername(username);
      if (result.success) {
        onSuccess();
      } else {
        setError(result.message || 'Nepodarilo sa nastaviť username');
      }
    } catch (err: any) {
      // Handle specific error messages from backend
      if (err.message) {
        setError(err.message);
      } else {
        setError('Nepodarilo sa nastaviť username. Skúste to znova.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    // User skipped - will get auto-generated username (User123)
    onSuccess();
  };

  if (!isOpen) return null;

  return (
    <div className="username-modal-overlay" onClick={onClose}>
      <div className="username-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="username-modal-close" onClick={onClose} aria-label="Zavrieť">
          ×
        </button>

        <h2>Nastavte si verejné meno</h2>
        <p className="username-modal-description">
          Odporúčame nastaviť verejné meno pre lepšiu identifikáciu v komentároch a galérii.
          <br />
          Ak preskočíte, vygenerujeme vám náhodné meno (napr. "User12345"), ktoré si môžete kedykoľvek zmeniť v profile.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Verejné meno (username)</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="napr. peter123"
              pattern="^[a-zA-Z0-9_]{3,20}$"
              title="Username musí mať 3-20 znakov a môže obsahovať len písmená, čísla a podčiarkovník"
              disabled={isSubmitting}
            />
            <small className="form-hint">
              3-20 znakov, len písmená, čísla a podčiarkovník
            </small>
          </div>

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          <div className="username-modal-actions">
            <button
              type="submit"
              className="primary-btn"
              disabled={isSubmitting || !username.trim()}
            >
              {isSubmitting ? 'Nastavujem...' : 'Nastaviť teraz'}
            </button>
            <button
              type="button"
              className="secondary-btn"
              onClick={handleSkip}
              disabled={isSubmitting}
            >
              Možno neskôr
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UsernamePromptModal;
