import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

async function enableMocking() {
  // 개발 환경이거나, VITE_ENABLE_MSW가 'false'가 아닐 때 실행 (기본적으로 실행)
  if (import.meta.env.VITE_ENABLE_MSW === 'false') {
    return;
  }

  const { worker } = await import('./mocks/browser');

  return worker.start({
    serviceWorker: {
      url: '/mockServiceWorker.js',
    },
    onUnhandledRequest: 'bypass',
    quiet: true,
  }).then(() => {
    // console.log('🔶 MSW started successfully');
  }).catch((error) => {
    // console.error('❌ MSW failed to start:', error);
  });
}

enableMocking().then(() => {
  // console.log('🚀 Starting app...');
  createRoot(document.getElementById("root")!).render(<App />);
});