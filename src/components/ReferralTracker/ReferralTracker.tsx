/**
 * Referral Tracker Component
 *
 * Invisible component that automatically tracks referral codes from URL parameters
 * Include this once in your App.tsx or main layout component
 */

import { useReferralTracking } from '../../hooks/useReferralTracking';

const ReferralTracker: React.FC = () => {
  useReferralTracking();
  return null; // This component doesn't render anything
};

export default ReferralTracker;
