import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

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
