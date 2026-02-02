/**
 * Route Prefetching Utility
 * Preloads JS chunks for main routes in background
 * This makes subsequent navigation instant
 */

// Main routes to prefetch (ordered by priority)
const PREFETCH_ROUTES = [
  () => import('@/pages/Index'),
  () => import('@/pages/Login'),
  () => import('@/pages/Profile'),
  () => import('@/pages/NotesCreator'),
  () => import('@/pages/QuizGeneratorPage'),
  () => import('@/pages/StudyPlannerPage'),
  () => import('@/pages/HomeworkHelperPage'),
  () => import('@/pages/ChatHistory'),
  () => import('@/pages/Library'),
  () => import('@/pages/Leaderboard'),
];

let prefetched = false;

/**
 * Prefetch all main route chunks in background
 * Uses requestIdleCallback for non-blocking prefetch
 */
export const prefetchRoutes = () => {
  if (prefetched) return;
  prefetched = true;

  const prefetchNext = (index: number) => {
    if (index >= PREFETCH_ROUTES.length) return;

    const prefetch = () => {
      PREFETCH_ROUTES[index]()
        .then(() => {
          // Prefetch next route after small delay
          setTimeout(() => prefetchNext(index + 1), 100);
        })
        .catch(() => {
          // Silently fail, continue with next
          setTimeout(() => prefetchNext(index + 1), 100);
        });
    };

    // Use requestIdleCallback if available, otherwise setTimeout
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(prefetch, { timeout: 2000 });
    } else {
      setTimeout(prefetch, 50);
    }
  };

  prefetchNext(0);
};

/**
 * Prefetch a specific route on demand (e.g., on hover)
 */
export const prefetchRoute = (routeImport: () => Promise<any>) => {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => routeImport().catch(() => {}));
  } else {
    setTimeout(() => routeImport().catch(() => {}), 0);
  }
};
