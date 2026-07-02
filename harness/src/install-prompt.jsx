import React, { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { AMBER, BG, TEXT, TEXT_MUTED, PANEL, LINE } from "./quest-shared.jsx";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setShow(false);
      setDeferredPrompt(null);
    }
  }

  if (!show || !deferredPrompt) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-xs rounded-lg shadow-lg animate-in slide-in-from-bottom-4 duration-300"
      style={{ backgroundColor: PANEL, border: `1px solid ${LINE}`, color: TEXT }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Download size={18} style={{ color: AMBER }} />
            <h4 className="font-mono font-bold text-sm">Installer l'app</h4>
          </div>
          <button
            onClick={() => setShow(false)}
            className="p-0 hover:opacity-70"
            title="Fermer"
          >
            <X size={16} style={{ color: TEXT_MUTED }} />
          </button>
        </div>
        <p className="text-xs mb-3" style={{ color: TEXT_MUTED }}>
          Accédez à Fullstack Quest en un clic depuis votre écran d'accueil et jouez hors ligne.
        </p>
        <button
          onClick={handleInstall}
          className="w-full py-2 rounded-lg font-mono text-sm font-bold transition-colors"
          style={{ backgroundColor: AMBER, color: BG }}
        >
          Installer
        </button>
      </div>
    </div>
  );
}
