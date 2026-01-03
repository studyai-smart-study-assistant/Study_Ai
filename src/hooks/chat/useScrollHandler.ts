
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

  // Enable scrolling only after the user interacts (prevents auto-scroll on page load)
  useEffect(() => {
    document.body.dataset.allowScroll = 'false';

    const enable = () => {
      document.body.dataset.allowScroll = 'true';
      window.removeEventListener('pointerdown', enable);
      window.removeEventListener('keydown', enable);
      window.removeEventListener('wheel', enable);
      window.removeEventListener('touchstart', enable);
    };

    window.addEventListener('pointerdown', enable, { once: true });
    window.addEventListener('keydown', enable, { once: true });
    window.addEventListener('wheel', enable, { once: true, passive: true } as AddEventListenerOptions);
    window.addEventListener('touchstart', enable, { once: true, passive: true } as AddEventListenerOptions);

    return () => {
      window.removeEventListener('pointerdown', enable);
      window.removeEventListener('keydown', enable);
      window.removeEventListener('wheel', enable);
      window.removeEventListener('touchstart', enable);
    };
  }, []);

  return { scrollToBottom };
};
