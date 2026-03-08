import React, { useEffect, useRef } from 'react';
import { useAdSettings } from '@/hooks/useAdSettings';

interface MonetagInterstitialProps {
  page: string;
}

const MonetagInterstitial: React.FC<MonetagInterstitialProps> = ({ page }) => {
  const { isAdEnabled, loading } = useAdSettings();
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (loading || !isAdEnabled('monetag', page) || scriptLoaded.current) return;

    try {
      const s = document.createElement('script');
      s.dataset.zone = '10700370';
      s.src = 'https://nap5k.com/tag.min.js';
      s.async = true;
      document.body.appendChild(s);
      scriptLoaded.current = true;
    } catch (err) {
      console.error('Monetag load error:', err);
    }

    return () => {
      scriptLoaded.current = false;
    };
  }, [loading, page, isAdEnabled]);

  return null; // Monetag handles its own UI
};

export default MonetagInterstitial;
