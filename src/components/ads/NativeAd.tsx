import React, { useEffect, useRef, useState } from 'react';

interface NativeAdProps {
  className?: string;
}

declare global {
  interface Window {
    __studyai_native_ad_mounted?: boolean;
    __studyai_native_ad_script_loaded?: boolean;
  }
}

const NATIVE_CONTAINER_ID = 'container-e9a21b3e7364d13bbd61a09df9d425a6';
const NATIVE_SCRIPT_SRC =
  'https://pl28384008.effectivegatecpm.com/e9a21b3e7364d13bbd61a09df9d425a6/invoke.js';

const NativeAd: React.FC<NativeAdProps> = ({ className = '' }) => {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    // Prevent multiple instances on the same page (duplicate IDs will break Adsterra rendering)
    if (window.__studyai_native_ad_mounted) {
      setEnabled(false);
      return;
    }

    window.__studyai_native_ad_mounted = true;

    // Load script once globally
    if (!window.__studyai_native_ad_script_loaded) {
      const script = document.createElement('script');
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      script.src = NATIVE_SCRIPT_SRC;
      document.body.appendChild(script);
      window.__studyai_native_ad_script_loaded = true;
    }

    return () => {
      window.__studyai_native_ad_mounted = false;
    };
  }, []);

  if (!enabled) return null;

  return (
    <div className={className}>
      <div
        ref={adContainerRef}
        id={NATIVE_CONTAINER_ID}
        className="w-full overflow-hidden rounded-lg"
      />
    </div>
  );
};

export default NativeAd;
