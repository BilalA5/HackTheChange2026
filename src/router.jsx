import { createBrowserRouter } from 'react-router';
import NotFound from './pages/NotFound.jsx';

export const router = createBrowserRouter([{ path: '*', Component: NotFound }]);
