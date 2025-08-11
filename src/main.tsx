import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register Service Worker (only in supported browsers)
if ('serviceWorker' in navigator) {
  const register = () => navigator.serviceWorker.register('/sw.js');
  if (document.readyState === 'complete') {
    register().catch(() => {});
  } else {
    window.addEventListener('load', () => register().catch(() => {}));
  }
}
