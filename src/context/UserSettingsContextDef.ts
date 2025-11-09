import { createContext } from 'react';

export interface UserSettingsContextType {
    particlesEnabled: boolean;
    setParticlesEnabled: (enabled: boolean) => Promise<void>;
    loading: boolean;
}

export const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined);
