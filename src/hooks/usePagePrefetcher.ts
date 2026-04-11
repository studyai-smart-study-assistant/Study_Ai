
import { useEffect } from 'react';

// An array of functions that dynamically import the pages we want to prefetch.
const pagesToPrefetch = [
  () => import('@/pages/Profile'),
  () => import('@/pages/Leaderboard'),
  () => import('@/pages/Library'),
  () => import('@/pages/StudyTube'),
  () => import('@/pages/SupabaseChatSystem'),
  () => import('@/pages/NotesCreator'),
  () => import('@/pages/QuizGeneratorPage'),
  () => import('@/pages/StudyPlannerPage'),
  () => import('@/pages/HomeworkHelperPage'),
  () => import('@/pages/AboutPage'),
  () => import('@/pages/PointsWalletPage')
];

export function usePagePrefetcher(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    // Start prefetching after a short delay to ensure the initial page is fully interactive.
    const prefetchTimer = setTimeout(() => {
      console.log('🚀 Starting background page prefetching...');
      
      // Sequentially prefetch pages to avoid network congestion.
      let index = 0;
      function prefetchNext() {
        if (index < pagesToPrefetch.length) {
          pagesToPrefetch[index]().then(() => {
            console.log(`✅ Prefetched page ${index + 1}/${pagesToPrefetch.length}`);
            index++;
            // Wait a moment before fetching the next one
            setTimeout(prefetchNext, 1000);
          }).catch(e => {
            console.error('Failed to prefetch a page:', e);
            // Continue to the next one even if one fails
            index++;
            setTimeout(prefetchNext, 1000);
          });
        }
      }
      
      prefetchNext();

    }, 5000); // Wait 5 seconds after the app mounts.

    return () => clearTimeout(prefetchTimer);
  }, [enabled]);
}
