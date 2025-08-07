import { useContext } from 'react';
import { DevPasswordGateContext } from './DevPasswordGateContext';

// Hook to use the development password gate context
export const useDevPasswordGate = () => {
  const context = useContext(DevPasswordGateContext);
  
  if (context === undefined) {
    throw new Error('useDevPasswordGate must be used within a DevPasswordGateProvider');
  }
  
  return context;
};