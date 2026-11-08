import { createBrowserRouter } from 'react-router';
import Root from './app/Root.jsx';
import RequireAuth from './features/auth/RequireAuth.jsx';
import NotFound from './pages/NotFound.jsx';

const page = (load) => async () => ({ Component: (await load()).default });

export const router = createBrowserRouter([
  {
    Component: Root,
    children: [
      { path: '/', lazy: page(() => import('./features/landing/LandingPage.jsx')) },
      { path: '/login', lazy: page(() => import('./features/auth/LoginPage.jsx')) },
      {
        Component: RequireAuth,
        children: [
          { path: '/onboarding/:step?', lazy: page(() => import('./features/onboarding/OnboardingPage.jsx')) },
          { path: '/workspace', lazy: page(() => import('./features/workspace/WorkspacePage.jsx')) },
        ],
      },
      { path: '*', Component: NotFound },
    ],
  },
]);
