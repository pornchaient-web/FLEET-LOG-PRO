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
  const win = window as any;
  if (win.__PWA_BASE_PATH__) {
    return win.__PWA_BASE_PATH__;
  }
  const path = window.location.pathname;
  if (path.endsWith(".html")) {
    return path.substring(0, path.lastIndexOf("/") + 1);
  }
  return path.endsWith("/") ? path : path + "/";
};

const basePath = getBasePath();

// Register Progressive Web App Service Worker dynamically
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js", { scope: "./" })
      .then((registration) => {
        console.log("PWA Service Worker registered with scope:", registration.scope);
        
        // Check for updates on load to make sure changes apply immediately
        registration.update();
        
        // Listen for new service worker being installed and force activation
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                console.log("New Service Worker version available. Force reloading...");
                window.location.reload();
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error("PWA Service Worker registration failed:", error);
      });
  });
}

