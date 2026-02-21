import { LoginPage, SignupPage } from "@/pages/Auth/AuthPage";
import WsSmokeTestPage from "@/pages/Dev/WsSmokeTestPage";
import FcmTestPage from "@/pages/Dev/FcmTestPage";
import HomePage from "@/pages/Home/Home";
import PartnerPage from "@/pages/Partner/PartnerPage";
import StoryPage from "@/pages/Story/StoryPage";
import LiveMapPage from "@/pages/LiveMapPage";
import { createBrowserRouter } from "react-router-dom";

export const router = createBrowserRouter([
	{
		// errorElement:  <NotFound />,
		children: [
			// { index: true, element: <Home /> }
			{ path: "/login", element: <LoginPage /> },
			{ path: "/signup", element: <SignupPage /> },
			{ path: "/partner", element: <PartnerPage /> },
			{ path: "/home", element: <HomePage /> },
            { path: "/ws-test", element: <WsSmokeTestPage /> },
            { path: "/story", element: <StoryPage /> },
            { path: "/fcm-test", element: <FcmTestPage /> },
            { path: "/live-map/:sessionId", element: <LiveMapPage /> },
		],
	},
]);
