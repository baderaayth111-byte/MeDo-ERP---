// Service Worker Registration for MeDo ERP PWA

export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  // In development mode or iframe sandbox environments, avoid intercepting Vite hot module streams
  const isDev = Boolean((import.meta as any).env?.DEV);
  if (isDev) {
    // Unregister any leftover workers from previous builds to prevent caching Vite scripts
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        reg.unregister().catch(() => {});
      }
    }).catch(() => {});
    return;
  }

  window.addEventListener('load', () => {
    try {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[MeDo ERP] ServiceWorker registered with scope:', registration.scope);

          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker == null) return;

            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  console.log('[MeDo ERP] New content is available and will be used when all tabs are closed.');
                } else {
                  console.log('[MeDo ERP] Content is cached for offline use.');
                }
              }
            };
          };
        })
        .catch((error) => {
          console.warn('[MeDo ERP] ServiceWorker registration error (running in standard mode):', error);
        });
    } catch (e) {
      console.warn('[MeDo ERP] ServiceWorker registration failed safely:', e);
    }
  });
}

export function unregisterServiceWorker(): void {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      navigator.serviceWorker.ready
        .then((registration) => {
          registration.unregister();
        })
        .catch(() => {});
    } catch (e) {}
  }
}

