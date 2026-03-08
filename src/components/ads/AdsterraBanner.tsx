import React, { useEffect, useRef } from 'react';
import { useAdSettings } from '@/hooks/useAdSettings';

interface AdsterraBannerProps {
  page: string;
}

const AdsterraBanner: React.FC<AdsterraBannerProps> = ({ page }) => {
  const { isAdEnabled, loading } = useAdSettings();
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (loading || !isAdEnabled('adsterra', page) || scriptLoaded.current) return;
    if (!containerRef.current) return;

    try {
      // Set atOptions on window
      (window as any).atOptions = {
        key: '3c4a4f98018f153ec6d29e394c1b8753',
        format: 'iframe',
        height: 50,
        width: 320,
        params: {},
      };

      const script = document.createElement('script');
      script.src = 'https://www.highperformanceformat.com/3c4a4f98018f153ec6d29e394c1b8753/invoke.js';
      script.async = true;
      containerRef.current.appendChild(script);
      scriptLoaded.current = true;
    } catch (err) {
      console.error('Adsterra load error:', err);
    }

    return () => {
      scriptLoaded.current = false;
    };
  }, [loading, page, isAdEnabled]);

  if (loading || !isAdEnabled('adsterra', page)) return null;

  return (
    <div className="w-full flex justify-center my-2 overflow-hidden" style={{ minHeight: 50 }}>
      <div ref={containerRef} className="max-w-[320px]" />
    </div>
  );
};

export default AdsterraBanner;
