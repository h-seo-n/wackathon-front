import { ThemeProvider } from 'styled-components';
import theme from "@/assets/theme";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import './index.css'

function App() {
	return (
		<ThemeProvider theme={theme}>
			<RouterProvider router={router} />
		</ThemeProvider>
	);
}

export default App;
