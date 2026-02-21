import { ThemeProvider } from "styled-components";
import theme from "@/assets/theme";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import "./index.css";
import { HistoryProvider } from "./context/HistoryProvider";

function App() {
	return (
		<ThemeProvider theme={theme}>
			<HistoryProvider>
				<RouterProvider router={router} />
			</HistoryProvider>
		</ThemeProvider>
	);
}

export default App;
