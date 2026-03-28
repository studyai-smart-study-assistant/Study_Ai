
import React, { useEffect, useRef } from 'react';

const HighPerformanceAd: React.FC = () => {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const adContainer = adRef.current;
    if (adContainer) {
      // Clear previous ad content to avoid conflicts
      adContainer.innerHTML = '';

      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.innerHTML = `
        atOptions = {
          'key' : '3c4a4f98018f153ec6d29e394c1b8753',
          'format' : 'iframe',
          'height' : 50,
          'width' : 320,
          'params' : {}
        };
      `;

      const invokeScript = document.createElement('script');
      invokeScript.src = 'https://www.highperformanceformat.com/3c4a4f98018f153ec6d29e394c1b8753/invoke.js';
      invokeScript.async = true;

      // Append new scripts
      adContainer.appendChild(script);
      adContainer.appendChild(invokeScript);
    }

    // Cleanup on unmount
    return () => {
      if (adContainer) {
        adContainer.innerHTML = '';
      }
    };
  }, []);

  return <div ref={adRef} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '20px 0', minHeight: '50px' }}></div>;
};

export default HighPerformanceAd;
