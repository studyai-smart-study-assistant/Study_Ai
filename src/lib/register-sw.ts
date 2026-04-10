export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);

        const promptAndActivateUpdate = (worker?: ServiceWorker | null) => {
          if (!worker) return;
          worker.postMessage({ type: 'SKIP_WAITING' });
        };

        // If a new SW is already waiting (old user with stale cache), activate immediately.
        if (registration.waiting) {
          promptAndActivateUpdate(registration.waiting);
        }

        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              promptAndActivateUpdate(registration.waiting || installingWorker);
            }
          });
        });

        // Periodically check updates so old sessions get new build fast.
        window.setInterval(() => {
          registration.update().catch((err) => {
            console.warn('ServiceWorker update check failed:', err);
          });
        }, 60_000);
      }).catch(error => {
        console.log('ServiceWorker registration failed: ', error);
      });

      // Reload once when the new SW takes control.
      let hasRefreshed = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (hasRefreshed) return;
        hasRefreshed = true;
        window.location.reload();
      });
    });
  }
}
