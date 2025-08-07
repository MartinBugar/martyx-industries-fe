import { createContext } from 'react';

// Define the shape of the development password gate context
export interface DevPasswordGateContextType {
  isAuthenticated: boolean;
  authenticate: (password: string) => boolean;
}

// Create the context with a default value
export const DevPasswordGateContext = createContext<DevPasswordGateContextType>({
  isAuthenticated: false,
  authenticate: () => false,
});