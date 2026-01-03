import React, { useEffect, useRef } from 'react';

interface BannerAdProps {
  className?: string;
}

const BannerAd: React.FC<BannerAdProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptInjected = useRef(false);

  useEffect(() => {
    if (!containerRef.current || scriptInjected.current) return;
    scriptInjected.current = true;

    // Set atOptions globally
    (window as any).atOptions = {
      key: '6a7327b72f3ae30271eb8567f9e02b11',
      format: 'iframe',
      height: 50,
      width: 320,
      params: {},
    };

    // Create and inject the ad script
    const script = document.createElement('script');
    script.src = 'https://www.highperformanceformat.com/6a7327b72f3ae30271eb8567f9e02b11/invoke.js';
    script.async = false;
    script.setAttribute('data-cfasync', 'false');
    
    containerRef.current.appendChild(script);

    return () => {
      scriptInjected.current = false;
    };
  }, []);

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div
        ref={containerRef}
        className="w-[320px] h-[50px] overflow-hidden rounded-lg bg-muted/30"
      />
    </div>
  );
};

export default BannerAd;
