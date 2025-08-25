
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  isSlowDevice: boolean;
}

const AppPerformanceManager: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    isSlowDevice: false
  });

  useEffect(() => {
    // Performance monitoring
    const startTime = performance.now();

    // Check device capabilities
    const connection = (navigator as any).connection;
    const isSlowConnection = connection?.effectiveType === '2g' || connection?.effectiveType === 'slow-2g';
    const isSlowDevice = navigator.hardwareConcurrency <= 2;

    // Monitor page load
    const handleLoad = () => {
      const loadTime = performance.now() - startTime;
      
      setMetrics({
        loadTime: Math.round(loadTime),
        renderTime: Math.round(performance.now() - startTime),
        memoryUsage: (performance as any).memory ? 
          Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024) : 0,
        isSlowDevice: isSlowDevice
      });

      // Silent optimization - no toasts to users
      if (loadTime > 3000 || isSlowConnection) {
        // Apply optimizations silently
        document.documentElement.style.setProperty('--animation-duration', '0.1s');
      }
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
    }

    // Monitor memory usage less frequently for better performance
    const memoryCheck = setInterval(() => {
      if ((performance as any).memory) {
        const memUsage = (performance as any).memory.usedJSHeapSize / 1024 / 1024;
        if (memUsage > 150) {
          // Silent cleanup - no warnings to users
          if (window.gc) {
            window.gc();
          }
        }
      }
    }, 60000); // Check every minute instead of 30 seconds

    return () => {
      window.removeEventListener('load', handleLoad);
      clearInterval(memoryCheck);
    };
  }, []);

  // Performance optimizations
  useEffect(() => {
    // Optimize images loading
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      img.loading = 'lazy';
      if (!img.alt) img.alt = 'Study AI Image';
    });

    // Optimize scroll performance
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          ticking = false;
        });
        ticking = true;
      }
    };

    document.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      document.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return null; // This is a utility component
};

export default AppPerformanceManager;
