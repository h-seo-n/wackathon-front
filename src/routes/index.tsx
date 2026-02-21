import { LoginPage, SignupPage } from '@/pages/Auth/AuthPage';
import FcmTestPage from '@/pages/Dev/FcmTestPage';
import WsSmokeTestPage from '@/pages/Dev/WsSmokeTestPage';
import HomePage from '@/pages/Home/Home';
import PartnerPage from '@/pages/Partner/PartnerPage';
import StoryPage from '@/pages/Story/StoryPage';
import LiveMapPage from "@/pages/LiveMapPage";
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
            { path: '/ws-test', element: <WsSmokeTestPage />},
            { path: '/story', element: <StoryPage />},
            // sessionId는 임시값입니다. 실제로는 로그인한 유저의 세션 ID를 넘겨주어야 합니다.
            { path: "/LiveMap", element: <LiveMapPage sessionId={1} /> },

        ],
    },
])
