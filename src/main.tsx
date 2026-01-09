import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

async function enableMocking() {
  // VITE_ENABLE_MSW 환경변수가 'true'일 때만 MSW 실행
  if (import.meta.env.VITE_ENABLE_MSW !== 'true') {
    return;
  }

  const { worker } = await import('./mocks/browser');

  return worker.start({
    serviceWorker: {
      url: '/mockServiceWorker.js',
    },
    onUnhandledRequest: 'bypass',
  }).then(() => {
    console.log('🔶 MSW started successfully');
  }).catch((error) => {
    console.error('❌ MSW failed to start:', error);
  });
}

enableMocking().then(() => {
  console.log('🚀 Starting app...');
  createRoot(document.getElementById("root")!).render(<App />);
});