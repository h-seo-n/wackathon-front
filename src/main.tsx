import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

<<<<<<< HEAD
ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
);
=======
// mockServiceWorker 임시 비활성화
Promise.resolve().then(() => {
	const root = document.getElementById("root");
	if (!root) throw new Error("Root element not found");

	ReactDOM.createRoot(root).render(
		<React.StrictMode>
			<App />
		</React.StrictMode>,
	);
});
>>>>>>> a81363bb7c84716b4036be63b9b81c6c12bc288e
