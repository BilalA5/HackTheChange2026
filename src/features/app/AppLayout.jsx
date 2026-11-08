import { Outlet } from 'react-router';
import { useAppTheme } from '@/shared/useAppTheme.js';
import './app.css';

export default function AppLayout() {
  useAppTheme('app');
  return <Outlet />;
}
