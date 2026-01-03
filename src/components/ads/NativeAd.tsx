import React, { useEffect, useRef } from 'react';

interface NativeAdProps {
  className?: string;
}

const NativeAd: React.FC<NativeAdProps> = ({ className = '' }) => {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    if (scriptLoadedRef.current || !adContainerRef.current) return;

    // Create script element
    const script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.src = 'https://pl28384008.effectivegatecpm.com/e9a21b3e7364d13bbd61a09df9d425a6/invoke.js';
    
    // Append script to document head
    document.head.appendChild(script);
    scriptLoadedRef.current = true;

    return () => {
      // Cleanup on unmount
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return (
    <div className={`native-ad-container ${className}`}>
      <div 
        ref={adContainerRef}
        id="container-e9a21b3e7364d13bbd61a09df9d425a6"
        className="w-full overflow-hidden rounded-lg"
      />
    </div>
  );
};

export default NativeAd;
