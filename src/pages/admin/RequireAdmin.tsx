import React, { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';

interface RequireAdminProps {
  children: ReactNode;
}

const RequireAdmin: React.FC<RequireAdminProps> = ({ children }) => {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const ok = await adminService.checkAdmin();
      if (!mounted) return;
      if (ok) {
        setAuthorized(true);
      } else {
        setAuthorized(false);
        navigate('/admin', { replace: true });
      }
    })();
    return () => { mounted = false; };
  }, [navigate]);

  if (authorized === null) {
    return (
      <div style={{
        minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155'
      }}>Checking admin access...</div>
    );
  }

  if (!authorized) return null;
  return <>{children}</>;
};

export default RequireAdmin;
