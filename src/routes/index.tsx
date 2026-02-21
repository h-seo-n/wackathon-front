import { LoginPage, SignupPage } from '@/pages/Auth/AuthPage';
import { createBrowserRouter } from 'react-router-dom';

export const router = createBrowserRouter([
    {
        // errorElement:  <NotFound />,
        children: [
            // { index: true, element: <Home /> }
            { path: '/login', element: <LoginPage /> },
            { path: '/signup', element: <SignupPage /> },
        ],
    },
])