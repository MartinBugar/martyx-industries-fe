// Temporary useAuth hook - to be replaced when AuthContext is fully ported
// For now, returns a minimal interface for ReviewsTab compatibility

export const useAuth = () => {
  // TODO: Replace with actual AuthContext when ported
  return {
    isAuthenticated: false,
    user: null,
  };
};
