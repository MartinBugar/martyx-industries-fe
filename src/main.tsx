import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/ios-forms.css'
import './i18n'
import App from './App.tsx'
import { initializeModelViewerConfig } from './utils/modelViewerConfig'

// Initialize model-viewer configuration for production optimization
initializeModelViewerConfig();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={null}>
      <App />
    </Suspense>
  </StrictMode>,
)

// Silences a known Chrome extension messaging error that can surface as an unhandled rejection
// without our app using extension APIs. We prevent only the specific, known message.
window.addEventListener('unhandledrejection', (event) => {
  try {
    const reason = event.reason as unknown;
    let msg = '' as string;
    if (typeof reason === 'string') {
      msg = reason;
    } else if (typeof reason === 'object' && reason !== null) {
      const maybeMessage = (reason as { message?: unknown }).message;
      if (typeof maybeMessage === 'string') {
        msg = maybeMessage;
      }
    }
    if (
      typeof msg === 'string' &&
      msg.includes('A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received')
    ) {
      event.preventDefault();
    }
  } catch {
    // no-op
  }
});

// Register/Unregister Service Worker depending on environment
// Only register in production to avoid dev server issues (e.g., MIME/type errors due to SW caching)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  const register = () => navigator.serviceWorker.register('/sw.js');
  if (document.readyState === 'complete') {
    register().catch(() => {});
  } else {
    window.addEventListener('load', () => register().catch(() => {}));
  }
} else if (!import.meta.env.PROD && 'serviceWorker' in navigator) {
  // In development, proactively unregister any existing service workers to prevent caching conflicts
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const reg of registrations) {
      reg.unregister().catch(() => {});
    }
  }).catch(() => {});
}
