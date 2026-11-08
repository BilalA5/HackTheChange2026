import { Outlet } from 'react-router';
import AuthProvider from '@/features/auth/AuthProvider.jsx';

export default function Root() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}
