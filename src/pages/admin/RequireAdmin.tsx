import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface Props {
  children: React.ReactNode;
}

const RequireAdmin: React.FC<Props> = ({ children }) => {
  const location = useLocation();
  const isAuthed = typeof window !== 'undefined' && window.localStorage.getItem('adminAuthed') === 'true';

  if (!isAuthed) {
    return <Navigate to="/admin" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

export default RequireAdmin;
