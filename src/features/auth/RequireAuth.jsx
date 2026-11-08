import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from './auth-context.js';

export default function RequireAuth() {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
