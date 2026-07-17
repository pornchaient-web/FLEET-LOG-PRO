import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register Progressive Web App Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // Dynamically calculate base pathname to support hosting under subfolders (like GitHub Pages /FLEET-LOG-PRO/)
    const base = window.location.pathname.endsWith('/') 
      ? window.location.pathname 
      : window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
    
    const swPath = `${base}sw.js`;
    
    navigator.serviceWorker
      .register(swPath, { scope: base })
      .then((registration) => {
        console.log("PWA Service Worker registered with scope:", registration.scope);
        registration.update();
      })
      .catch((error) => {
        console.error("PWA Service Worker registration failed with path:", swPath, "and scope:", base, error);
      });
  });
}

