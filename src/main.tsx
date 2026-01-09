import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

async function enableMocking() {
  if (import.meta.env.MODE !== 'development') {
    console.log('Not in development mode, skipping MSW');
    return;
  }

  const { worker } = await import('./mocks/browser');

  return worker.start({
    onUnhandledRequest: 'warn',
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