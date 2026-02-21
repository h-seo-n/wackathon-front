import "./App.css";
import { ThemeProvider } from 'styled-components';
import theme from "@/assets/theme";

function App() {
	return (
		<ThemeProvider theme={theme}>
		</ThemeProvider>
	);
}

export default App;
