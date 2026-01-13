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

    // Service Worker 상태 모니터링
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        // Service Worker 상태 변경 감지
        registration.addEventListener('updatefound', () => {
          console.warn('⚠️ MSW Service Worker 업데이트 감지');
        });

        // 주기적으로 Service Worker 활성 상태 확인
        setInterval(() => {
          if (!registration.active) {
            console.error('❌ MSW Service Worker가 비활성화되었습니다. 페이지를 새로고침해주세요.');
          }
        }, 30000); // 30초마다 확인
      });
    }
  }).catch((error) => {
    console.error('❌ MSW failed to start:', error);
  });
}

enableMocking().then(() => {
  // console.log('🚀 Starting app...');
  createRoot(document.getElementById("root")!).render(<App />);
});