import { LoginPage, SignupPage } from '@/pages/Auth/AuthPage';
import FcmTestPage from '@/pages/Dev/FcmTestPage';
import HomePage from '@/pages/Home/Home';
import PartnerPage from '@/pages/Partner/PartnerPage';
import { createBrowserRouter } from 'react-router-dom';

export const router = createBrowserRouter([
    {
        // errorElement:  <NotFound />,
        children: [
            // { index: true, element: <Home /> }
            { path: '/login', element: <LoginPage /> },
            { path: '/signup', element: <SignupPage /> },
            { path: '/partner', element: <PartnerPage />},
            { path: '/home', element: <HomePage />},
            { path: '/fcm-test', element: <FcmTestPage />},
        ],
    },
])
