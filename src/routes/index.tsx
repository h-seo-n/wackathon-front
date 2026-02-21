import { LoginPage, SignupPage } from '@/pages/Auth/AuthPage';
import HomePage from '@/pages/Home/Home';
import PartnerPage from '@/pages/Partner/PartnerPage';
import StoryPage from '@/pages/Story/StoryPage';
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
            { path: '/story', element: <StoryPage />},
        ],
    },
])
