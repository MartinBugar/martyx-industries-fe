// Temporary useAuth hook - to be replaced when AuthContext is fully ported
// For now, returns a minimal interface for compatibility

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
}

export const useAuth = () => {
  // TODO: Replace with actual AuthContext when ported
  return {
    isAuthenticated: false,
    isLoading: false,
    user: null as User | null,
  };
};
