
import { useCallback, useEffect } from 'react';

export const useScrollHandler = (ref: React.RefObject<HTMLDivElement>) => {
  const scrollToBottom = useCallback(() => {
    if (ref.current) {
      // Prevent automatic scrolling on page load
      const shouldScroll = document.body.dataset.allowScroll === 'true';
      
      if (shouldScroll) {
        setTimeout(() => {
          ref.current?.scrollIntoView({ 
            behavior: 'smooth',
            block: 'end'
          });
        }, 100);
      }
    }
  }, [ref]);

  // Set scroll permission after initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      document.body.dataset.allowScroll = 'true';
    }, 1000); // Allow scrolling after 1 second of page load

    return () => clearTimeout(timer);
  }, []);

  return { scrollToBottom };
};
