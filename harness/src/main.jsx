import React from "react";
import ReactDOM from "react-dom/client";
import FullstackQuest from "../../fullstack-quest.jsx";
import "./index.css";

// Shim de window.storage (l'artifact l'utilise) -> localStorage
window.storage = {
  async get(key) {
    const v = localStorage.getItem(key);
    return v != null ? { value: v } : null;
  },
  async set(key, value) {
    localStorage.setItem(key, value);
  },
};

ReactDOM.createRoot(document.getElementById("root")).render(<FullstackQuest />);

// Register service worker for PWA (best-effort, with cleanup)
if (typeof navigator !== "undefined" && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).then((reg) => {
      console.log('✓ Service Worker registered:', reg.scope);
      // Check for updates every hour
      setInterval(() => reg.update(), 60 * 60 * 1000);
    }).catch((err) => {
      console.warn('✗ Service Worker registration failed:', err);
    });
  });
}


