import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';
import type { UserRole } from '../../types';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({ children, allowedRoles }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const hasPermission = user && allowedRoles.includes(user.role);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }

    if (!hasPermission) {
      toast.error('접근 권한이 없습니다. (403 Forbidden)');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, hasPermission, navigate]);

  if (!isAuthenticated || !hasPermission) {
    return null;
  }

  return <>{children}</>;
};
