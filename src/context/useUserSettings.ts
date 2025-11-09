import { useContext } from 'react';
import { UserSettingsContext } from './UserSettingsContextDef';

export const useUserSettings = () => {
    const context = useContext(UserSettingsContext);
    if (context === undefined) {
        throw new Error('useUserSettings must be used within a UserSettingsProvider');
    }
    return context;
};
