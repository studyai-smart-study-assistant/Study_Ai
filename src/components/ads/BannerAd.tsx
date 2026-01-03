import React, { useEffect, useRef } from 'react';

interface BannerAdProps {
  className?: string;
}

declare global {
  interface Window {
    atOptions?: {
      key: string;
      format: string;
      height: number;
      width: number;
      params: object;
    };
  }
}

const BANNER_SCRIPT_SRC =
  'https://www.highperformanceformat.com/6a7327b72f3ae30271eb8567f9e02b11/invoke.js';

const BannerAd: React.FC<BannerAdProps> = ({ className = '' }) => {
  const adContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = adContainerRef.current;
    if (!container) return;

    // Avoid duplicating script inside the same container on re-renders
    if (container.querySelector('script[data-studyai-ad="banner"]')) return;

    window.atOptions = {
      key: '6a7327b72f3ae30271eb8567f9e02b11',
      format: 'iframe',
      height: 50,
      width: 320,
      params: {},
    };

    const script = document.createElement('script');
    script.setAttribute('data-studyai-ad', 'banner');
    script.setAttribute('data-cfasync', 'false');
    script.src = BANNER_SCRIPT_SRC;

    // Important: keep it synchronous (matches the provided Adsterra snippet)
    script.async = false;

    container.appendChild(script);
  }, []);

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div
        ref={adContainerRef}
        className="w-full max-w-[320px] h-[50px] overflow-hidden rounded-lg bg-muted/30"
      />
    </div>
  );
};

export default BannerAd;
