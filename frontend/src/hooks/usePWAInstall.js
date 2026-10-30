import { useState, useEffect, useCallback } from 'react';

// Store prompt in module scope so it persists across page transitions
let globalDeferredPrompt = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    globalDeferredPrompt = e;
    window.dispatchEvent(new Event('dayflow:pwa-prompt-available'));
  });

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    window.dispatchEvent(new Event('dayflow:pwa-installed'));
  });
}

export function usePWAInstall() {
  const [isInstallable, setIsInstallable] = useState(() => Boolean(globalDeferredPrompt));
  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://')
    );
  });

  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  useEffect(() => {
    const handlePrompt = () => {
      setIsInstallable(true);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
    };

    window.addEventListener('dayflow:pwa-prompt-available', handlePrompt);
    window.addEventListener('dayflow:pwa-installed', handleInstalled);

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e) => {
      if (e.matches) {
        setIsInstalled(true);
        setIsInstallable(false);
      }
    };
    if (mediaQuery?.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    }

    return () => {
      window.removeEventListener('dayflow:pwa-prompt-available', handlePrompt);
      window.removeEventListener('dayflow:pwa-installed', handleInstalled);
      if (mediaQuery?.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      }
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (isInstalled) {
      return { outcome: 'already_installed' };
    }

    if (globalDeferredPrompt) {
      try {
        globalDeferredPrompt.prompt();
        const choiceResult = await globalDeferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          globalDeferredPrompt = null;
          setIsInstallable(false);
          setIsInstalled(true);
          return { outcome: 'accepted' };
        }
        return { outcome: 'dismissed' };
      } catch (err) {
        console.warn('PWA install prompt error:', err);
      }
    }

    if (isIOS) {
      return { outcome: 'ios_instructions' };
    }

    return { outcome: 'manual_instructions' };
  }, [isInstalled, isIOS]);

  return {
    isInstallable,
    isInstalled,
    isIOS,
    promptInstall,
  };
}

export default usePWAInstall;

