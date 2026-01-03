import React, { useEffect, useRef } from 'react';

interface NativeAdProps {
  className?: string;
}

const CONTAINER_ID = 'container-e9a21b3e7364d13bbd61a09df9d425a6';

const NativeAd: React.FC<NativeAdProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptInjected = useRef(false);

  useEffect(() => {
    // Only inject once and only if container exists
    if (!containerRef.current || scriptInjected.current) return;
    
    // Check if container already has the ad div
    if (document.getElementById(CONTAINER_ID)) {
      return;
    }
    
    scriptInjected.current = true;

    // Create the container div that Adsterra expects
    const adContainer = document.createElement('div');
    adContainer.id = CONTAINER_ID;
    containerRef.current.appendChild(adContainer);

    // Create and inject the script
    const script = document.createElement('script');
    script.src = 'https://pl28384008.effectivegatecpm.com/e9a21b3e7364d13bbd61a09df9d425a6/invoke.js';
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    
    containerRef.current.appendChild(script);

    return () => {
      scriptInjected.current = false;
    };
  }, []);

  return (
    <div className={`w-full ${className}`}>
      <div
        ref={containerRef}
        className="w-full min-h-[100px] overflow-hidden rounded-lg"
      />
    </div>
  );
};

export default NativeAd;
