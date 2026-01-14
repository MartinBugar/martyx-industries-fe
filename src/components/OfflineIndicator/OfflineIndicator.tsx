import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './OfflineIndicator.css';

/**
 * OfflineIndicator Component
 *
 * Displays a banner when the user loses internet connection.
 * Automatically hides when connection is restored.
 */
const OfflineIndicator: React.FC = () => {
  const { t } = useTranslation('common');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Keep banner visible briefly to show "Back online" message
      setTimeout(() => setShowBanner(false), 2000);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) {
      setShowBanner(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <div
      className={`offline-indicator ${isOffline ? 'offline' : 'online'}`}
      role="alert"
      aria-live="polite"
    >
      <WifiOff size={16} aria-hidden="true" />
      <span>
        {isOffline
          ? t('offline.message', 'You are offline. Some features may be unavailable.')
          : t('offline.backOnline', 'Back online!')}
      </span>
    </div>
  );
};

export default OfflineIndicator;
