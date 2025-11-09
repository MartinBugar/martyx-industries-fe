/**
 * User Settings Context - Manages user preferences (particles, etc.)
 * Provides immediate updates without page refresh
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { userSettingsService } from '../services/userSettingsService';
import { useAuth } from './useAuth';

interface UserSettingsContextType {
    particlesEnabled: boolean;
    setParticlesEnabled: (enabled: boolean) => Promise<void>;
    loading: boolean;
}

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined);

export const UserSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [particlesEnabled, setParticlesEnabledState] = useState<boolean>(true);
    const [loading, setLoading] = useState<boolean>(false);

    // Load user settings when user is authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            // Default to true for non-authenticated users
            setParticlesEnabledState(true);
            return;
        }

        const loadSettings = async () => {
            try {
                const settings = await userSettingsService.getUserSettings();
                setParticlesEnabledState(settings.particlesEnabled);
            } catch (err) {
                console.error('Failed to load user settings:', err);
                // Default to true if loading fails
                setParticlesEnabledState(true);
            }
        };

        loadSettings();
    }, [isAuthenticated]);

    // Update particles enabled setting
    const setParticlesEnabled = async (enabled: boolean) => {
        if (!isAuthenticated) {
            console.warn('Cannot update particles setting: User not authenticated');
            return;
        }

        setLoading(true);
        try {
            await userSettingsService.updateParticlesEnabled(enabled);
            setParticlesEnabledState(enabled);

            // Emit custom event for immediate UI updates
            window.dispatchEvent(new CustomEvent('userSettings:particlesChanged', {
                detail: { particlesEnabled: enabled }
            }));
        } catch (err) {
            console.error('Failed to update particles setting:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return (
        <UserSettingsContext.Provider value={{ particlesEnabled, setParticlesEnabled, loading }}>
            {children}
        </UserSettingsContext.Provider>
    );
};

export const useUserSettings = () => {
    const context = useContext(UserSettingsContext);
    if (context === undefined) {
        throw new Error('useUserSettings must be used within a UserSettingsProvider');
    }
    return context;
};
