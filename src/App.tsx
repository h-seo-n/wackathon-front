import { ThemeProvider } from "styled-components";
import theme from "@/assets/theme";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import './index.css'
import { AuthProvider } from './contexts/AuthContext';

function App() {
	return (
		<AuthProvider>
			<ThemeProvider theme={theme}>
				<RouterProvider router={router} />
			</ThemeProvider>
		</AuthProvider>
	);
}

export default App;
