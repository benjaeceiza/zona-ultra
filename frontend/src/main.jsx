import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Capturamos beforeinstallprompt temprano para no perder el evento antes de que monte React
window.__zuDeferredPrompt = null;
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  window.__zuDeferredPrompt = event;
  window.dispatchEvent(new CustomEvent('zu-install-ready'));
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => reg.update())
      .catch((err) => console.warn('Error registrando Service Worker:', err));
  });
}
