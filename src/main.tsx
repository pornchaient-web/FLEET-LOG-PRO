import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Helper to get the correct path of the base folder for dynamic subfolders (like GitHub Pages)
const getBasePath = () => {
  const path = window.location.pathname;
  if (path.endsWith(".html")) {
    return path.substring(0, path.lastIndexOf("/") + 1);
  }
  return path.endsWith("/") ? path : path + "/";
};

const basePath = getBasePath();

// Dynamically set manifest and icon links to handle subpaths perfectly
try {
  let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
  if (manifestLink) {
    manifestLink.href = `${basePath}manifest.json`;
  }

  let appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
  if (appleTouchIcon) {
    appleTouchIcon.href = `${basePath}icon-192.png`;
  }

  let favIcon = document.querySelector('link[type="image/png"]') as HTMLLinkElement;
  if (favIcon) {
    favIcon.href = `${basePath}icon.png`;
  }
} catch (e) {
  console.error("Failed to update dynamic PWA asset links:", e);
}

// Register Progressive Web App Service Worker dynamically
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${basePath}sw.js`)
      .then((registration) => {
        console.log("PWA Service Worker registered with scope:", registration.scope);
      })
      .catch((error) => {
        console.error("PWA Service Worker registration failed:", error);
      });
  });
}

