import { ThemeProvider } from "styled-components";
import theme from "@/assets/theme";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import "./index.css";
import { HistoryProvider } from "./context/HistoryProvider";
import { AuthProvider } from './contexts/AuthContext';


function App() {
	return (
		<AuthProvider>
			<ThemeProvider theme={theme}>
				<HistoryProvider>
					<RouterProvider router={router} />
				</HistoryProvider>
			</ThemeProvider>
		</AuthProvider>
	);
}
export default App;