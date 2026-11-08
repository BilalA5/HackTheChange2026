import { createBrowserRouter } from 'react-router';
import NotFound from './pages/NotFound.jsx';

const page = (load) => async () => ({ Component: (await load()).default });

export const router = createBrowserRouter([
  { path: '/', lazy: page(() => import('./features/landing/LandingPage.jsx')) },
  { path: '/workspace', lazy: page(() => import('./features/workspace/WorkspacePage.jsx')) },
  { path: '*', Component: NotFound },
]);
