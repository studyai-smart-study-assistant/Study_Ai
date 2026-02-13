
import { useEffect, useRef } from 'react';

const MonetagAd = () => {
  const adRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current || !adRef.current) return;
    loaded.current = true;

    const script = document.createElement('script');
    script.src = 'https://quge5.com/88/tag.min.js';
    script.setAttribute('data-zone', '210765');
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    adRef.current.appendChild(script);
  }, []);

  return <div ref={adRef} className="w-full flex justify-center my-2" />;
};

export default MonetagAd;
