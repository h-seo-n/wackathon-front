import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

async function enableMocking() {
  // VITE_MSW=true 일 때만 켜기
  if (import.meta.env.VITE_MSW !== "true") return;

  const { worker } = await import("./mocks/browser");
  await worker.start({
    onUnhandledRequest: "bypass", // 실제 백엔드 붙어있는 요청은 그냥 통과
  });
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});