export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', async () => {
    try {
      // Reliability-first mode:
      // Disable SW caching layer to avoid stale runtime/auth mismatch after long idle.
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((reg) => reg.unregister()));

      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames
            .filter((name) => name.startsWith('study-ai'))
            .map((name) => caches.delete(name))
        );
      }

      console.log('ServiceWorker disabled for stability; old caches cleared.');
    } catch (error) {
      console.warn('ServiceWorker cleanup failed:', error);
    }
  });
}
