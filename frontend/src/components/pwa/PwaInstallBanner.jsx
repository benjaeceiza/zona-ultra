import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import "./PwaInstallBanner.css";

const DISMISS_KEY = "zu_pwa_banner_dismissed";

const PwaInstallBanner = () => {
  const supportsWebInstall =
    typeof Navigator !== "undefined" &&
    typeof Navigator.prototype.install === "function";

  const [deferredPrompt, setDeferredPrompt] = useState(
    () => (typeof window !== "undefined" ? window.__zuDeferredPrompt : null)
  );
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(
    () => sessionStorage.getItem(DISMISS_KEY) === "true"
  );
  const [isInstalling, setIsInstalling] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    const checkStandalone = () => {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true;
      setIsStandalone(standalone);
    };

    checkStandalone();

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      window.__zuDeferredPrompt = event;
      setDeferredPrompt(event);
    };

    const handleInstallReady = () => {
      if (window.__zuDeferredPrompt) {
        setDeferredPrompt(window.__zuDeferredPrompt);
      }
    };

    const handleAppInstalled = () => {
      window.__zuDeferredPrompt = null;
      setDeferredPrompt(null);
      setIsStandalone(true);
      setStatusMessage("Zona Ultra se instaló correctamente.");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("zu-install-ready", handleInstallReady);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("zu-install-ready", handleInstallReady);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const canInstall = !isStandalone && !isDismissed && (supportsWebInstall || Boolean(deferredPrompt));

  if (!canInstall) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstalling) return;
    setIsInstalling(true);

    try {
      if (supportsWebInstall) {
        await navigator.install();
        setStatusMessage("La aplicación fue instalada o abierta.");
        setIsStandalone(true);
      } else if (deferredPrompt) {
        const promptEvent = deferredPrompt;
        window.__zuDeferredPrompt = null;
        setDeferredPrompt(null);
        await promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === "accepted") {
          setStatusMessage("Zona Ultra fue instalada.");
          setIsStandalone(true);
        } else {
          setStatusMessage("Instalación cancelada.");
        }
      }
    } catch (error) {
      if (error?.name === "AbortError") {
        setStatusMessage("Instalación cancelada.");
      } else {
        setStatusMessage("No se pudo iniciar la instalación.");
        console.error(error);
      }
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "true");
    setIsDismissed(true);
  };

  return (
    <aside className="zu-pwa-banner" aria-label="Instalar aplicación Zona Ultra">
      <div className="zu-pwa-banner-content">
        <img
          src="/pwa-192x192.png"
          alt="Icono de Zona Ultra"
          className="zu-pwa-banner-icon"
        />
        <div className="zu-pwa-banner-text">
          <strong>Instalar Zona Ultra</strong>
          <span>Tené tus entrenamientos siempre a mano, incluso sin internet.</span>
        </div>
      </div>

      <div className="zu-pwa-banner-actions">
        <button
          type="button"
          className="zu-pwa-install-btn"
          aria-disabled={isInstalling ? "true" : undefined}
          onClick={handleInstallClick}
        >
          <Download size={16} aria-hidden="true" />
          <span>Instalar</span>
        </button>

        <button
          type="button"
          className="zu-pwa-close-btn"
          aria-label="Cerrar aviso de instalación"
          onClick={handleDismiss}
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <p className="zu-pwa-sr-status" role="status">
        {statusMessage}
      </p>
    </aside>
  );
};

export default PwaInstallBanner;
