import { Navigate, createBrowserRouter } from 'react-router';
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
          {
            path: '/app',
            lazy: page(() => import('./features/app/AppLayout.jsx')),
            children: [
              { index: true, lazy: page(() => import('./features/app/HomePage.jsx')) },
              { path: 'portfolio', lazy: page(() => import('./features/app/PortfolioPage.jsx')) },
            ],
          },
          { path: '/app/scenarios/:scenarioId', lazy: page(() => import('./features/workspace/ScenarioPage.jsx')) },
          { path: '/workspace', element: <Navigate to="/app/scenarios/shopify-price-recommender" replace /> },
        ],
      },
      { path: '*', Component: NotFound },
    ],
  },
]);
