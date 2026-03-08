/**
 * Service Worker Registration
 * Registers SW for PWA functionality
 */

export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) return;

  // SW should run only in production to avoid stale chunk/cache issues during preview/dev.
  if (!import.meta.env.PROD) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000);

    console.log('SW registered:', registration.scope);
  } catch (error) {
    console.log('SW registration failed:', error);
  }
};
