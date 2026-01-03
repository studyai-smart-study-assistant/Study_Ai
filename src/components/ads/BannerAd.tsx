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

const BannerAd: React.FC<BannerAdProps> = ({ className = '' }) => {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    if (scriptLoadedRef.current || !adContainerRef.current) return;

    // Set ad options
    window.atOptions = {
      'key': '6a7327b72f3ae30271eb8567f9e02b11',
      'format': 'iframe',
      'height': 50,
      'width': 320,
      'params': {}
    };

    // Create script element
    const script = document.createElement('script');
    script.src = 'https://www.highperformanceformat.com/6a7327b72f3ae30271eb8567f9e02b11/invoke.js';
    script.async = true;
    
    adContainerRef.current.appendChild(script);
    scriptLoadedRef.current = true;

    return () => {
      // Cleanup on unmount
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return (
    <div className={`banner-ad-container flex justify-center items-center ${className}`}>
      <div 
        ref={adContainerRef}
        className="w-full max-w-[320px] h-[50px] overflow-hidden rounded-lg bg-muted/30"
      />
    </div>
  );
};

export default BannerAd;
